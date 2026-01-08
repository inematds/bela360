'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, ChevronDown, CheckCircle, Clock } from 'lucide-react';

interface CommissionEntry {
  id: string;
  paidAt: string;
  client: { id: string; name: string };
  appointment: {
    startTime: string;
    service: { id: string; name: string };
  };
  finalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  commissionPayoutId: string | null;
}

interface CommissionSummary {
  pending: { amount: number; paymentCount: number; totalServicesValue: number };
  paid: { amount: number; payoutCount: number };
  awaitingPayout: { amount: number; payoutCount: number };
  total: { earned: number };
}

export default function ProfessionalComissoesPage() {
  const [period, setPeriod] = useState('current');
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [pendingEntries, setPendingEntries] = useState<CommissionEntry[]>([]);
  const [paidEntries, setPaidEntries] = useState<CommissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'last':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate.setDate(0); // Last day of previous month
        break;
      case 'last3':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      default: // current
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }, [period]);

  useEffect(() => {
    const fetchCommissions = async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const { startDate, endDate } = getDateRange();

        // Fetch summary and entries in parallel
        const [summaryRes, entriesRes] = await Promise.all([
          fetch(`/api/finance/my/commissions?startDate=${startDate}&endDate=${endDate}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/finance/my/commission-entries?startDate=${startDate}&endDate=${endDate}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData.data);
        }

        if (entriesRes.ok) {
          const entriesData = await entriesRes.json();
          setPendingEntries(entriesData.data.pending || []);
          setPaidEntries(entriesData.data.paid || []);
        }
      } catch {
        setError('Erro ao carregar comissoes');
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, [period, getDateRange]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Minhas Comissoes</h1>
          <p className="text-gray-600">Acompanhe seus ganhos</p>
        </div>

        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="current">Este mes</option>
            <option value="last">Mes passado</option>
            <option value="last3">Ultimos 3 meses</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-indigo-100">Total Ganho</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(summary?.total.earned || 0)}</p>
          <p className="text-indigo-200 text-sm mt-1">No periodo selecionado</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-gray-600">A Receber</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{formatCurrency(summary?.pending.amount || 0)}</p>
          <p className="text-gray-500 text-sm mt-1">{summary?.pending.paymentCount || 0} atendimentos</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-gray-600">Pago</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{formatCurrency(summary?.paid.amount || 0)}</p>
          <p className="text-gray-500 text-sm mt-1">{summary?.paid.payoutCount || 0} repasses</p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Pending Commissions */}
      {!loading && pendingEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              A Receber
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-800">{formatDate(entry.paidAt)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{entry.client?.name || 'Cliente'}</p>
                    <p className="text-sm text-gray-500">{entry.appointment?.service?.name || 'Servico'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{formatCurrency(Number(entry.finalAmount))} x {Number(entry.commissionRate)}%</p>
                  <p className="font-bold text-indigo-600">{formatCurrency(Number(entry.commissionAmount))}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-yellow-50 border-t border-yellow-100 flex items-center justify-between">
            <span className="font-medium text-yellow-800">Total a receber</span>
            <span className="font-bold text-yellow-800">
              {formatCurrency(pendingEntries.reduce((sum, e) => sum + Number(e.commissionAmount), 0))}
            </span>
          </div>
        </div>
      )}

      {/* Paid Commissions */}
      {!loading && paidEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Pagos
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {paidEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 opacity-75">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-800">{formatDate(entry.paidAt)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{entry.client?.name || 'Cliente'}</p>
                    <p className="text-sm text-gray-500">{entry.appointment?.service?.name || 'Servico'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Incluido em repasse</p>
                  <p className="font-bold text-green-600">{formatCurrency(Number(entry.commissionAmount))}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && pendingEntries.length === 0 && paidEntries.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma comissao encontrada no periodo</p>
        </div>
      )}
    </div>
  );
}
