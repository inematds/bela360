'use client';

import { useState } from 'react';
import {
  Bell,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Calendar,
  User,
  Filter,
  RefreshCw,
} from 'lucide-react';

// Mock data - will be replaced with API calls
const mockNotificationStats = {
  todayReminders: 24,
  todayConfirmations: 18,
  deliveredRate: 96,
  readRate: 78,
};

const mockRecentMessages = [
  {
    id: '1',
    type: 'reminder',
    clientName: 'Maria Silva',
    clientPhone: '11999887766',
    content: 'Ola Maria! Lembrete: voce tem horario amanha as 14h para Corte + Escova com Ana.',
    status: 'read',
    createdAt: '2025-01-04T10:30:00',
  },
  {
    id: '2',
    type: 'confirmation',
    clientName: 'Joao Santos',
    clientPhone: '11988776655',
    content: 'Seu agendamento foi confirmado! Te esperamos dia 05/01 as 10h.',
    status: 'delivered',
    createdAt: '2025-01-04T10:15:00',
  },
  {
    id: '3',
    type: 'reminder',
    clientName: 'Carla Oliveira',
    clientPhone: '11977665544',
    content: 'Ola Carla! Lembrete: voce tem horario hoje as 15h para Coloracao com Maria.',
    status: 'sent',
    createdAt: '2025-01-04T09:45:00',
  },
  {
    id: '4',
    type: 'birthday',
    clientName: 'Pedro Costa',
    clientPhone: '11966554433',
    content: 'Feliz Aniversario, Pedro! Voce tem 10% de desconto hoje. Use o codigo NIVER10.',
    status: 'read',
    createdAt: '2025-01-04T08:00:00',
  },
  {
    id: '5',
    type: 'reactivation',
    clientName: 'Ana Souza',
    clientPhone: '11955443322',
    content: 'Ola Ana! Sentimos sua falta. Que tal agendar um horario? Temos uma oferta especial!',
    status: 'delivered',
    createdAt: '2025-01-03T16:00:00',
  },
  {
    id: '6',
    type: 'reminder',
    clientName: 'Lucas Ferreira',
    clientPhone: '11944332211',
    content: 'Ola Lucas! Lembrete: voce tem horario amanha as 09h para Barba com Carlos.',
    status: 'failed',
    createdAt: '2025-01-03T14:30:00',
  },
];

const mockScheduledNotifications = [
  {
    id: '1',
    type: 'reminder',
    clientName: 'Fernanda Lima',
    scheduledFor: '2025-01-04T12:00:00',
    appointmentTime: '2025-01-05T14:00:00',
    service: 'Manicure',
  },
  {
    id: '2',
    type: 'reminder',
    clientName: 'Roberto Alves',
    scheduledFor: '2025-01-04T14:00:00',
    appointmentTime: '2025-01-05T16:00:00',
    service: 'Corte Masculino',
  },
  {
    id: '3',
    type: 'confirmation_request',
    clientName: 'Juliana Martins',
    scheduledFor: '2025-01-04T16:00:00',
    appointmentTime: '2025-01-04T18:00:00',
    service: 'Escova',
  },
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'read':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'delivered':
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    case 'sent':
      return <Send className="w-4 h-4 text-gray-400" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'read':
      return 'Lida';
    case 'delivered':
      return 'Entregue';
    case 'sent':
      return 'Enviada';
    case 'failed':
      return 'Falhou';
    default:
      return 'Pendente';
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'reminder':
      return { label: 'Lembrete', color: 'bg-purple-100 text-purple-700' };
    case 'confirmation':
      return { label: 'Confirmacao', color: 'bg-green-100 text-green-700' };
    case 'birthday':
      return { label: 'Aniversario', color: 'bg-pink-100 text-pink-700' };
    case 'reactivation':
      return { label: 'Reativacao', color: 'bg-orange-100 text-orange-700' };
    case 'confirmation_request':
      return { label: 'Pedir Confirmacao', color: 'bg-blue-100 text-blue-700' };
    default:
      return { label: 'Mensagem', color: 'bg-gray-100 text-gray-700' };
  }
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificacoesPage() {
  const [filter, setFilter] = useState<'all' | 'reminder' | 'confirmation' | 'birthday' | 'reactivation'>('all');
  const stats = mockNotificationStats;

  const filteredMessages = filter === 'all'
    ? mockRecentMessages
    : mockRecentMessages.filter(m => m.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notificacoes</h1>
          <p className="text-gray-600">Acompanhe os lembretes e mensagens automaticas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Lembretes Hoje</span>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-4">{stats.todayReminders}</p>
          <p className="text-sm text-gray-500 mt-1">mensagens enviadas</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Confirmacoes</span>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-4">{stats.todayConfirmations}</p>
          <p className="text-sm text-gray-500 mt-1">clientes confirmaram</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Taxa de Entrega</span>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-4">{stats.deliveredRate}%</p>
          <p className="text-sm text-gray-500 mt-1">mensagens entregues</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Taxa de Leitura</span>
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-pink-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-4">{stats.readRate}%</p>
          <p className="text-sm text-gray-500 mt-1">mensagens lidas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Messages */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Mensagens Recentes</h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todas</option>
                  <option value="reminder">Lembretes</option>
                  <option value="confirmation">Confirmacoes</option>
                  <option value="birthday">Aniversarios</option>
                  <option value="reactivation">Reativacao</option>
                </select>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {filteredMessages.map((message) => {
              const typeInfo = getTypeLabel(message.type);
              return (
                <div key={message.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium shrink-0">
                      {message.clientName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">{message.clientName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-400">{formatDateTime(message.createdAt)}</span>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(message.status)}
                          <span className={`text-xs ${
                            message.status === 'failed' ? 'text-red-500' : 'text-gray-500'
                          }`}>
                            {getStatusLabel(message.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scheduled Notifications */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Proximos Envios</h2>
            <p className="text-sm text-gray-500">Notificacoes agendadas</p>
          </div>
          <div className="divide-y divide-gray-100">
            {mockScheduledNotifications.map((notification) => {
              const typeInfo = getTypeLabel(notification.type);
              return (
                <div key={notification.id} className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-purple-600">
                      {formatTime(notification.scheduledFor)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </div>
                  <div className="ml-7">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-800">{notification.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {notification.service} - {formatDateTime(notification.appointmentTime)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Lembretes sao enviados automaticamente 24h e 2h antes do horario agendado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
