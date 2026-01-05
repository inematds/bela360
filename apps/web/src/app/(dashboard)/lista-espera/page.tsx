'use client';

import { useState, useEffect } from 'react';
import { Clock, UserPlus, Phone, Calendar, Sun, Sunset, Moon, Check, X } from 'lucide-react';

interface WaitlistEntry {
  id: string;
  client: { name: string; phone: string };
  service: { name: string };
  professional?: { name: string };
  desiredDate: string;
  desiredPeriod: string;
  status: string;
  priority: number;
  createdAt: string;
}

const periodIcons = {
  MORNING: Sun,
  AFTERNOON: Sunset,
  EVENING: Moon,
  ANY: Clock,
};

const periodLabels = {
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde',
  EVENING: 'Noite',
  ANY: 'Qualquer',
};

export default function ListaEsperaPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // Simulated data - replace with API call
    setEntries([
      {
        id: '1',
        client: { name: 'Maria Silva', phone: '(11) 99999-0001' },
        service: { name: 'Corte Feminino' },
        professional: { name: 'Ana Paula' },
        desiredDate: '2026-01-10',
        desiredPeriod: 'MORNING',
        status: 'WAITING',
        priority: 1,
        createdAt: '2026-01-03',
      },
      {
        id: '2',
        client: { name: 'João Santos', phone: '(11) 99999-0002' },
        service: { name: 'Barba' },
        desiredDate: '2026-01-08',
        desiredPeriod: 'AFTERNOON',
        status: 'WAITING',
        priority: 2,
        createdAt: '2026-01-04',
      },
      {
        id: '3',
        client: { name: 'Carla Oliveira', phone: '(11) 99999-0003' },
        service: { name: 'Manicure' },
        desiredDate: '2026-01-07',
        desiredPeriod: 'ANY',
        status: 'NOTIFIED',
        priority: 3,
        createdAt: '2026-01-02',
      },
    ]);
    setLoading(false);
  }, []);

  const handleNotify = (id: string) => {
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, status: 'NOTIFIED' } : e))
    );
  };

  const handleRemove = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-500" />
            Lista de Espera
          </h1>
          <p className="text-muted-foreground">
            Gerencie clientes aguardando horários disponíveis
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Aguardando</p>
          <p className="text-2xl font-bold text-yellow-500">
            {entries.filter(e => e.status === 'WAITING').length}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Notificados</p>
          <p className="text-2xl font-bold text-blue-500">
            {entries.filter(e => e.status === 'NOTIFIED').length}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total na Lista</p>
          <p className="text-2xl font-bold">{entries.length}</p>
        </div>
      </div>

      {/* Waitlist Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">#</th>
              <th className="text-left p-4 font-medium">Cliente</th>
              <th className="text-left p-4 font-medium">Serviço</th>
              <th className="text-left p-4 font-medium">Data Desejada</th>
              <th className="text-left p-4 font-medium">Período</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              const PeriodIcon = periodIcons[entry.desiredPeriod as keyof typeof periodIcons] || Clock;
              return (
                <tr key={entry.id} className="border-t hover:bg-muted/30">
                  <td className="p-4 text-muted-foreground">{index + 1}</td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{entry.client.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {entry.client.phone}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p>{entry.service.name}</p>
                    {entry.professional && (
                      <p className="text-sm text-muted-foreground">
                        c/ {entry.professional.name}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(entry.desiredDate).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <PeriodIcon className="h-4 w-4 text-muted-foreground" />
                      {periodLabels[entry.desiredPeriod as keyof typeof periodLabels]}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.status === 'WAITING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : entry.status === 'NOTIFIED'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {entry.status === 'WAITING' ? 'Aguardando' :
                       entry.status === 'NOTIFIED' ? 'Notificado' : 'Convertido'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {entry.status === 'WAITING' && (
                        <button
                          onClick={() => handleNotify(entry.id)}
                          className="p-2 hover:bg-muted rounded-lg text-blue-500"
                          title="Notificar"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(entry.id)}
                        className="p-2 hover:bg-muted rounded-lg text-red-500"
                        title="Remover"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {entries.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum cliente na lista de espera
          </div>
        )}
      </div>
    </div>
  );
}
