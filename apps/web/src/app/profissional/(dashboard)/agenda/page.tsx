'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { Skeleton, SkeletonList } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

interface Appointment {
  id: string;
  time: string;
  endTime: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  price: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export default function ProfessionalAgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate week dates
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  useEffect(() => {
    // Simulated data - in production would fetch from API
    setAppointments([
      {
        id: '1',
        time: '09:00',
        endTime: '10:00',
        clientName: 'Ana Paula',
        clientPhone: '(11) 99999-1111',
        serviceName: 'Corte Feminino',
        price: 80,
        status: 'CONFIRMED',
      },
      {
        id: '2',
        time: '10:30',
        endTime: '11:00',
        clientName: 'Carlos Lima',
        clientPhone: '(11) 99999-2222',
        serviceName: 'Corte Masculino',
        price: 45,
        status: 'CONFIRMED',
      },
      {
        id: '3',
        time: '14:00',
        endTime: '15:00',
        clientName: 'Maria Silva',
        clientPhone: '(11) 99999-3333',
        serviceName: 'Corte e Escova',
        price: 140,
        status: 'PENDING',
      },
      {
        id: '4',
        time: '16:00',
        endTime: '18:00',
        clientName: 'Fernanda Souza',
        clientPhone: '(11) 99999-4444',
        serviceName: 'Coloracao',
        price: 180,
        status: 'CONFIRMED',
      },
    ]);
    setLoading(false);
  }, [selectedDate]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'border-l-green-500 bg-green-50';
      case 'CONFIRMED':
        return 'border-l-blue-500 bg-blue-50';
      case 'PENDING':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'CANCELLED':
        return 'border-l-red-500 bg-red-50';
      case 'NO_SHOW':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-300 bg-white';
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Minha Agenda</h1>
        <p className="text-gray-600">Seus atendimentos agendados</p>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <h2 className="font-semibold text-gray-800">
            {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>

          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => (
            <button
              key={index}
              onClick={() => setSelectedDate(date)}
              className={`p-3 rounded-lg text-center transition-all ${
                isSelected(date)
                  ? 'bg-indigo-600 text-white'
                  : isToday(date)
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <p className="text-xs font-medium">{weekDays[date.getDay()]}</p>
              <p className="text-lg font-bold">{date.getDate()}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Day Summary */}
      <div className="flex items-center justify-between bg-indigo-50 rounded-xl p-4">
        <div>
          <p className="text-indigo-600 text-sm">
            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-xl font-bold text-gray-800">{appointments.length} atendimentos</p>
        </div>
        <div className="text-right">
          <p className="text-indigo-600 text-sm">Total do dia</p>
          <p className="text-xl font-bold text-gray-800">
            {formatCurrency(appointments.reduce((sum, a) => sum + a.price, 0))}
          </p>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-4">
            <SkeletonList count={4} />
          </div>
        ) : appointments.length > 0 ? (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className={`bg-white rounded-xl border border-gray-200 p-4 border-l-4 ${getStatusColor(appointment.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="text-center bg-gray-100 rounded-lg p-3">
                    <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                    <p className="font-bold text-gray-800">{appointment.time}</p>
                    <p className="text-xs text-gray-500">{appointment.endTime}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800">{appointment.clientName}</h3>
                    <p className="text-gray-600">{appointment.serviceName}</p>
                    <p className="text-sm text-gray-500 mt-1">{appointment.clientPhone}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-indigo-600">{formatCurrency(appointment.price)}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-200">
            <EmptyState
              icon="calendar"
              title="Agenda livre"
              description="Nenhum atendimento agendado para este dia"
            />
          </div>
        )}
      </div>
    </div>
  );
}
