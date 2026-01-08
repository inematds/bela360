'use client';

import { ReactNode } from 'react';
import {
  Calendar,
  Users,
  DollarSign,
  MessageCircle,
  FileText,
  Package,
  Clock,
  Star,
  TrendingUp,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: 'calendar' | 'users' | 'money' | 'message' | 'file' | 'package' | 'clock' | 'star' | 'chart';
  title: string;
  description?: string;
  action?: ReactNode;
}

const iconMap = {
  calendar: Calendar,
  users: Users,
  money: DollarSign,
  message: MessageCircle,
  file: FileText,
  package: Package,
  clock: Clock,
  star: Star,
  chart: TrendingUp,
};

export function EmptyState({ icon = 'file', title, description, action }: EmptyStateProps) {
  const IconComponent = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <IconComponent className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

export function EmptyStateCard({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <EmptyState icon={icon} title={title} description={description} action={action} />
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function NoAppointments() {
  return (
    <EmptyState
      icon="calendar"
      title="Nenhum agendamento"
      description="Nao ha agendamentos para o periodo selecionado"
    />
  );
}

export function NoClients() {
  return (
    <EmptyState
      icon="users"
      title="Nenhum cliente"
      description="Comece adicionando seus primeiros clientes"
    />
  );
}

export function NoPayments() {
  return (
    <EmptyState
      icon="money"
      title="Nenhum pagamento"
      description="Nao ha pagamentos registrados no periodo"
    />
  );
}

export function NoMessages() {
  return (
    <EmptyState
      icon="message"
      title="Nenhuma mensagem"
      description="Nao ha mensagens para exibir"
    />
  );
}

export function NoProducts() {
  return (
    <EmptyState
      icon="package"
      title="Nenhum produto"
      description="Adicione produtos ao seu estoque"
    />
  );
}

export function NoRatings() {
  return (
    <EmptyState
      icon="star"
      title="Nenhuma avaliacao"
      description="Aguarde as primeiras avaliacoes dos clientes"
    />
  );
}

export function NoData() {
  return (
    <EmptyState
      icon="chart"
      title="Sem dados"
      description="Nao ha dados para exibir no periodo selecionado"
    />
  );
}
