import { prisma, logger } from '../../config';
import { AppointmentStatus } from '@prisma/client';
import { AppError } from '../../common/errors';
import { reminderQueue, sendQueue } from '../whatsapp/whatsapp.queue';
import { clientsService } from '../clients/clients.service';

interface CreateAppointmentDTO {
  businessId: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  startTime: Date;
  notes?: string;
}

interface UpdateAppointmentDTO {
  professionalId?: string;
  serviceId?: string;
  startTime?: Date;
  notes?: string;
  status?: AppointmentStatus;
}

interface AvailabilitySlot {
  time: string;
  available: boolean;
}

export class AppointmentsService {
  /**
   * Create new appointment
   */
  async create(data: CreateAppointmentDTO): Promise<any> {
    // Get service for duration
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
    });

    if (!service) {
      throw new AppError('Serviço não encontrado', 404);
    }

    // Calculate end time
    const endTime = new Date(data.startTime);
    endTime.setMinutes(endTime.getMinutes() + service.duration);

    // Check for conflicts
    const conflict = await this.checkConflict(
      data.professionalId,
      data.startTime,
      endTime
    );

    if (conflict) {
      throw new AppError('Horário não disponível', 409);
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        businessId: data.businessId,
        clientId: data.clientId,
        professionalId: data.professionalId,
        serviceId: data.serviceId,
        startTime: data.startTime,
        endTime,
        status: 'PENDING',
        notes: data.notes,
      },
      include: {
        client: true,
        professional: { select: { id: true, name: true, phone: true } },
        service: true,
        business: true,
      },
    });

    // Schedule reminder (24h before)
    const reminderTime = new Date(data.startTime);
    reminderTime.setHours(reminderTime.getHours() - 24);

    if (reminderTime > new Date()) {
      await reminderQueue.add(
        'send-reminder',
        { appointmentId: appointment.id },
        {
          delay: reminderTime.getTime() - Date.now(),
          jobId: `reminder_${appointment.id}`,
        }
      );
    }

    // Send confirmation message
    await this.sendConfirmationMessage(appointment);

    logger.info(
      { businessId: data.businessId, appointmentId: appointment.id },
      'Appointment created'
    );

    return appointment;
  }

  /**
   * Get appointments for a business
   */
  async getAll(
    businessId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      professionalId?: string;
      status?: AppointmentStatus;
      clientId?: string;
    } = {},
    page = 1,
    limit = 50
  ): Promise<{ appointments: any[]; total: number }> {
    const where: any = { businessId };

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) where.startTime.gte = filters.startDate;
      if (filters.endDate) where.startTime.lte = filters.endDate;
    }

    if (filters.professionalId) {
      where.professionalId = filters.professionalId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, phone: true } },
          professional: { select: { id: true, name: true, color: true } },
          service: { select: { id: true, name: true, duration: true, price: true } },
        },
        orderBy: { startTime: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return { appointments, total };
  }

  /**
   * Get appointment by ID
   */
  async getById(id: string): Promise<any> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        professional: true,
        service: true,
        business: true,
      },
    });

    if (!appointment) {
      throw new AppError('Agendamento não encontrado', 404);
    }

    return appointment;
  }

  /**
   * Update appointment
   */
  async update(id: string, data: UpdateAppointmentDTO): Promise<any> {
    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!existing) {
      throw new AppError('Agendamento não encontrado', 404);
    }

    // If changing time or professional, check for conflicts
    if (data.startTime || data.professionalId) {
      const service = data.serviceId
        ? await prisma.service.findUnique({ where: { id: data.serviceId } })
        : existing.service;

      const startTime = data.startTime || existing.startTime;
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (service?.duration || existing.service.duration));

      const conflict = await this.checkConflict(
        data.professionalId || existing.professionalId,
        startTime,
        endTime,
        id
      );

      if (conflict) {
        throw new AppError('Horário não disponível', 409);
      }
    }

    let endTime = existing.endTime;
    if (data.startTime || data.serviceId) {
      const service = data.serviceId
        ? await prisma.service.findUnique({ where: { id: data.serviceId } })
        : existing.service;
      const startTime = data.startTime || existing.startTime;
      endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (service?.duration || 0));
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.professionalId && { professionalId: data.professionalId }),
        ...(data.serviceId && { serviceId: data.serviceId }),
        ...(data.startTime && { startTime: data.startTime }),
        endTime,
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status && { status: data.status }),
      },
      include: {
        client: true,
        professional: { select: { id: true, name: true } },
        service: true,
        business: true,
      },
    });

    logger.info({ appointmentId: id }, 'Appointment updated');

    return appointment;
  }

  /**
   * Confirm appointment
   */
  async confirm(id: string): Promise<any> {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: {
        client: true,
        professional: { select: { name: true } },
        service: true,
        business: true,
      },
    });

    // Send confirmation message
    const message = `Olá ${appointment.client.name}! ✅\n\nSeu agendamento foi confirmado:\n\n📅 ${appointment.startTime.toLocaleDateString('pt-BR')} às ${appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n💇 ${appointment.service.name}\n👤 Com ${appointment.professional.name}\n\nAté lá! 😊`;

    await sendQueue.add('send-message', {
      businessId: appointment.businessId,
      phone: appointment.client.phone,
      message,
    });

    logger.info({ appointmentId: id }, 'Appointment confirmed');

    return appointment;
  }

  /**
   * Cancel appointment
   */
  async cancel(id: string, reason?: string): Promise<any> {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
      },
      include: {
        client: true,
        professional: { select: { name: true } },
        service: true,
        business: true,
      },
    });

    // Remove scheduled reminder
    await reminderQueue.remove(`reminder_${id}`);

    // Send cancellation message
    const message = `Olá ${appointment.client.name},\n\nSeu agendamento foi cancelado:\n\n📅 ${appointment.startTime.toLocaleDateString('pt-BR')} às ${appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n💇 ${appointment.service.name}\n\n${reason ? `Motivo: ${reason}\n\n` : ''}Esperamos vê-lo(a) em breve! 😊`;

    await sendQueue.add('send-message', {
      businessId: appointment.businessId,
      phone: appointment.client.phone,
      message,
    });

    logger.info({ appointmentId: id, reason }, 'Appointment cancelled');

    return appointment;
  }

  /**
   * Mark appointment as completed
   */
  async complete(id: string): Promise<any> {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        client: true,
        service: true,
      },
    });

    // Update client stats
    await clientsService.updateStats(appointment.clientId);

    logger.info({ appointmentId: id }, 'Appointment completed');

    return appointment;
  }

  /**
   * Mark as no-show
   */
  async noShow(id: string): Promise<any> {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'NO_SHOW' },
    });

    logger.info({ appointmentId: id }, 'Appointment marked as no-show');

    return appointment;
  }

  /**
   * Get available time slots for a professional on a date
   */
  async getAvailability(
    businessId: string,
    professionalId: string,
    date: Date,
    serviceId: string
  ): Promise<AvailabilitySlot[]> {
    // Get service duration
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new AppError('Serviço não encontrado', 404);
    }

    // Get working hours for the day
    const dayOfWeek = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][date.getDay()];

    const workingHours = await prisma.workingHours.findFirst({
      where: {
        businessId,
        professionalId,
        dayOfWeek: dayOfWeek as any,
        isActive: true,
      },
    });

    if (!workingHours) {
      return []; // Not working on this day
    }

    // Get existing appointments for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      orderBy: { startTime: 'asc' },
    });

    // Generate time slots
    const slots: AvailabilitySlot[] = [];
    const slotDuration = 30; // 30-minute slots

    const [startHour, startMin] = workingHours.startTime.split(':').map(Number);
    const [endHour, endMin] = workingHours.endTime.split(':').map(Number);
    const [breakStartHour, breakStartMin] = workingHours.breakStart
      ? workingHours.breakStart.split(':').map(Number)
      : [null, null];
    const [breakEndHour, breakEndMin] = workingHours.breakEnd
      ? workingHours.breakEnd.split(':').map(Number)
      : [null, null];

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMin, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + service.duration);

      // Check if slot is during break
      let isDuringBreak = false;
      if (breakStartHour !== null && breakEndHour !== null) {
        const breakStart = new Date(date);
        breakStart.setHours(breakStartHour!, breakStartMin!, 0, 0);
        const breakEnd = new Date(date);
        breakEnd.setHours(breakEndHour!, breakEndMin!, 0, 0);

        isDuringBreak =
          (currentTime >= breakStart && currentTime < breakEnd) ||
          (slotEnd > breakStart && slotEnd <= breakEnd);
      }

      // Check if slot conflicts with existing appointments
      const hasConflict = appointments.some(
        apt =>
          (currentTime >= apt.startTime && currentTime < apt.endTime) ||
          (slotEnd > apt.startTime && slotEnd <= apt.endTime) ||
          (currentTime <= apt.startTime && slotEnd >= apt.endTime)
      );

      // Check if slot is in the past
      const isPast = currentTime < new Date();

      slots.push({
        time: currentTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        available: !isDuringBreak && !hasConflict && !isPast && slotEnd <= endTime,
      });

      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }

    return slots;
  }

  /**
   * Check for appointment conflicts
   */
  private async checkConflict(
    professionalId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<boolean> {
    const conflict = await prisma.appointment.findFirst({
      where: {
        professionalId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(excludeId && { id: { not: excludeId } }),
        OR: [
          { startTime: { gte: startTime, lt: endTime } },
          { endTime: { gt: startTime, lte: endTime } },
          {
            AND: [{ startTime: { lte: startTime } }, { endTime: { gte: endTime } }],
          },
        ],
      },
    });

    return !!conflict;
  }

  /**
   * Send confirmation message after booking
   */
  private async sendConfirmationMessage(appointment: any): Promise<void> {
    const message = `Olá ${appointment.client.name}! 📅\n\nSeu agendamento foi realizado:\n\n📅 ${appointment.startTime.toLocaleDateString('pt-BR')} às ${appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n💇 ${appointment.service.name}\n👤 Com ${appointment.professional.name}\n📍 ${appointment.business.name}\n\nEnviaremos um lembrete 24h antes. 😊`;

    await sendQueue.add('send-message', {
      businessId: appointment.businessId,
      phone: appointment.client.phone,
      message,
    });
  }
}

export const appointmentsService = new AppointmentsService();
