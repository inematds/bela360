'use client';

import { useEffect, useState } from 'react';
import { Calendar, Users, TrendingUp, DollarSign, Clock, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  analyticsApi,
  DashboardStats,
  RevenueReport,
  ServiceReport,
  ProfessionalReport,
} from '@/lib/api';
import { ExportButton, SimpleExportButton } from '@/components/ExportButton';
import {
  exportData,
  ExportFormat,
  prepareDashboardExport,
  prepareRevenueExport,
  prepareServiceExport,
  prepareProfessionalExport,
  prepareAppointmentExport,
} from '@/lib/export';

interface TodayAppointment {
  id: string;
  clientId: string;
  client: {
    name: string;
    phone: string;
  };
  serviceId: string;
  service: {
    name: string;
  };
  professionalId: string;
  professional: {
    name: string;
  };
  startTime: string;
  status: string;
}

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status: string): { label: string; className: string } {
  const statusMap: Record<string, { label: string; className: string }> = {
    SCHEDULED: { label: 'Agendado', className: 'bg-blue-100 text-blue-700' },
    CONFIRMED: { label: 'Confirmado', className: 'bg-green-100 text-green-700' },
    PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
    COMPLETED: { label: 'Concluído', className: 'bg-gray-100 text-gray-700' },
    CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
    NO_SHOW: { label: 'Não compareceu', className: 'bg-orange-100 text-orange-700' },
  };
  return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
}

function StatCard({
  name,
  value,
  icon: Icon,
  change,
  changeType,
  loading,
}: {
  name: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-2">
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  const changeColor =
    changeType === 'positive'
      ? 'text-green-600'
      : changeType === 'negative'
        ? 'text-red-600'
        : 'text-gray-500';

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{name}</span>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold">{value}</span>
        {change && <p className={`text-xs mt-1 ${changeColor}`}>{change}</p>}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  loading,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  actions?: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-card shadow-sm p-6">
        <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueReport | null>(null);
  const [serviceData, setServiceData] = useState<ServiceReport[] | null>(null);
  const [professionalData, setProfessionalData] = useState<ProfessionalReport[] | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Date range for reports (last 7 days)
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        // Date range for monthly reports
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split('T')[0];

        // Fetch all data in parallel
        const [dashboardStats, revenue, services, professionals, appointments] = await Promise.all([
          analyticsApi.getDashboard().catch(() => null),
          analyticsApi.getRevenueReport(startDate, endDate).catch(() => null),
          analyticsApi.getServiceReport(monthStart, endDate).catch(() => null),
          analyticsApi.getProfessionalReport(monthStart, endDate).catch(() => null),
          fetch('/api/appointments/today', { credentials: 'include' })
            .then(res => res.json())
            .then(json => json.data || [])
            .catch(() => []),
        ]);

        setStats(dashboardStats);
        setRevenueData(revenue);
        setServiceData(services);
        setProfessionalData(professionals);
        setTodayAppointments(appointments);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const statsCards = stats
    ? [
        {
          name: 'Agendamentos Hoje',
          value: stats.today.appointments.toString(),
          icon: Calendar,
          change: `${stats.today.confirmed} confirmados`,
          changeType: 'positive' as const,
        },
        {
          name: 'Receita Hoje',
          value: formatCurrency(stats.today.revenue),
          icon: DollarSign,
          change: `Ticket médio: ${formatCurrency(stats.averageTicket)}`,
          changeType: 'neutral' as const,
        },
        {
          name: 'Novos Clientes (Mês)',
          value: stats.month.newClients.toString(),
          icon: Users,
          change: `+${stats.week.newClients} esta semana`,
          changeType: 'positive' as const,
        },
        {
          name: 'Taxa de Confirmação',
          value: `${stats.confirmationRate}%`,
          icon: TrendingUp,
          change: `${stats.today.completed} atendidos hoje`,
          changeType: stats.confirmationRate >= 80 ? 'positive' as const : 'neutral' as const,
        },
      ]
    : [];

  // Format revenue data for line chart
  const revenueChartData =
    revenueData?.daily.map(d => ({
      date: new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
      receita: d.revenue,
      agendamentos: d.count,
    })) || [];

  // Format service data for pie chart
  const serviceChartData =
    serviceData?.slice(0, 5).map(s => ({
      name: s.name,
      value: s.count,
      revenue: s.revenue,
    })) || [];

  // Format professional data for bar chart
  const professionalChartData =
    professionalData?.map(p => ({
      name: p.name,
      agendamentos: p.appointments,
      receita: p.revenue,
    })) || [];

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao bela360. Aqui está o resumo do seu dia.
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Erro ao carregar dados</span>
          </div>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Export handlers
  const handleExportDashboard = (format: ExportFormat) => {
    if (!stats) return;
    const data = prepareDashboardExport(stats);
    exportData(data, format, {
      filename: `dashboard-${new Date().toISOString().split('T')[0]}`,
      title: 'Dashboard Bela360',
      subtitle: 'Resumo de métricas do negócio',
    });
  };

  const handleExportRevenue = (format: ExportFormat) => {
    if (!revenueData?.daily) return;
    const data = prepareRevenueExport(revenueData.daily);
    exportData(data, format, {
      filename: `receita-${new Date().toISOString().split('T')[0]}`,
      title: 'Relatório de Receita',
      subtitle: 'Últimos 7 dias',
    });
  };

  const handleExportServices = (format: ExportFormat) => {
    if (!serviceData) return;
    const data = prepareServiceExport(serviceData);
    exportData(data, format, {
      filename: `servicos-${new Date().toISOString().split('T')[0]}`,
      title: 'Relatório de Serviços',
      subtitle: 'Serviços mais populares do mês',
    });
  };

  const handleExportProfessionals = (format: ExportFormat) => {
    if (!professionalData) return;
    const data = prepareProfessionalExport(professionalData);
    exportData(data, format, {
      filename: `profissionais-${new Date().toISOString().split('T')[0]}`,
      title: 'Desempenho por Profissional',
      subtitle: 'Métricas do mês atual',
    });
  };

  const handleExportAppointments = (format: ExportFormat) => {
    if (!todayAppointments.length) return;
    const data = prepareAppointmentExport(todayAppointments);
    exportData(data, format, {
      filename: `agendamentos-hoje-${new Date().toISOString().split('T')[0]}`,
      title: 'Agendamentos de Hoje',
      subtitle: new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao bela360. Aqui está o resumo do seu dia.
          </p>
        </div>
        <ExportButton onExport={handleExportDashboard} disabled={loading || !stats} />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => (
                <StatCard
                  key={i}
                  name=""
                  value=""
                  icon={Calendar}
                  loading={true}
                />
              ))
          : statsCards.map(stat => (
              <StatCard
                key={stat.name}
                name={stat.name}
                value={stat.value}
                icon={stat.icon}
                change={stat.change}
                changeType={stat.changeType}
              />
            ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Line Chart */}
        <ChartCard
          title="Receita dos Últimos 7 Dias"
          loading={loading}
          actions={
            revenueChartData.length > 0 && (
              <SimpleExportButton format="xlsx" label="Excel" onExport={handleExportRevenue} />
            )
          }
        >
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis
                  fontSize={12}
                  tickFormatter={value => `R$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'receita' ? formatCurrency(value as number) : value
                  }
                  labelStyle={{ color: '#333' }}
                />
                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6' }}
                  name="Receita"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Sem dados de receita no período
            </div>
          )}
        </ChartCard>

        {/* Services Pie Chart */}
        <ChartCard
          title="Serviços Mais Populares (Mês)"
          loading={loading}
          actions={
            serviceChartData.length > 0 && (
              <SimpleExportButton format="xlsx" label="Excel" onExport={handleExportServices} />
            )
          }
        >
          {serviceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={serviceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {serviceChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) =>
                    name === 'value'
                      ? [`${value} agendamentos`, `Receita: ${formatCurrency((props?.payload as { revenue: number })?.revenue || 0)}`]
                      : value
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Sem dados de serviços no período
            </div>
          )}
        </ChartCard>
      </div>

      {/* Professional Performance Bar Chart */}
      <ChartCard
        title="Desempenho por Profissional (Mês)"
        loading={loading}
        actions={
          professionalChartData.length > 0 && (
            <SimpleExportButton format="xlsx" label="Excel" onExport={handleExportProfessionals} />
          )
        }
      >
        {professionalChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={professionalChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="name" fontSize={12} width={100} />
              <Tooltip
                formatter={(value, name) =>
                  name === 'receita' ? formatCurrency(value as number) : value
                }
              />
              <Legend />
              <Bar dataKey="agendamentos" fill="#8b5cf6" name="Agendamentos" />
              <Bar dataKey="receita" fill="#06b6d4" name="Receita (R$)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Sem dados de profissionais no período
          </div>
        )}
      </ChartCard>

      {/* Upcoming Appointments */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Próximos Agendamentos de Hoje</h2>
          {todayAppointments.length > 0 && (
            <SimpleExportButton format="xlsx" label="Excel" onExport={handleExportAppointments} />
          )}
        </div>
        {loading ? (
          <div className="divide-y">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
          </div>
        ) : todayAppointments.length > 0 ? (
          <div className="divide-y">
            {todayAppointments.slice(0, 6).map(appointment => {
              const statusBadge = getStatusBadge(appointment.status);
              return (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {appointment.client?.name
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2) || '??'}
                    </div>
                    <div>
                      <p className="font-medium">{appointment.client?.name || 'Cliente'}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.service?.name || 'Serviço'} •{' '}
                        {appointment.professional?.name || 'Profissional'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatTime(appointment.startTime)}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusBadge.className}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-muted-foreground">
            Nenhum agendamento para hoje
          </div>
        )}
        <div className="border-t px-6 py-4">
          <a
            href="/agenda"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todos os agendamentos →
          </a>
        </div>
      </div>
    </div>
  );
}
