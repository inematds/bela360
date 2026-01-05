'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  Calendar,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface FinancialSummary {
  totalRevenue: number;
  totalCommissions: number;
  businessProfit: number;
  transactionCount: number;
  averageTicket: number;
}

interface PaymentMethod {
  method: string;
  total: number;
  count: number;
}

export default function FinanceiroPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [byMethod, setByMethod] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    // Simulated data - replace with API call
    setSummary({
      totalRevenue: 15750.00,
      totalCommissions: 4725.00,
      businessProfit: 11025.00,
      transactionCount: 87,
      averageTicket: 181.03,
    });
    setByMethod([
      { method: 'PIX', total: 8500.00, count: 45 },
      { method: 'CREDIT_CARD', total: 4200.00, count: 28 },
      { method: 'DEBIT_CARD', total: 2050.00, count: 10 },
      { method: 'CASH', total: 1000.00, count: 4 },
    ]);
    setLoading(false);
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const methodIcons: Record<string, typeof DollarSign> = {
    PIX: QrCode,
    CREDIT_CARD: CreditCard,
    DEBIT_CARD: CreditCard,
    CASH: Banknote,
  };

  const methodLabels: Record<string, string> = {
    PIX: 'PIX',
    CREDIT_CARD: 'Cartão Crédito',
    DEBIT_CARD: 'Cartão Débito',
    CASH: 'Dinheiro',
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
            <DollarSign className="h-6 w-6 text-green-500" />
            Financeiro
          </h1>
          <p className="text-muted-foreground">
            Controle de receitas, comissões e fechamento de caixa
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-card border rounded-lg text-sm"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="year">Este Ano</option>
          </select>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-500">
            {formatCurrency(summary?.totalRevenue || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary?.transactionCount} transações
          </p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Comissões</p>
            <Users className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-500">
            {formatCurrency(summary?.totalCommissions || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {((summary?.totalCommissions || 0) / (summary?.totalRevenue || 1) * 100).toFixed(1)}% da receita
          </p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Lucro do Salão</p>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-500">
            {formatCurrency(summary?.businessProfit || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {((summary?.businessProfit || 0) / (summary?.totalRevenue || 1) * 100).toFixed(1)}% da receita
          </p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Ticket Médio</p>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-500">
            {formatCurrency(summary?.averageTicket || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            por atendimento
          </p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Por Forma de Pagamento</h2>
          <div className="space-y-4">
            {byMethod.map((method) => {
              const Icon = methodIcons[method.method] || DollarSign;
              const percentage = (method.total / (summary?.totalRevenue || 1)) * 100;

              return (
                <div key={method.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {methodLabels[method.method] || method.method}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(method.total)}</p>
                      <p className="text-xs text-muted-foreground">{method.count} transações</p>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid gap-3">
            <button className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Registrar Pagamento</p>
                <p className="text-sm text-muted-foreground">Adicionar novo pagamento</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Fechar Caixa</p>
                <p className="text-sm text-muted-foreground">Finalizar o dia</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Comissões Pendentes</p>
                <p className="text-sm text-muted-foreground">Ver repasses</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Relatório Completo</p>
                <p className="text-sm text-muted-foreground">Exportar dados</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
