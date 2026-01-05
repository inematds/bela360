'use client';

import { useState, useEffect } from 'react';
import {
  Gift,
  Star,
  Users,
  TrendingUp,
  Award,
  Percent,
  Plus,
  Crown,
  Target,
} from 'lucide-react';

interface LoyaltyStats {
  totalClients: number;
  totalPointsActive: number;
  totalPointsRedeemed: number;
  tierDistribution: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    DIAMOND: number;
  };
}

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: string;
  totalRedemptions: number;
}

interface Redemption {
  id: string;
  couponCode: string;
  pointsUsed: number;
  createdAt: string;
  reward: { name: string };
  client: { name: string };
}

export default function FidelidadePage() {
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [recentRedemptions, setRecentRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewReward, setShowNewReward] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsCost: 100,
    type: 'DISCOUNT_PERCENT',
    discountValue: 10,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Simulated data - replace with API call
    setStats({
      totalClients: 156,
      totalPointsActive: 48500,
      totalPointsRedeemed: 12300,
      tierDistribution: {
        BRONZE: 89,
        SILVER: 42,
        GOLD: 18,
        DIAMOND: 7,
      },
    });
    setRewards([
      { id: '1', name: 'Desconto 10%', description: 'Em qualquer servico', pointsCost: 100, type: 'DISCOUNT_PERCENT', totalRedemptions: 45 },
      { id: '2', name: 'Hidratacao Gratis', description: 'Hidratacao capilar', pointsCost: 250, type: 'FREE_SERVICE', totalRedemptions: 28 },
      { id: '3', name: 'R$50 OFF', description: 'Em servicos acima de R$150', pointsCost: 500, type: 'DISCOUNT_AMOUNT', totalRedemptions: 12 },
    ]);
    setRecentRedemptions([
      { id: '1', couponCode: 'BL8K2X', pointsUsed: 100, createdAt: '2026-01-05T10:30:00', reward: { name: 'Desconto 10%' }, client: { name: 'Maria Silva' } },
      { id: '2', couponCode: 'BL9Y3Z', pointsUsed: 250, createdAt: '2026-01-04T15:45:00', reward: { name: 'Hidratacao Gratis' }, client: { name: 'Ana Costa' } },
    ]);
    setLoading(false);
  }, []);

  const tierColors = {
    BRONZE: 'text-amber-700 bg-amber-100',
    SILVER: 'text-gray-500 bg-gray-100',
    GOLD: 'text-yellow-600 bg-yellow-100',
    DIAMOND: 'text-purple-600 bg-purple-100',
  };

  const tierLabels = {
    BRONZE: 'Bronze',
    SILVER: 'Prata',
    GOLD: 'Ouro',
    DIAMOND: 'Diamante',
  };

  const rewardTypeLabels: Record<string, string> = {
    DISCOUNT_PERCENT: 'Desconto Percentual',
    DISCOUNT_AMOUNT: 'Desconto em Reais',
    FREE_SERVICE: 'Servico Gratuito',
    PRODUCT: 'Produto',
  };

  const handleCloseModal = () => {
    setShowNewReward(false);
    setFormData({ name: '', description: '', pointsCost: 100, type: 'DISCOUNT_PERCENT', discountValue: 10 });
  };

  const handleSubmitNewReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.pointsCost <= 0) {
      alert('Nome e custo em pontos sao obrigatorios');
      return;
    }

    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newReward: Reward = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      pointsCost: formData.pointsCost,
      type: formData.type,
      totalRedemptions: 0,
    };

    setRewards(prev => [...prev, newReward]);
    handleCloseModal();
    setSaving(false);
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
            <Gift className="h-6 w-6 text-purple-500" />
            Programa de Fidelidade
          </h1>
          <p className="text-muted-foreground">
            Gerencie pontos, recompensas e fidelizacao de clientes
          </p>
        </div>

        <button
          onClick={() => setShowNewReward(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova Recompensa
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Clientes no Programa</p>
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold">{stats?.totalClients}</p>
          <p className="text-xs text-muted-foreground mt-1">
            clientes ativos
          </p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Pontos Ativos</p>
            <Star className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {stats?.totalPointsActive?.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            em circulacao
          </p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Pontos Resgatados</p>
            <Gift className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats?.totalPointsRedeemed?.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            total historico
          </p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Clientes VIP</p>
            <Crown className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {(stats?.tierDistribution.GOLD || 0) + (stats?.tierDistribution.DIAMOND || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ouro + Diamante
          </p>
        </div>
      </div>

      {/* Tier Distribution */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Distribuicao por Nivel
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {(Object.keys(stats?.tierDistribution || {}) as Array<keyof typeof tierColors>).map((tier) => (
            <div key={tier} className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${tierColors[tier]} mb-2`}>
                <Crown className="h-8 w-8" />
              </div>
              <p className="font-semibold">{tierLabels[tier]}</p>
              <p className="text-2xl font-bold">{stats?.tierDistribution[tier]}</p>
              <p className="text-xs text-muted-foreground">clientes</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rewards */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Recompensas Disponiveis
          </h2>
          <div className="space-y-3">
            {rewards.map((reward) => (
              <div key={reward.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Gift className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{reward.name}</p>
                    <p className="text-sm text-muted-foreground">{reward.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">{reward.pointsCost} pts</p>
                  <p className="text-xs text-muted-foreground">{reward.totalRedemptions} resgates</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Redemptions */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resgates Recentes
          </h2>
          <div className="space-y-3">
            {recentRedemptions.map((redemption) => (
              <div key={redemption.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{redemption.client.name}</p>
                  <p className="text-sm text-muted-foreground">{redemption.reward.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                    {redemption.couponCode}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">-{redemption.pointsUsed} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Program Settings Preview */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Configuracoes do Programa
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Pontos por R$1</p>
            <p className="text-2xl font-bold">1</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Prata a partir de</p>
            <p className="text-2xl font-bold">100 pts</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Ouro a partir de</p>
            <p className="text-2xl font-bold">500 pts</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Diamante a partir de</p>
            <p className="text-2xl font-bold">1000 pts</p>
          </div>
        </div>
      </div>

      {/* New Reward Modal */}
      {showNewReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nova Recompensa</h2>
            <form onSubmit={handleSubmitNewReward} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome da recompensa *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Desconto 15%"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descricao</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva a recompensa..."
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de recompensa</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="DISCOUNT_PERCENT">Desconto Percentual (%)</option>
                  <option value="DISCOUNT_AMOUNT">Desconto em Reais (R$)</option>
                  <option value="FREE_SERVICE">Servico Gratuito</option>
                  <option value="PRODUCT">Produto</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Custo em pontos *</label>
                  <input
                    type="number"
                    value={formData.pointsCost || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pointsCost: parseInt(e.target.value) || 0 }))}
                    placeholder="100"
                    min="1"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formData.type === 'DISCOUNT_PERCENT' ? 'Desconto (%)' : 'Valor (R$)'}
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                    placeholder={formData.type === 'DISCOUNT_PERCENT' ? '10' : '50'}
                    min="0"
                    step={formData.type === 'DISCOUNT_PERCENT' ? '1' : '0.01'}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border text-muted-foreground rounded-lg hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Criar Recompensa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
