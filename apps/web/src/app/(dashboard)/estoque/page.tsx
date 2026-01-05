'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Plus,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Boxes,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  costPrice: number;
  unit: string;
  expirationDate?: string;
}

interface StockStats {
  totalProducts: number;
  lowStockCount: number;
  totalStockValue: number;
  monthlyPurchases: number;
  monthlyUsage: number;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  createdAt: string;
  product: { name: string };
  user?: { name: string };
}

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<StockStats | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulated data - replace with API call
    setStats({
      totalProducts: 48,
      lowStockCount: 5,
      totalStockValue: 8750.00,
      monthlyPurchases: 2350.00,
      monthlyUsage: 1890.00,
    });
    setProducts([
      { id: '1', name: 'Shampoo Profissional 1L', brand: 'LOreal', sku: 'SH001', category: 'INTERNAL_USE', currentStock: 8, minStock: 5, costPrice: 45.00, unit: 'un' },
      { id: '2', name: 'Condicionador 500ml', brand: 'LOreal', sku: 'CD001', category: 'INTERNAL_USE', currentStock: 3, minStock: 5, costPrice: 35.00, unit: 'un' },
      { id: '3', name: 'Tintura 60g', brand: 'Wella', sku: 'TN001', category: 'INTERNAL_USE', currentStock: 25, minStock: 10, costPrice: 28.00, unit: 'un' },
      { id: '4', name: 'Oxidante 20 Vol 1L', brand: 'Wella', sku: 'OX001', category: 'INTERNAL_USE', currentStock: 4, minStock: 6, costPrice: 22.00, unit: 'un' },
      { id: '5', name: 'Mascara Hidratacao 500g', brand: 'Kerastase', sku: 'MH001', category: 'FOR_SALE', currentStock: 12, minStock: 5, costPrice: 85.00, unit: 'un' },
    ]);
    setMovements([
      { id: '1', type: 'SERVICE_USE', quantity: -2, createdAt: '2026-01-05T14:30:00', product: { name: 'Shampoo Profissional' }, user: { name: 'Ana' } },
      { id: '2', type: 'PURCHASE', quantity: 10, createdAt: '2026-01-05T09:00:00', product: { name: 'Tintura 60g' }, user: { name: 'Admin' } },
      { id: '3', type: 'SERVICE_USE', quantity: -1, createdAt: '2026-01-04T16:45:00', product: { name: 'Oxidante 20 Vol' }, user: { name: 'Maria' } },
    ]);
    setLoading(false);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const categoryLabels: Record<string, string> = {
    INTERNAL_USE: 'Uso Interno',
    FOR_SALE: 'Revenda',
    BOTH: 'Ambos',
  };

  const movementTypeLabels: Record<string, string> = {
    PURCHASE: 'Compra',
    SERVICE_USE: 'Uso em Servico',
    SALE: 'Venda',
    ADJUSTMENT: 'Ajuste',
    LOSS: 'Perda',
    RETURN: 'Devolucao',
  };

  const isLowStock = (product: Product) => product.currentStock <= product.minStock;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'low' && isLowStock(p)) ||
      (filter === p.category);
    return matchesSearch && matchesFilter;
  });

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
            <Package className="h-6 w-6 text-blue-500" />
            Controle de Estoque
          </h1>
          <p className="text-muted-foreground">
            Gerencie produtos, movimentacoes e alertas de estoque
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Novo Produto
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Produtos</p>
            <Boxes className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{stats?.totalProducts}</p>
          <p className="text-xs text-muted-foreground mt-1">itens cadastrados</p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Estoque Baixo</p>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-500">{stats?.lowStockCount}</p>
          <p className="text-xs text-muted-foreground mt-1">precisam reposicao</p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Valor em Estoque</p>
            <Package className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totalStockValue || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">custo total</p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Compras (Mes)</p>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.monthlyPurchases || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">investido</p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Consumo (Mes)</p>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats?.monthlyUsage || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">utilizado</p>
        </div>
      </div>

      {/* Alerts */}
      {stats && stats.lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Atencao: Produtos com Estoque Baixo</p>
            <p className="text-sm text-red-600">
              {stats.lowStockCount} produtos estao abaixo do nivel minimo e precisam de reposicao.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Products List */}
        <div className="lg:col-span-2 bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Produtos</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border rounded-lg text-sm w-48"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">Todos</option>
                <option value="low">Estoque Baixo</option>
                <option value="INTERNAL_USE">Uso Interno</option>
                <option value="FOR_SALE">Revenda</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isLowStock(product) ? 'bg-red-50 border border-red-200' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isLowStock(product) ? 'bg-red-100' : 'bg-blue-100'}`}>
                    <Package className={`h-5 w-5 ${isLowStock(product) ? 'text-red-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.brand} - {product.sku}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isLowStock(product) ? 'text-red-600' : ''}`}>
                    {product.currentStock} {product.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min: {product.minStock} | {formatCurrency(product.costPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Movements */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Movimentacoes Recentes
          </h2>
          <div className="space-y-3">
            {movements.map((movement) => (
              <div key={movement.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className={`p-2 rounded-lg ${movement.quantity > 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                  {movement.quantity > 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-orange-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{movement.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {movementTypeLabels[movement.type]} por {movement.user?.name}
                  </p>
                </div>
                <p className={`font-bold text-sm ${movement.quantity > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                </p>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 p-2 text-sm text-primary hover:bg-muted rounded-lg transition-colors">
            Ver todas movimentacoes
          </button>
        </div>
      </div>
    </div>
  );
}
