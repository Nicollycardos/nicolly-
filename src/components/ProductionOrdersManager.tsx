import React, { useState, useEffect } from 'react';
import {
  Factory,
  Plus,
  Search,
  Filter,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Cpu,
  ArrowRight,
  Trash2,
  Package,
  Play,
  Check,
  RefreshCw,
  LayoutGrid,
  ListFilter
} from 'lucide-react';
import {
  ProductionOrder,
  Product,
  RawMaterial,
  WorkcenterCapacity,
  CustomerOrder,
  ProductionOrderStatus,
  MaterialRequirementCheck,
  CapacityViabilityCheck
} from '../types/erp.js';
import { Modal } from './Modal.js';
import { api } from '../services/api.js';

interface ProductionOrdersManagerProps {
  productionOrders: ProductionOrder[];
  products: Product[];
  rawMaterials: RawMaterial[];
  capacities: WorkcenterCapacity[];
  orders: CustomerOrder[];
  onCreateOP: (data: any) => Promise<void>;
  onUpdateStatus: (id: string, status: string, options?: any) => Promise<void>;
  onDeductStock: (id: string) => Promise<void>;
  onDeleteOP: (id: string) => Promise<void>;
  isNewModalOpenExternal?: boolean;
  onCloseNewModalExternal?: () => void;
}

export const ProductionOrdersManager: React.FC<ProductionOrdersManagerProps> = ({
  productionOrders,
  products,
  rawMaterials,
  capacities,
  orders,
  onCreateOP,
  onUpdateStatus,
  onDeductStock,
  onDeleteOP,
  isNewModalOpenExternal,
  onCloseNewModalExternal
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOPForDetail, setSelectedOPForDetail] = useState<ProductionOrder | null>(null);

  // New OP Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [notes, setNotes] = useState('');
  const [deductStockImmediately, setDeductStockImmediately] = useState(false);
  const [formError, setFormError] = useState('');

  // Live BOM & Capacity check state
  const [liveCheck, setLiveCheck] = useState<{
    materialChecks: MaterialRequirementCheck[];
    allMaterialsAvailable: boolean;
    capacityCheck: CapacityViabilityCheck;
    totalProcessMinutes: number;
    totalProcessHours: number;
  } | null>(null);
  const [isCheckingLive, setIsCheckingLive] = useState(false);

  // Sync external open request (from dashboard)
  useEffect(() => {
    if (isNewModalOpenExternal) {
      openCreateModal();
    }
  }, [isNewModalOpenExternal]);

  const getProduct = (id: string) => products.find((p) => p.id === id);
  const getWorkcenter = (id?: string) => capacities.find((c) => c.id === id);
  const getOrder = (id?: string) => orders.find((o) => o.id === id);

  const openCreateModal = () => {
    setSelectedProductId(products[0]?.id || '');
    setQuantity(1);
    setStartDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setDeadlineDate(d.toISOString().split('T')[0]);
    setNotes('');
    setDeductStockImmediately(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onCloseNewModalExternal) onCloseNewModalExternal();
  };

  // Re-run live check whenever product, quantity or dates change
  useEffect(() => {
    if (!isModalOpen || !selectedProductId || quantity === '' || Number(quantity) <= 0) {
      setLiveCheck(null);
      return;
    }

    const runCheck = async () => {
      setIsCheckingLive(true);
      try {
        const result = await api.checkMaterialsAndCapacity(
          selectedProductId,
          Number(quantity),
          deadlineDate,
          startDate
        );
        setLiveCheck({
          materialChecks: result.materialChecks,
          allMaterialsAvailable: result.allMaterialsAvailable,
          capacityCheck: result.capacityCheck,
          totalProcessMinutes: result.totalProcessMinutes,
          totalProcessHours: result.totalProcessHours
        });
      } catch (err) {
        console.error('Erro na checagem:', err);
      } finally {
        setIsCheckingLive(false);
      }
    };

    runCheck();
  }, [isModalOpen, selectedProductId, quantity, deadlineDate, startDate]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setFormError('Selecione um produto.');
      return;
    }
    if (quantity === '' || Number(quantity) <= 0) {
      setFormError('Informe uma quantidade maior que zero.');
      return;
    }
    if (!deadlineDate) {
      setFormError('Informe a data limite para conclusão da ordem.');
      return;
    }

    try {
      await onCreateOP({
        productId: selectedProductId,
        quantity: Number(quantity),
        startDate,
        deadlineDate,
        notes: notes.trim(),
        deductStockImmediately
      });
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao emitir ordem de produção');
    }
  };

  const filteredOPs = productionOrders.filter((op) => {
    const product = getProduct(op.productId);
    const matchesSearch =
      op.code.toLowerCase().includes(search.toLowerCase()) ||
      (product?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = filterStatus === 'todos' ? true : op.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns: { status: ProductionOrderStatus; label: string; bg: string; border: string; badge: string }[] = [
    {
      status: 'aguardando',
      label: 'Aguardando Início',
      bg: 'bg-amber-50/50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-800'
    },
    {
      status: 'em_producao',
      label: 'Em Produção',
      bg: 'bg-blue-50/50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-800'
    },
    {
      status: 'concluida',
      label: 'Concluída',
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Factory className="h-6 w-6 text-blue-600 mr-2" />
            Ordens de Produção (PCP) & Acompanhamento
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Planejamento fabril, verificação de matérias-primas e gestão visual do chão de fábrica.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Toggle View */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualização em Quadro Kanban"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Quadro</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualização em Lista Detalhada"
            >
              <ListFilter className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Emitir Nova OP</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código da OP ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:inline" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os Status</option>
            <option value="aguardando">Aguardando Início</option>
            <option value="em_producao">Em Produção</option>
            <option value="concluida">Concluídas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      {/* VIEW: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col) => {
            const opsInColumn = filteredOPs.filter((op) => op.status === col.status);

            return (
              <div
                key={col.status}
                className={`rounded-xl border ${col.border} ${col.bg} p-4 flex flex-col min-h-[500px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-800">{col.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badge}`}>
                      {opsInColumn.length}
                    </span>
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {opsInColumn.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs italic">
                      Nenhuma ordem nesta etapa.
                    </div>
                  ) : (
                    opsInColumn.map((op) => {
                      const product = getProduct(op.productId);
                      const workcenter = getWorkcenter(op.workcenterId);
                      const relatedOrder = getOrder(op.orderId);

                      return (
                        <div
                          key={op.id}
                          className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 hover:shadow-md transition space-y-3"
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {op.code}
                            </span>
                            {op.sourceType === 'pedido' ? (
                              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                {relatedOrder ? relatedOrder.orderNumber : 'Pedido'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                Manual / Estoque
                              </span>
                            )}
                          </div>

                          {/* Product and Quantity */}
                          <div>
                            <h2 className="font-bold text-sm text-slate-900 leading-snug">
                              {product?.name || 'Produto não encontrado'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Lote a produzir: <strong className="text-slate-800">{op.quantity} {product?.unit || 'un'}</strong>
                            </p>
                          </div>

                          {/* Details (Tempo e Posto) */}
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] space-y-1 text-slate-600">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-slate-400" />
                                Tempo total:
                              </span>
                              <strong className="text-slate-800">
                                {Math.floor(op.processTimeTotalMinutes / 60)}h {op.processTimeTotalMinutes % 60}m
                              </strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                                Prazo:
                              </span>
                              <strong className="text-slate-800">{op.deadlineDate}</strong>
                            </div>

                            {workcenter && (
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                                <span>Posto:</span>
                                <span className="font-medium text-slate-800 truncate max-w-[130px]">
                                  {workcenter.name}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Stock status indicator */}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Insumos:</span>
                            {op.stockDeducted ? (
                              <span className="text-emerald-700 font-semibold flex items-center">
                                <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                                Estoque baixado
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium">Aguardando baixa</span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <button
                              onClick={() => setSelectedOPForDetail(op)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <Layers className="h-3.5 w-3.5 mr-1" />
                              Ver Insumos
                            </button>

                            <div className="flex items-center space-x-1">
                              {op.status === 'aguardando' && (
                                <button
                                  onClick={() =>
                                    onUpdateStatus(op.id, 'em_producao', {
                                      deductStock: !op.stockDeducted
                                    })
                                  }
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition"
                                  title="Iniciar Produção e dar baixa nos materiais"
                                >
                                  <Play className="h-3 w-3 fill-current" />
                                  <span>Iniciar</span>
                                </button>
                              )}

                              {op.status === 'em_producao' && (
                                <button
                                  onClick={() =>
                                    onUpdateStatus(op.id, 'concluida', {
                                      addToFinishedStock: true
                                    })
                                  }
                                  className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition"
                                  title="Concluir OP e dar entrada no produto acabado"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Concluir</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (confirm(`Remover a ordem ${op.code}?`)) {
                                    onDeleteOP(op.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                title="Excluir OP"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW: DETAILED LIST TABLE */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                  <th className="py-3.5 px-4">Código / Origem</th>
                  <th className="py-3.5 px-4">Produto & Lote</th>
                  <th className="py-3.5 px-4">Posto / Máquina</th>
                  <th className="py-3.5 px-4">Tempo de Produção</th>
                  <th className="py-3.5 px-4">Início / Prazo</th>
                  <th className="py-3.5 px-4">Estoque Insumos</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOPs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Nenhuma ordem de produção encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredOPs.map((op) => {
                    const product = getProduct(op.productId);
                    const workcenter = getWorkcenter(op.workcenterId);

                    return (
                      <tr key={op.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                            {op.code}
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">
                            {op.sourceType === 'pedido' ? 'Pedido Cliente' : 'Manual'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{product?.name}</div>
                          <div className="text-xs text-slate-500">
                            Lote: <strong className="text-slate-800">{op.quantity} {product?.unit || 'un'}</strong>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700">
                          {workcenter?.name || 'Geral'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 font-medium">
                          {Math.floor(op.processTimeTotalMinutes / 60)}h {op.processTimeTotalMinutes % 60}m
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          <div>Início: {op.startDate}</div>
                          <div className="font-semibold text-slate-900">Prazo: {op.deadlineDate}</div>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {op.stockDeducted ? (
                            <span className="text-emerald-700 font-semibold">Baixado</span>
                          ) : (
                            <button
                              onClick={() => onDeductStock(op.id)}
                              className="text-amber-700 hover:underline font-medium"
                              title="Clique para dar baixa nos insumos agora"
                            >
                              Dar baixa
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              op.status === 'aguardando'
                                ? 'bg-amber-100 text-amber-800'
                                : op.status === 'em_producao'
                                ? 'bg-blue-100 text-blue-800'
                                : op.status === 'concluida'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {op.status === 'aguardando'
                              ? 'Aguardando'
                              : op.status === 'em_producao'
                              ? 'Em Produção'
                              : op.status === 'concluida'
                              ? 'Concluída'
                              : 'Cancelada'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setSelectedOPForDetail(op)}
                              className="px-2 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
                            >
                              Detalhes
                            </button>
                            {op.status === 'aguardando' && (
                              <button
                                onClick={() =>
                                  onUpdateStatus(op.id, 'em_producao', { deductStock: true })
                                }
                                className="px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                              >
                                Iniciar
                              </button>
                            )}
                            {op.status === 'em_producao' && (
                              <button
                                onClick={() =>
                                  onUpdateStatus(op.id, 'concluida', { addToFinishedStock: true })
                                }
                                className="px-2 py-1 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded"
                              >
                                Concluir
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(`Remover OP ${op.code}?`)) onDeleteOP(op.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: EMISSÃO DE NOVA OP COM LIVE VERIFICAÇÃO DE MATÉRIA-PRIMA E CAPACIDADE */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Emissão de Ordem de Produção (PCP)"
        subtitle="Verificação automática da ficha técnica, estoque disponível e viabilidade de prazos."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Seleção do Produto e Quantidade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Produto a Fabricar *
              </label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name} ({p.processTimeMinutes} min/un)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade do Lote *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Prevista de Início
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prazo Limite de Conclusão *
              </label>
              <input
                type="date"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* PAINEL DINÂMICO DE ANÁLISE DE CAPACIDADE & DISPONIBILIDADE DE MATÉRIA-PRIMA */}
          {liveCheck && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
              {/* Viabilidade de Capacidade */}
              <div
                className={`p-3 rounded-lg border text-xs flex items-start space-x-2.5 ${
                  liveCheck.capacityCheck.isViable
                    ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                {liveCheck.capacityCheck.isViable ? (
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block font-semibold">
                    Análise de Capacidade Fabril ({liveCheck.capacityCheck.workcenterName || 'Posto Geral'})
                  </strong>
                  <span>{liveCheck.capacityCheck.message}</span>
                </div>
              </div>

              {/* Explosão da Ficha Técnica & Disponibilidade de Matéria-Prima */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                    <Package className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                    Consumo Previsto da Ficha Técnica (BOM)
                  </h4>
                  {liveCheck.allMaterialsAvailable ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      100% dos Insumos Disponíveis
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Atenção: Insumos com Falta
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2 px-3">Matéria-Prima</th>
                        <th className="py-2 px-3">Qte Necessária</th>
                        <th className="py-2 px-3">Estoque Atual</th>
                        <th className="py-2 px-3">Saldo Previsto</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {liveCheck.materialChecks.map((item, idx) => {
                        const balance = item.currentStock - item.totalRequired;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 font-medium text-slate-900">
                              {item.materialName}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-800">
                              {item.totalRequired} {item.unit}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {item.currentStock} {item.unit}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`font-semibold ${
                                  balance >= 0 ? 'text-slate-700' : 'text-rose-600'
                                }`}
                              >
                                {balance.toFixed(1)} {item.unit}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {item.isAvailable ? (
                                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                  Disponível
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                                  Faltam {item.missingAmount.toFixed(1)} {item.unit}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Directive note conforming to user brief */}
                {!liveCheck.allMaterialsAvailable && (
                  <p className="text-[11px] text-amber-700 mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                    <strong>Aviso de Planejamento:</strong> Existem insumos insuficientes em estoque.
                    A emissão da ordem <em>não é bloqueada</em> para permitir compras ou reservas em paralelo,
                    mas recomendamos providenciar os materiais antes de iniciar a fabricação.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Option: Baixar estoque imediatamente */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="deductImmediately"
              checked={deductStockImmediately}
              onChange={(e) => setDeductStockImmediately(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="deductImmediately" className="text-xs text-slate-700 font-medium cursor-pointer">
              Baixar do estoque de matéria-prima imediatamente ao emitir esta OP
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Instruções para a Linha
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções de acabamento, detalhes do lote..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm"
            >
              Emitir Ordem de Produção
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DETALHES DE UMA OP EXISTENTE */}
      <Modal
        isOpen={Boolean(selectedOPForDetail)}
        onClose={() => setSelectedOPForDetail(null)}
        title={selectedOPForDetail ? `Detalhes da Ordem ${selectedOPForDetail.code}` : ''}
        subtitle="Insumos consumidos e informações de produção."
      >
        {selectedOPForDetail && (
          <div className="space-y-4 text-xs">
            {(() => {
              const product = getProduct(selectedOPForDetail.productId);
              const workcenter = getWorkcenter(selectedOPForDetail.workcenterId);

              return (
                <>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block">Produto</span>
                      <strong className="text-slate-800 text-sm">{product?.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Lote da OP</span>
                      <strong className="text-slate-800 text-sm">
                        {selectedOPForDetail.quantity} {product?.unit}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tempo Total</span>
                      <strong className="text-slate-800">
                        {Math.floor(selectedOPForDetail.processTimeTotalMinutes / 60)}h{' '}
                        {selectedOPForDetail.processTimeTotalMinutes % 60}m
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Posto Alocado</span>
                      <strong className="text-slate-800">{workcenter?.name || 'Geral'}</strong>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 mb-2 uppercase text-[11px]">
                      Matérias-Primas Necessárias (Total para {selectedOPForDetail.quantity} {product?.unit})
                    </h4>
                    <div className="space-y-1.5">
                      {product?.bom.map((bomItem, idx) => {
                        const mat = rawMaterials.find((m) => m.id === bomItem.rawMaterialId);
                        const totalReq = bomItem.quantityNeeded * selectedOPForDetail.quantity;

                        return (
                          <div
                            key={idx}
                            className="p-2 bg-white rounded border border-slate-200 flex justify-between items-center"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{mat?.name}</span>
                              <span className="text-slate-500 ml-1">
                                ({bomItem.quantityNeeded} {mat?.unit}/un)
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-900">
                                {totalReq.toFixed(1)} {mat?.unit}
                              </span>
                              <span className="block text-[10px] text-slate-500">
                                Estoque atual: {mat?.currentStock} {mat?.unit}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedOPForDetail.notes && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <strong>Observações:</strong> {selectedOPForDetail.notes}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setSelectedOPForDetail(null)}
                      className="px-4 py-1.5 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};
