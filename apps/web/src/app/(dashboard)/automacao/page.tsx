'use client';

import { useState, useEffect } from 'react';
import { Zap, MessageSquare, Gift, UserX, Clock, ToggleLeft, ToggleRight } from 'lucide-react';

interface Automation {
  id: string;
  type: string;
  template: string;
  isActive: boolean;
  delayHours?: number;
  delayDays?: number;
  sendTime?: string;
}

const automationTypes = {
  POST_APPOINTMENT: { name: 'Pós-Atendimento', icon: MessageSquare, color: 'text-blue-500' },
  RETURN_REMINDER: { name: 'Lembrete de Retorno', icon: Clock, color: 'text-green-500' },
  BIRTHDAY: { name: 'Aniversário', icon: Gift, color: 'text-pink-500' },
  REACTIVATION: { name: 'Reativação', icon: UserX, color: 'text-orange-500' },
};

export default function AutomacaoPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sent: 0, pending: 0, failed: 0 });

  useEffect(() => {
    // Simulated data - replace with API call
    setAutomations([
      {
        id: '1',
        type: 'POST_APPOINTMENT',
        template: 'Olá {{nome}}! Obrigado pela visita hoje. Como foi seu {{servico}}? Avalie de 1 a 5',
        isActive: true,
        delayHours: 2,
      },
      {
        id: '2',
        type: 'RETURN_REMINDER',
        template: 'Oi {{nome}}! Já faz {{dias}} dias desde seu último {{servico}}. Que tal agendar?',
        isActive: false,
        delayDays: 30,
        sendTime: '10:00',
      },
      {
        id: '3',
        type: 'BIRTHDAY',
        template: 'Feliz aniversário, {{nome}}! Como presente, preparamos algo especial para você...',
        isActive: true,
        sendTime: '09:00',
      },
      {
        id: '4',
        type: 'REACTIVATION',
        template: 'Oi {{nome}}, sentimos sua falta! Faz tempo que não nos vemos. Que tal voltar?',
        isActive: false,
        delayDays: 60,
        sendTime: '10:00',
      },
    ]);
    setStats({ sent: 156, pending: 12, failed: 3 });
    setLoading(false);
  }, []);

  const toggleAutomation = (id: string) => {
    setAutomations(prev =>
      prev.map(a => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          Automação de Relacionamento
        </h1>
        <p className="text-muted-foreground">
          Configure mensagens automáticas para engajar seus clientes
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Mensagens Enviadas</p>
          <p className="text-2xl font-bold text-green-500">{stats.sent}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Falhas</p>
          <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
        </div>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Automações Configuradas</h2>

        {automations.map(automation => {
          const typeInfo = automationTypes[automation.type as keyof typeof automationTypes];
          const Icon = typeInfo?.icon || Zap;

          return (
            <div
              key={automation.id}
              className="bg-card rounded-lg border p-4 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-muted ${typeInfo?.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium">{typeInfo?.name || automation.type}</h3>
                  <p className="text-sm text-muted-foreground">{automation.template}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {automation.delayHours && (
                      <span>Enviar após: {automation.delayHours}h</span>
                    )}
                    {automation.delayDays && (
                      <span>Enviar após: {automation.delayDays} dias</span>
                    )}
                    {automation.sendTime && (
                      <span>Horário: {automation.sendTime}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleAutomation(automation.id)}
                className="flex items-center gap-2 text-sm"
              >
                {automation.isActive ? (
                  <ToggleRight className="h-8 w-8 text-green-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-muted-foreground" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
