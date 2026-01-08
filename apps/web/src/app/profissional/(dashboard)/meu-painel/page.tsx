'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton, SkeletonCard, SkeletonList } from '@/components/Skeleton';

interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  monthRevenue: number;
  pendingCommission: number;
  totalClients: number;
  averageRating: number;
  nextAppointment?: {
    clientName: string;
    serviceName: string;
    time: string;
  };
}

interface TodayAppointment {
  id: string;
  time: string;
  clientName: string;
  serviceName: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED';
}

export default function ProfessionalDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weekAppointments: 0,
    monthRevenue: 0,
    pendingCommission: 0,
    totalClients: 0,
    averageRating: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data - in production would fetch from API
    setStats({
      todayAppointments: 5,
      weekAppointments: 18,
      monthRevenue: 4850,
      pendingCommission: 1455,
      totalClients: 127,
      averageRating: 4.8,
      nextAppointment: {
        clientName: 'Maria Silva',
        serviceName: 'Corte e Escova',
        time: '14:30',
      },
    });

    setTodaySchedule([
      { id: '1', time: '09:00', clientName: 'Ana Paula', serviceName: 'Corte Feminino', status: 'COMPLETED' },
      { id: '2', time: '10:00', clientName: 'Carlos Lima', serviceName: 'Corte Masculino', status: 'COMPLETED' },
      { id: '3', time: '11:00', clientName: 'Juliana Costa', serviceName: 'Escova', status: 'CONFIRMED' },
      { id: '4', time: '14:30', clientName: 'Maria Silva', serviceName: 'Corte e Escova', status: 'PENDING' },
      { id: '5', time: '16:00', clientName: 'Fernanda Souza', serviceName: 'Coloracao', status: 'CONFIRMED' },
    ]);

    setLoading(false);
  }, []);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Concluido';
      case 'CONFIRMED':
        return 'Confirmado';
      case 'PENDING':
        return 'Aguardando';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <Skeleton className="w-48 h-8 mb-2" />
          <Skeleton className="w-64 h-5" />
        </div>

        {/* Highlight card skeleton */}
        <Skeleton className="w-full h-32 rounded-xl" />

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Secondary stats skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* List skeleton */}
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Meu Painel</h1>
        <p className="text-gray-600">Acompanhe seu desempenho e agenda</p>
      </div>

      {/* Next appointment highlight */}
      {stats.nextAppointment && (
        <div className="bg-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm mb-1">Proximo atendimento</p>
              <h3 className="text-xl font-bold">{stats.nextAppointment.clientName}</h3>
              <p className="text-indigo-100">{stats.nextAppointment.serviceName}</p>
            </div>
            <div className="text-right">
              <Clock className="w-8 h-8 text-indigo-200 mb-2 ml-auto" />
              <p className="text-2xl font-bold">{stats.nextAppointment.time}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-600 text-sm">Hoje</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.todayAppointments}</p>
          <p className="text-sm text-gray-500">atendimentos</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-gray-600 text-sm">Semana</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.weekAppointments}</p>
          <p className="text-sm text-gray-500">atendimentos</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-600 text-sm">Faturado</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.monthRevenue)}</p>
          <p className="text-sm text-gray-500">este mes</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-gray-600 text-sm">Comissao</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.pendingCommission)}</p>
          <p className="text-sm text-gray-500">a receber</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Meus Clientes</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalClients}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avaliacao Media</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.averageRating.toFixed(1)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Agenda de Hoje</h2>
          <Link
            href="/profissional/agenda"
            className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:underline"
          >
            Ver completa <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {todaySchedule.map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{appointment.time}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{appointment.clientName}</p>
                  <p className="text-sm text-gray-500">{appointment.serviceName}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                {getStatusLabel(appointment.status)}
              </span>
            </div>
          ))}

          {todaySchedule.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Nenhum atendimento agendado para hoje
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
