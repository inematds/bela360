'use client';

import { useState, useEffect } from 'react';

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  totalVisits: number;
  totalSpent: number;
  birthdate?: string;
  notes?: string;
}

const initialClients: Client[] = [
  { id: '1', name: 'Maria Silva', phone: '11999887766', email: 'maria@email.com', lastVisit: '2024-01-15', totalVisits: 12, totalSpent: 1240 },
  { id: '2', name: 'Joao Santos', phone: '11988776655', email: 'joao@email.com', lastVisit: '2024-01-20', totalVisits: 8, totalSpent: 640 },
  { id: '3', name: 'Carla Oliveira', phone: '11977665544', email: 'carla@email.com', lastVisit: '2024-01-18', totalVisits: 5, totalSpent: 890 },
  { id: '4', name: 'Pedro Costa', phone: '11966554433', email: 'pedro@email.com', lastVisit: '2024-01-22', totalVisits: 15, totalSpent: 1800 },
  { id: '5', name: 'Ana Souza', phone: '11955443322', email: 'ana@email.com', lastVisit: '2024-01-10', totalVisits: 3, totalSpent: 350 },
];

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthdate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const filteredClients = clients.filter(
    client =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search) ||
      client.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenProfile = (client: Client) => {
    setSelectedClient(client);
    setShowProfileModal(true);
  };

  const handleCloseModals = () => {
    setShowNewModal(false);
    setShowProfileModal(false);
    setSelectedClient(null);
    setFormData({ name: '', phone: '', email: '', birthdate: '', notes: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Nome e telefone sao obrigatorios');
      return;
    }

    setSaving(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const newClient: Client = {
      id: Date.now().toString(),
      name: formData.name,
      phone: formData.phone.replace(/\D/g, ''),
      email: formData.email,
      birthdate: formData.birthdate,
      notes: formData.notes,
      lastVisit: new Date().toISOString().split('T')[0],
      totalVisits: 0,
      totalSpent: 0,
    };

    setClients(prev => [newClient, ...prev]);
    handleCloseModals();
    setSaving(false);
  };

  const formatPhone = (phone: string) => {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-600">{clients.length} clientes cadastrados</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          + Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone ou email..."
          className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ultima Visita
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Visitas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Gasto
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatPhone(client.phone)}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(client.lastVisit)}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {client.totalVisits}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatCurrency(client.totalSpent)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleOpenProfile(client)}
                    className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                  >
                    Ver perfil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Client Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Novo Cliente</h2>
            <form onSubmit={handleSubmitNewClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nome do cliente"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento (opcional)
                </label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observacoes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Observacoes sobre o cliente..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Profile Modal */}
      {showProfileModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xl font-bold">
                  {selectedClient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedClient.name}</h2>
                  <p className="text-gray-500">{formatPhone(selectedClient.phone)}</p>
                </div>
              </div>
              <button
                onClick={handleCloseModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{selectedClient.totalVisits}</p>
                <p className="text-sm text-gray-500">Visitas</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedClient.totalSpent)}</p>
                <p className="text-sm text-gray-500">Total Gasto</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Email</span>
                <span>{selectedClient.email || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Ultima Visita</span>
                <span>{formatDate(selectedClient.lastVisit)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Aniversario</span>
                <span>{selectedClient.birthdate ? formatDate(selectedClient.birthdate) : '-'}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.open(`https://wa.me/55${selectedClient.phone}`, '_blank')}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
              <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
