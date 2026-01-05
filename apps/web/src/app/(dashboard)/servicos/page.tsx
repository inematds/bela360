'use client';

import { useState } from 'react';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  professionals: string[];
  active: boolean;
}

const availableProfessionals = ['Ana', 'Carlos', 'Julia'];

const initialServices: Service[] = [
  { id: '1', name: 'Corte Feminino', duration: 60, price: 80, professionals: ['Ana', 'Julia'], active: true },
  { id: '2', name: 'Corte Masculino', duration: 30, price: 45, professionals: ['Carlos'], active: true },
  { id: '3', name: 'Escova', duration: 45, price: 60, professionals: ['Ana', 'Julia'], active: true },
  { id: '4', name: 'Coloracao', duration: 120, price: 180, professionals: ['Ana'], active: true },
  { id: '5', name: 'Barba', duration: 30, price: 35, professionals: ['Carlos'], active: true },
  { id: '6', name: 'Hidratacao', duration: 60, price: 90, professionals: ['Ana', 'Julia'], active: true },
  { id: '7', name: 'Progressiva', duration: 180, price: 250, professionals: ['Ana'], active: false },
];

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    professionals: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const filteredServices = services.filter(
    service => showInactive || service.active
  );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', duration: 60, price: 0, professionals: [] });
    setSelectedService(null);
  };

  const handleCloseModals = () => {
    setShowNewModal(false);
    setShowEditModal(false);
    resetForm();
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
      professionals: service.professionals,
    });
    setShowEditModal(true);
  };

  const handleProfessionalToggle = (prof: string) => {
    setFormData(prev => ({
      ...prev,
      professionals: prev.professionals.includes(prof)
        ? prev.professionals.filter(p => p !== prof)
        : [...prev.professionals, prof],
    }));
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0) {
      alert('Nome e preco sao obrigatorios');
      return;
    }

    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newService: Service = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      duration: formData.duration,
      price: formData.price,
      professionals: formData.professionals,
      active: true,
    };

    setServices(prev => [...prev, newService]);
    handleCloseModals();
    setSaving(false);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !formData.name) return;

    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setServices(prev => prev.map(s =>
      s.id === selectedService.id
        ? { ...s, ...formData }
        : s
    ));
    handleCloseModals();
    setSaving(false);
  };

  const handleToggleActive = async (service: Service) => {
    setServices(prev => prev.map(s =>
      s.id === service.id ? { ...s, active: !s.active } : s
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Servicos</h1>
          <p className="text-gray-600">{services.filter(s => s.active).length} servicos ativos</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Mostrar inativos
          </label>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Novo Servico
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`bg-white rounded-lg border p-6 ${
              service.active ? 'border-gray-200' : 'border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">{service.name}</h3>
                <p className="text-sm text-gray-500">{formatDuration(service.duration)}</p>
              </div>
              <span className="text-lg font-bold text-purple-600">
                {formatCurrency(service.price)}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Profissionais:</p>
              <div className="flex flex-wrap gap-2">
                {service.professionals.map((prof) => (
                  <span
                    key={prof}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {prof}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => handleToggleActive(service)}
                className={`text-xs font-medium cursor-pointer hover:underline ${
                  service.active ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {service.active ? 'Ativo' : 'Inativo'}
              </button>
              <button
                onClick={() => handleEdit(service)}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Service Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Novo Servico</h2>
            <form onSubmit={handleSubmitNew} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do servico *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Corte Feminino"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descricao do servico..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duracao (minutos)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    min="15"
                    step="15"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preco (R$) *
                  </label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="80.00"
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profissionais que realizam
                </label>
                <div className="space-y-2">
                  {availableProfessionals.map((prof) => (
                    <label key={prof} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.professionals.includes(prof)}
                        onChange={() => handleProfessionalToggle(prof)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{prof}</span>
                    </label>
                  ))}
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
                  {saving ? 'Salvando...' : 'Criar Servico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Servico</h2>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do servico *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duracao (minutos)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    min="15"
                    step="15"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preco (R$) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profissionais que realizam
                </label>
                <div className="space-y-2">
                  {availableProfessionals.map((prof) => (
                    <label key={prof} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.professionals.includes(prof)}
                        onChange={() => handleProfessionalToggle(prof)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{prof}</span>
                    </label>
                  ))}
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
                  {saving ? 'Salvando...' : 'Salvar Alteracoes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
