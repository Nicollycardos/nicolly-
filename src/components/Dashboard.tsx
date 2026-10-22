import React from 'react';
import {
  Factory,
  ClipboardList,
  Package,
  Gauge,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Plus
} from 'lucide-react';
import { DashboardStats, Product, CustomerOrder, ProductionOrder, RawMaterial } from '../types/erp.js';
import { TabType } from './Navbar.js';

interface DashboardProps {
  stats: DashboardStats | null;
  products: Product[];
  orders: CustomerOrder[];
  productionOrders: ProductionOrder[];
  rawMaterials: RawMaterial[];
  setCurrentTab: (tab: TabType) => void;
  onOpenNewOPModal: () => void;
  onOpenNewOrderModal: () => void;
  onOpenNewMaterialModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  products,
  orders,
  productionOrders,
  rawMaterials,
  setCurrentTab,
  onOpenNewOPModal,
  onOpenNewOrderModal,
  onOpenNewMaterialModal
}) => {
  const getProduct = (id: string) => products.find((p) => p.id === id);

  const activeOPs = productionOrders.filter(
    (op) => op.status === 'em_producao' || op.status === 'aguardando'
  );

  const criticalMaterials = rawMaterials.filter(
    (m) => m.currentStock <= m.minimumStock
  );

  const pendingOrders = orders.filter((o) => o.status === 'pendente' || o.status === 'em_producao');

  const totalRawMaterialsValue = rawMaterials.reduce(
    (acc, m) => acc + m.currentStock * m.unitCost,
    0
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Painel de Planejamento & Controle da Produção
            </h1>
          </div>
          <p className="text-slate-300 text-sm mt-1">
            Visão consolidada de ordens de produção, disponibilidade de matéria-prima e capacidade fabril.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewOPModal}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow transition"
          >
            <Plus className="h-4 w-4" />
            <span>Emitir Ordem de Produção</span>
          </button>
          <button
            onClick={onOpenNewOrderModal}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Pedido</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: OPs Ativas */}
        <div
          onClick={() => setCurrentTab('production-orders')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ordens em Aberto
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition">
              <Factory className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.totalActiveProductionOrders ?? activeOPs.length}
            </span>
            <span className="text-xs font-medium text-blue-600 group-hover:translate-x-0.5 transition flex items-center">
              Ver produção <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {productionOrders.filter((o) => o.status === 'em_producao').length} em andamento,{' '}
            {productionOrders.filter((o) => o.status === 'aguardando').length} aguardando início
          </p>
        </div>

        {/* Card 2: Pedidos Pendentes */}
        <div
          onClick={() => setCurrentTab('orders')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pedidos de Clientes
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {pendingOrders.length}
            </span>
            <span className="text-xs font-medium text-indigo-600 group-hover:translate-x-0.5 transition flex items-center">
              Ver pedidos <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total de {orders.length} pedidos registrados na carteira
          </p>
        </div>

        {/* Card 3: Insumos Críticos */}
        <div
          onClick={() => setCurrentTab('raw-materials')}
          className={`bg-white rounded-xl border p-5 shadow-xs transition cursor-pointer group ${
            criticalMaterials.length > 0
              ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estoque de Matéria-Prima
            </span>
            <div
              className={`p-2 rounded-lg transition ${
                criticalMaterials.length > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span
              className={`text-3xl font-extrabold ${
                criticalMaterials.length > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {criticalMaterials.length}
            </span>
            <span className="text-xs font-medium text-slate-600 group-hover:translate-x-0.5 transition flex items-center">
              Gerenciar estoque <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {criticalMaterials.length > 0 ? (
              <span className="text-amber-600 font-medium">Abaixo do estoque mínimo de segurança</span>
            ) : (
              <span className="text-emerald-600 font-medium">Todos os itens em nível seguro</span>
            )}
          </p>
        </div>

        {/* Card 4: Capacidade / Carga Fabril */}
        <div
          onClick={() => setCurrentTab('capacity')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-purple-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Carga de Capacidade
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition">
              <Gauge className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.averageCapacityLoad ?? 45}%
            </span>
            <span className="text-xs font-medium text-purple-600 group-hover:translate-x-0.5 transition flex items-center">
              Ver postos <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${
                (stats?.averageCapacityLoad || 45) > 85 ? 'bg-rose-500' : 'bg-purple-600'
              }`}
              style={{ width: `${Math.min(100, stats?.averageCapacityLoad || 45)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Production Live Tracking + Material Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2 Cols: Live Production Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ordens de Produção em Andamento</h2>
              <p className="text-xs text-slate-500">Acompanhamento imediato das prioridades de fabricação</p>
            </div>
            <button
              onClick={() => setCurrentTab('production-orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
            >
              Ver Quadro Completo <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activeOPs.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Factory className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">Nenhuma ordem de produção ativa no momento.</p>
                <button
                  onClick={onOpenNewOPModal}
                  className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Emitir nova OP</span>
                </button>
              </div>
            ) : (
              activeOPs.map((op) => {
                const product = getProduct(op.productId);
                return (
                  <div key={op.id} className="p-4 sm:px-6 hover:bg-slate-50 transition flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{op.code}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            op.status === 'em_producao'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {op.status === 'em_producao' ? 'Em Produção' : 'Aguardando Início'}
                        </span>
                        {op.sourceType === 'pedido' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                            Pedido Cliente
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">
                        {product?.name || 'Produto não encontrado'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span>Lote: <strong className="text-slate-700">{op.quantity} {product?.unit || 'un'}</strong></span>
                        <span className="flex items-center text-slate-500">
                          <Clock className="h-3 w-3 mr-1 text-slate-400" />
                          Tempo total: {Math.round(op.processTimeTotalMinutes / 60)}h {op.processTimeTotalMinutes % 60}m
                        </span>
                        <span>Prazo: <strong className="text-slate-700">{op.deadlineDate}</strong></span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentTab('production-orders')}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        Acompanhar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Side Col: Material Stock Warnings & Summary */}
        <div className="space-y-6">
          {/* Critical Stock Alert Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Alerta de Insumos</h3>
              </div>
              <button
                onClick={() => setCurrentTab('raw-materials')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Gerenciar
              </button>
            </div>

            {criticalMaterials.length === 0 ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Nenhum insumo abaixo do estoque mínimo de segurança no momento.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {criticalMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 truncate max-w-[180px]">{mat.name}</p>
                      <p className="text-slate-500">
                        Atual: <span className="font-bold text-rose-600">{mat.currentStock} {mat.unit}</span> (Mínimo: {mat.minimumStock} {mat.unit})
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                      Repor
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Business Summary / Mini stats */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Resumo Operacional
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-600">Total de Fichas Técnicas:</span>
                <strong className="text-slate-900">{products.length} produtos</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-600">Itens de Matéria-Prima:</span>
                <strong className="text-slate-900">{rawMaterials.length} insumos</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-600">Valor Imobilizado em Estoque:</span>
                <strong className="text-emerald-700">
                  {totalRawMaterialsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Clientes & Parceiros:</span>
                <strong className="text-slate-900">{stats?.totalClientsCount ?? 2} clientes</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
