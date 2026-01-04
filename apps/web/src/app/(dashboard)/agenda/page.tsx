'use client';

import { useState } from 'react';

const professionals = [
  { id: '1', name: 'Ana', color: '#7C3AED' },
  { id: '2', name: 'Carlos', color: '#EC4899' },
  { id: '3', name: 'Julia', color: '#10B981' },
];

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
];

const mockAppointments = [
  { id: '1', clientName: 'Maria Silva', service: 'Corte + Escova', professionalId: '1', time: '09:00', duration: 60, status: 'confirmed' },
  { id: '2', clientName: 'Joao Santos', service: 'Barba', professionalId: '2', time: '09:30', duration: 30, status: 'confirmed' },
  { id: '3', clientName: 'Carla Oliveira', service: 'Coloracao', professionalId: '1', time: '10:30', duration: 120, status: 'pending' },
  { id: '4', clientName: 'Pedro Costa', service: 'Corte Masculino', professionalId: '2', time: '11:00', duration: 30, status: 'confirmed' },
];

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewModal, setShowNewModal] = useState(false);

  const getAppointmentForSlot = (professionalId: string, time: string) => {
    return mockAppointments.find(
      apt => apt.professionalId === professionalId && apt.time === time
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
          <p className="text-gray-600 capitalize">{formatDate(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Novo Agendamento
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[80px_repeat(3,1fr)] border-b border-gray-200">
          <div className="p-4 bg-gray-50" />
          {professionals.map((prof) => (
            <div
              key={prof.id}
              className="p-4 text-center font-medium border-l border-gray-200"
              style={{ backgroundColor: `${prof.color}10` }}
            >
              <div
                className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: prof.color }}
              >
                {prof.name[0]}
              </div>
              {prof.name}
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-[80px_repeat(3,1fr)] border-b border-gray-100">
              <div className="p-2 text-sm text-gray-500 text-right pr-4 bg-gray-50">
                {time}
              </div>
              {professionals.map((prof) => {
                const appointment = getAppointmentForSlot(prof.id, time);
                return (
                  <div
                    key={`${prof.id}-${time}`}
                    className="p-1 min-h-[50px] border-l border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    {appointment && (
                      <div
                        className={`p-2 rounded text-xs ${
                          appointment.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <p className="font-medium truncate">{appointment.clientName}</p>
                        <p className="truncate">{appointment.service}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded" />
          <span className="text-gray-600">Confirmado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 rounded" />
          <span className="text-gray-600">Pendente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded" />
          <span className="text-gray-600">Cancelado</span>
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Novo Agendamento</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servico
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option>Selecione um servico</option>
                  <option>Corte Feminino</option>
                  <option>Corte Masculino</option>
                  <option>Escova</option>
                  <option>Coloracao</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profissional
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option>Selecione um profissional</option>
                  {professionals.map((prof) => (
                    <option key={prof.id} value={prof.id}>{prof.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    defaultValue={selectedDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horario
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
