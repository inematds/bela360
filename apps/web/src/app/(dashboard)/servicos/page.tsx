'use client';

import { useState } from 'react';

const mockServices = [
  { id: '1', name: 'Corte Feminino', duration: 60, price: 80, professionals: ['Ana', 'Julia'], active: true },
  { id: '2', name: 'Corte Masculino', duration: 30, price: 45, professionals: ['Carlos'], active: true },
  { id: '3', name: 'Escova', duration: 45, price: 60, professionals: ['Ana', 'Julia'], active: true },
  { id: '4', name: 'Coloracao', duration: 120, price: 180, professionals: ['Ana'], active: true },
  { id: '5', name: 'Barba', duration: 30, price: 35, professionals: ['Carlos'], active: true },
  { id: '6', name: 'Hidratacao', duration: 60, price: 90, professionals: ['Ana', 'Julia'], active: true },
  { id: '7', name: 'Progressiva', duration: 180, price: 250, professionals: ['Ana'], active: false },
];

export default function ServicosPage() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const filteredServices = mockServices.filter(
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Servicos</h1>
          <p className="text-gray-600">{mockServices.filter(s => s.active).length} servicos ativos</p>
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
              <span
                className={`text-xs font-medium ${
                  service.active ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {service.active ? 'Ativo' : 'Inativo'}
              </span>
              <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
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
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do servico
                </label>
                <input
                  type="text"
                  placeholder="Ex: Corte Feminino"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao (opcional)
                </label>
                <textarea
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
                    placeholder="60"
                    min="15"
                    step="15"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preco (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="80.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profissionais que realizam
                </label>
                <div className="space-y-2">
                  {['Ana', 'Carlos', 'Julia'].map((prof) => (
                    <label key={prof} className="flex items-center gap-2">
                      <input
                        type="checkbox"
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
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Criar Servico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
