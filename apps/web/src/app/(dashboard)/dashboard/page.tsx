import { Calendar, Users, TrendingUp, Clock } from 'lucide-react';

const stats = [
  {
    name: 'Agendamentos Hoje',
    value: '12',
    icon: Calendar,
    change: '+2 vs ontem',
    changeType: 'positive',
  },
  {
    name: 'Clientes Ativos',
    value: '248',
    icon: Users,
    change: '+18 este mês',
    changeType: 'positive',
  },
  {
    name: 'Taxa de Confirmação',
    value: '94%',
    icon: TrendingUp,
    change: '+5% vs mês passado',
    changeType: 'positive',
  },
  {
    name: 'Tempo Médio de Resposta',
    value: '2min',
    icon: Clock,
    change: '-30s vs semana passada',
    changeType: 'positive',
  },
];

const upcomingAppointments = [
  {
    id: 1,
    client: 'Maria Silva',
    service: 'Corte + Escova',
    time: '09:00',
    professional: 'Ana',
    status: 'confirmed',
  },
  {
    id: 2,
    client: 'João Santos',
    service: 'Barba',
    time: '09:30',
    professional: 'Carlos',
    status: 'confirmed',
  },
  {
    id: 3,
    client: 'Carla Oliveira',
    service: 'Coloração',
    time: '10:00',
    professional: 'Ana',
    status: 'pending',
  },
  {
    id: 4,
    client: 'Pedro Costa',
    service: 'Corte Masculino',
    time: '10:30',
    professional: 'Carlos',
    status: 'confirmed',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao bela360. Aqui está o resumo do seu dia.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <div
            key={stat.name}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </span>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold">{stat.value}</span>
              <p className="text-xs text-green-600 mt-1">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Próximos Agendamentos</h2>
        </div>
        <div className="divide-y">
          {upcomingAppointments.map(appointment => (
            <div
              key={appointment.id}
              className="flex items-center justify-between px-6 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  {appointment.client
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="font-medium">{appointment.client}</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.service} • {appointment.professional}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{appointment.time}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    appointment.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </span>
              </div>
            </div>
          ))}
        </div>
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
