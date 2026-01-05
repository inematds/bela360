'use client';

import { useState } from 'react';

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  professionalId: string;
  time: string;
  date: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

const professionals = [
  { id: '1', name: 'Ana', color: '#7C3AED' },
  { id: '2', name: 'Carlos', color: '#EC4899' },
  { id: '3', name: 'Julia', color: '#10B981' },
];

const services = [
  { name: 'Corte Feminino', duration: 60 },
  { name: 'Corte Masculino', duration: 30 },
  { name: 'Escova', duration: 45 },
  { name: 'Coloracao', duration: 120 },
  { name: 'Barba', duration: 30 },
];

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
];

const initialAppointments: Appointment[] = [
  { id: '1', clientName: 'Maria Silva', service: 'Corte + Escova', professionalId: '1', time: '09:00', date: new Date().toISOString().split('T')[0], duration: 60, status: 'confirmed' },
  { id: '2', clientName: 'Joao Santos', service: 'Barba', professionalId: '2', time: '09:30', date: new Date().toISOString().split('T')[0], duration: 30, status: 'confirmed' },
  { id: '3', clientName: 'Carla Oliveira', service: 'Coloracao', professionalId: '1', time: '10:30', date: new Date().toISOString().split('T')[0], duration: 120, status: 'pending' },
  { id: '4', clientName: 'Pedro Costa', service: 'Corte Masculino', professionalId: '2', time: '11:00', date: new Date().toISOString().split('T')[0], duration: 30, status: 'confirmed' },
];

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ professionalId: string; time: string } | null>(null);
  const [formData, setFormData] = useState({
    clientName: '',
    service: '',
    professionalId: '',
    date: selectedDate,
    time: '09:00',
  });
  const [saving, setSaving] = useState(false);

  const getAppointmentForSlot = (professionalId: string, time: string) => {
    return appointments.find(
      apt => apt.professionalId === professionalId && apt.time === time && apt.date === selectedDate
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleCloseModals = () => {
    setShowNewModal(false);
    setShowDetailsModal(false);
    setSelectedAppointment(null);
    setSelectedSlot(null);
    setFormData({ clientName: '', service: '', professionalId: '', date: selectedDate, time: '09:00' });
  };

  const handleSlotClick = (professionalId: string, time: string) => {
    const existing = getAppointmentForSlot(professionalId, time);
    if (existing) {
      setSelectedAppointment(existing);
      setShowDetailsModal(true);
    } else {
      setSelectedSlot({ professionalId, time });
      setFormData(prev => ({ ...prev, professionalId, time, date: selectedDate }));
      setShowNewModal(true);
    }
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.service || !formData.professionalId) {
      alert('Preencha todos os campos obrigatorios');
      return;
    }

    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const service = services.find(s => s.name === formData.service);
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      clientName: formData.clientName,
      service: formData.service,
      professionalId: formData.professionalId,
      date: formData.date,
      time: formData.time,
      duration: service?.duration || 60,
      status: 'pending',
    };

    setAppointments(prev => [...prev, newAppointment]);
    handleCloseModals();
    setSaving(false);
  };

  const handleConfirmAppointment = () => {
    if (!selectedAppointment) return;
    setAppointments(prev => prev.map(apt =>
      apt.id === selectedAppointment.id ? { ...apt, status: 'confirmed' } : apt
    ));
    handleCloseModals();
  };

  const handleCancelAppointment = () => {
    if (!selectedAppointment) return;
    if (confirm('Deseja realmente cancelar este agendamento?')) {
      setAppointments(prev => prev.filter(apt => apt.id !== selectedAppointment.id));
      handleCloseModals();
    }
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
                    onClick={() => handleSlotClick(prof.id, time)}
                    className="p-1 min-h-[50px] border-l border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {appointment && (
                      <div
                        className={`p-2 rounded text-xs ${
                          appointment.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : appointment.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
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
            <form onSubmit={handleSubmitAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Nome do cliente..."
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servico *
                </label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Selecione um servico</option>
                  {services.map((s) => (
                    <option key={s.name} value={s.name}>{s.name} ({s.duration}min)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profissional *
                </label>
                <select
                  value={formData.professionalId}
                  onChange={(e) => setFormData(prev => ({ ...prev, professionalId: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Selecione um profissional</option>
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
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horario
                  </label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {timeSlots.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Detalhes do Agendamento</h2>
              <button onClick={handleCloseModals} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Cliente</span>
                <span className="font-medium">{selectedAppointment.clientName}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Servico</span>
                <span>{selectedAppointment.service}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Profissional</span>
                <span>{professionals.find(p => p.id === selectedAppointment.professionalId)?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Horario</span>
                <span>{selectedAppointment.time} ({selectedAppointment.duration}min)</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  selectedAppointment.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedAppointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelAppointment}
                className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Cancelar
              </button>
              {selectedAppointment.status !== 'confirmed' && (
                <button
                  onClick={handleConfirmAppointment}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
