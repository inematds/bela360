'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  UserCheck,
  UserX,
  Gift,
  Send,
  Loader2,
} from 'lucide-react';

// Mock data - will be replaced with API calls
const mockDashboardStats = {
  today: {
    appointments: 12,
    confirmed: 10,
    cancelled: 1,
    completed: 8,
    revenue: 850,
  },
  week: {
    appointments: 45,
    newClients: 8,
    revenue: 4250,
  },
  month: {
    appointments: 180,
    newClients: 32,
    revenue: 17500,
    topServices: [
      { name: 'Corte Feminino', count: 45 },
      { name: 'Escova', count: 38 },
      { name: 'Coloracao', count: 25 },
      { name: 'Manicure', count: 22 },
      { name: 'Barba', count: 18 },
    ],
  },
  confirmationRate: 94,
  averageTicket: 97.22,
};

const mockRetention = {
  totalClients: 248,
  activeClients: 156,
  inactiveClients: 42,
  newThisMonth: 32,
  retentionRate: 78,
};

const mockProfessionals = [
  { id: '1', name: 'Ana Silva', appointments: 65, revenue: 6500 },
  { id: '2', name: 'Carlos Santos', appointments: 52, revenue: 4800 },
  { id: '3', name: 'Maria Oliveira', appointments: 48, revenue: 5200 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-purple-600" />
        </div>
      </div>
      <div className="mt-4">
        <span className="text-3xl font-bold text-gray-800">{value}</span>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        {trend && trendValue && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnaliticosPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [sendingCampaign, setSendingCampaign] = useState<string | null>(null);

  const stats = mockDashboardStats;
  const retention = mockRetention;

  const handleSendBirthdayCampaign = async () => {
    setSendingCampaign('birthday');
    // TODO: Call API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSendingCampaign(null);
    alert('Mensagens de aniversario enviadas!');
  };

  const handleSendReactivationCampaign = async () => {
    setSendingCampaign('reactivation');
    // TODO: Call API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSendingCampaign(null);
    alert('Campanha de reativacao enviada!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analiticos</h1>
          <p className="text-gray-600">Acompanhe o desempenho do seu negocio</p>
        </div>
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita"
          value={formatCurrency(stats[selectedPeriod].revenue)}
          icon={DollarSign}
          trend="up"
          trendValue="+12% vs periodo anterior"
        />
        <StatCard
          title="Agendamentos"
          value={stats[selectedPeriod].appointments}
          subtitle={selectedPeriod === 'today' ? `${stats.today.completed} concluidos` : undefined}
          icon={Calendar}
          trend="up"
          trendValue="+8%"
        />
        <StatCard
          title="Taxa de Confirmacao"
          value={`${stats.confirmationRate}%`}
          icon={UserCheck}
          trend="up"
          trendValue="+5%"
        />
        <StatCard
          title="Ticket Medio"
          value={formatCurrency(stats.averageTicket)}
          icon={BarChart3}
          trend="up"
          trendValue="+3%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">Servicos Mais Realizados</h2>
          </div>
          <div className="space-y-4">
            {stats.month.topServices.map((service, index) => {
              const maxCount = stats.month.topServices[0].count;
              const percentage = (service.count / maxCount) * 100;
              return (
                <div key={service.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{service.name}</span>
                    <span className="text-sm text-gray-500">{service.count} atendimentos</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Professional Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">Desempenho por Profissional</h2>
          </div>
          <div className="space-y-4">
            {mockProfessionals.map((prof, index) => (
              <div key={prof.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{prof.name}</p>
                    <p className="text-sm text-gray-500">{prof.appointments} atendimentos</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-800">{formatCurrency(prof.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Retention & Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Retention */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <UserCheck className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">Retencao de Clientes</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-3xl font-bold text-purple-600">{retention.totalClients}</p>
              <p className="text-sm text-gray-600 mt-1">Total de Clientes</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-3xl font-bold text-green-600">{retention.activeClients}</p>
              <p className="text-sm text-gray-600 mt-1">Clientes Ativos</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <p className="text-3xl font-bold text-yellow-600">{retention.newThisMonth}</p>
              <p className="text-sm text-gray-600 mt-1">Novos este Mes</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-3xl font-bold text-red-600">{retention.inactiveClients}</p>
              <p className="text-sm text-gray-600 mt-1">Inativos (+60 dias)</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Taxa de Retencao</span>
              <span className="text-sm font-bold text-purple-600">{retention.retentionRate}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                style={{ width: `${retention.retentionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Campaigns */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Send className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">Campanhas</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center shrink-0">
                  <Gift className="w-6 h-6 text-pink-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Aniversariantes do Dia</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Envie mensagens de parabens com desconto especial para aniversariantes de hoje.
                  </p>
                  <button
                    onClick={handleSendBirthdayCampaign}
                    disabled={sendingCampaign === 'birthday'}
                    className="mt-3 px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sendingCampaign === 'birthday' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar Campanha
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                  <UserX className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Reativar Clientes Inativos</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Envie mensagens para {retention.inactiveClients} clientes que nao visitam ha mais de 60 dias.
                  </p>
                  <button
                    onClick={handleSendReactivationCampaign}
                    disabled={sendingCampaign === 'reactivation'}
                    className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sendingCampaign === 'reactivation' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar Campanha
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
