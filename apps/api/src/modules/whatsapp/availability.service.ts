import { prisma } from '../../config';

interface AvailableSlot {
  time: string;
  label: string;     // "09:00" or "09:00 - 09:30"
}

const DAY_OF_WEEK_MAP: Record<number, string> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

/**
 * Get available time slots for a professional on a specific date
 */
export async function getAvailableSlots(
  businessId: string,
  professionalId: string,
  serviceId: string,
  date: string // YYYY-MM-DD format
): Promise<AvailableSlot[]> {
  const targetDate = new Date(date + 'T00:00:00');
  const dayOfWeek = DAY_OF_WEEK_MAP[targetDate.getDay()];

  // Get service duration
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { duration: true },
  });

  if (!service) {
    return [];
  }

  const serviceDuration = service.duration;

  // Get working hours for the professional (or business default)
  const workingHours = await prisma.workingHours.findFirst({
    where: {
      businessId,
      dayOfWeek: dayOfWeek as any,
      isActive: true,
      OR: [
        { professionalId },
        { professionalId: null }, // Business default
      ],
    },
    orderBy: {
      professionalId: 'desc', // Prefer professional-specific hours
    },
  });

  if (!workingHours) {
    return [];
  }

  // Parse working hours
  const [startHour, startMin] = workingHours.startTime.split(':').map(Number);
  const [endHour, endMin] = workingHours.endTime.split(':').map(Number);
  const breakStart = workingHours.breakStart
    ? workingHours.breakStart.split(':').map(Number)
    : null;
  const breakEnd = workingHours.breakEnd
    ? workingHours.breakEnd.split(':').map(Number)
    : null;

  // Get existing appointments for the day
  const startOfDay = new Date(date + 'T00:00:00');
  const endOfDay = new Date(date + 'T23:59:59');

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      professionalId,
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // Generate time slots
  const slots: AvailableSlot[] = [];
  const slotInterval = 30; // 30-minute intervals

  let currentHour = startHour;
  let currentMin = startMin;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMin < endMin)
  ) {
    const slotTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    const slotStart = new Date(`${date}T${slotTime}:00`);
    const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60 * 1000);

    // Check if slot is in break time
    let isInBreak = false;
    if (breakStart && breakEnd) {
      const breakStartMin = breakStart[0] * 60 + breakStart[1];
      const breakEndMin = breakEnd[0] * 60 + breakEnd[1];
      const slotMin = currentHour * 60 + currentMin;
      const slotEndMin = slotMin + serviceDuration;

      isInBreak =
        (slotMin >= breakStartMin && slotMin < breakEndMin) ||
        (slotEndMin > breakStartMin && slotEndMin <= breakEndMin);
    }

    // Check if slot conflicts with existing appointments
    const hasConflict = existingAppointments.some(apt => {
      const aptStart = apt.startTime.getTime();
      const aptEnd = apt.endTime.getTime();
      const slotStartTime = slotStart.getTime();
      const slotEndTime = slotEnd.getTime();

      return (
        (slotStartTime >= aptStart && slotStartTime < aptEnd) ||
        (slotEndTime > aptStart && slotEndTime <= aptEnd) ||
        (slotStartTime <= aptStart && slotEndTime >= aptEnd)
      );
    });

    // Check if slot is in the past (if today)
    const now = new Date();
    const isPast = slotStart < now;

    // Check if slot ends within working hours
    const endHourMinutes = endHour * 60 + endMin;
    const slotEndMinutes =
      slotEnd.getHours() * 60 + slotEnd.getMinutes();
    const fitsInWorkingHours = slotEndMinutes <= endHourMinutes;

    if (!isInBreak && !hasConflict && !isPast && fitsInWorkingHours) {
      slots.push({
        time: slotTime,
        label: slotTime,
      });
    }

    // Move to next slot
    currentMin += slotInterval;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  return slots;
}

/**
 * Get available dates for the next N days
 */
export async function getAvailableDates(
  businessId: string,
  professionalId: string,
  serviceId: string,
  daysAhead: number = 14
): Promise<{ date: string; label: string; dayName: string }[]> {
  const availableDates: { date: string; label: string; dayName: string }[] = [];
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const dateStr = date.toISOString().split('T')[0];
    const slots = await getAvailableSlots(businessId, professionalId, serviceId, dateStr);

    if (slots.length > 0) {
      const dayName = dayNames[date.getDay()];
      const label = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} (${dayName})`;

      availableDates.push({
        date: dateStr,
        label,
        dayName,
      });
    }
  }

  return availableDates;
}

/**
 * Create an appointment
 */
export async function createAppointment(
  businessId: string,
  clientId: string,
  professionalId: string,
  serviceId: string,
  date: string,
  time: string
): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  try {
    // Get service duration
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { duration: true },
    });

    if (!service) {
      return { success: false, error: 'Serviço não encontrado' };
    }

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000);

    // Double-check availability
    const slots = await getAvailableSlots(businessId, professionalId, serviceId, date);
    const isAvailable = slots.some(s => s.time === time);

    if (!isAvailable) {
      return { success: false, error: 'Horário não disponível' };
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        clientId,
        professionalId,
        serviceId,
        startTime,
        endTime,
        status: 'PENDING',
      },
    });

    return { success: true, appointmentId: appointment.id };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return { success: false, error: 'Erro ao criar agendamento' };
  }
}
