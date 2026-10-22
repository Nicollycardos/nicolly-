import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Factory,
  Trash2,
  Edit2,
  Calendar,
  User,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { CustomerOrder, Contact, Product, OrderItem } from '../types/erp.js';
import { Modal } from './Modal.js';

interface OrdersManagerProps {
  orders: CustomerOrder[];
  contacts: Contact[];
  products: Product[];
  onSaveOrder: (order: Partial<CustomerOrder>) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  onGenerateOP: (orderId: string) => Promise<void>;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  contacts,
  products,
  onSaveOrder,
  onDeleteOrder,
  onGenerateOP
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);

  // Form State
  const [clientId, setClientId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [status, setStatus] = useState<'pendente' | 'em_producao' | 'concluido' | 'cancelado'>('pendente');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Item being added in form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState<number | ''>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number | ''>(0);

  const clients = contacts.filter((c) => c.type === 'cliente' || c.type === 'ambos');
  const getClient = (id: string) => contacts.find((c) => c.id === id);
  const getProduct = (id: string) => products.find((p) => p.id === id);

  const openNewModal = () => {
    setEditingOrder(null);
    setClientId(clients[0]?.id || '');
    setOrderDate(new Date().toISOString().split('T')[0]);
    // Default deadline: 10 days from now
    const d = new Date();
    d.setDate(d.getDate() + 10);
    setDeliveryDeadline(d.toISOString().split('T')[0]);
    setStatus('pendente');
    setItems([]);
    setNotes('');
    setFormError('');

    // Pre-select first product
    if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setItemQty(1);
      setItemUnitPrice(products[0].suggestedSalePrice || 0);
    }

    setIsModalOpen(true);
  };

  const openEditModal = (ord: CustomerOrder) => {
    setEditingOrder(ord);
    setClientId(ord.clientId);
    setOrderDate(ord.orderDate);
    setDeliveryDeadline(ord.deliveryDeadline);
    setStatus(ord.status);
    setItems([...ord.items]);
    setNotes(ord.notes || '');
    setFormError('');

    if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setItemQty(1);
      setItemUnitPrice(products[0].suggestedSalePrice || 0);
    }

    setIsModalOpen(true);
  };

  const handleProductSelectChange = (id: string) => {
    setSelectedProductId(id);
    const prd = getProduct(id);
    if (prd) {
      setItemUnitPrice(prd.suggestedSalePrice || 0);
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    if (itemQty === '' || Number(itemQty) <= 0) return;

    const qty = Number(itemQty);
    const prc = Number(itemUnitPrice || 0);

    const existingIndex = items.findIndex((i) => i.productId === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].unitPrice = prc;
      setItems(updated);
    } else {
      setItems([...items, { productId: selectedProductId, quantity: qty, unitPrice: prc }]);
    }

    setItemQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = (orderItems: OrderItem[]) => {
    return orderItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setFormError('Selecione um cliente para o pedido.');
      return;
    }
    if (items.length === 0) {
      setFormError('Adicione pelo menos um produto ao pedido.');
      return;
    }
    if (!deliveryDeadline) {
      setFormError('Informe o prazo limite de entrega do pedido.');
      return;
    }

    try {
      await onSaveOrder({
        ...(editingOrder ? { id: editingOrder.id } : {}),
        clientId,
        orderDate,
        deliveryDeadline,
        status,
        items,
        notes: notes.trim(),
        totalAmount: calculateTotal(items)
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar pedido');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const client = getClient(o.clientId);
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (client?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'todos' ? true : o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <ClipboardList className="h-6 w-6 text-blue-600 mr-2" />
            Cadastro & Gestão de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pedidos de clientes, prazos acordados e emissão direta de ordens de produção.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Pedido de Cliente</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número do pedido ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:inline" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Apenas Pendentes</option>
            <option value="em_producao">Em Produção</option>
            <option value="concluido">Concluídos</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <ClipboardList className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">Nenhum pedido encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const client = getClient(ord.clientId);
            const total = calculateTotal(ord.items);

            return (
              <div
                key={ord.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ord.status === 'pendente'
                            ? 'bg-amber-100 text-amber-800'
                            : ord.status === 'em_producao'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.status === 'concluido'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ord.status === 'pendente'
                          ? 'Pendente'
                          : ord.status === 'em_producao'
                          ? 'Em Produção'
                          : ord.status === 'concluido'
                          ? 'Concluído'
                          : 'Cancelado'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                      <span className="flex items-center font-medium text-slate-800">
                        <User className="h-3.5 w-3.5 mr-1 text-slate-400" />
                        Cliente: <strong>{client?.name || 'Não identificado'}</strong>
                      </span>
                      <span className="flex items-center text-slate-500">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
                        Emitido em: {ord.orderDate}
                      </span>
                      <span className="flex items-center text-slate-700 font-medium">
                        <Clock className="h-3.5 w-3.5 mr-1 text-blue-500" />
                        Prazo de Entrega: <strong className="ml-1 text-slate-900">{ord.deliveryDeadline}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions & Total */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total do Pedido</span>
                      <span className="text-lg font-black text-slate-900">
                        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* 1-Click OP Generation */}
                      {ord.status === 'pendente' && (
                        <button
                          onClick={() => {
                            if (confirm(`Gerar Ordem(ns) de Produção para o pedido ${ord.orderNumber}?`)) {
                              onGenerateOP(ord.id);
                            }
                          }}
                          className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                          title="Explodir itens e gerar Ordens de Produção (PCP)"
                        >
                          <Factory className="h-3.5 w-3.5" />
                          <span>Gerar OP</span>
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(ord)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                        title="Editar Pedido"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover o pedido ${ord.orderNumber}?`)) {
                            onDeleteOrder(ord.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Excluir Pedido"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items in order */}
                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-500 mb-2">Produtos do Pedido:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {ord.items.map((it, idx) => {
                      const prd = getProduct(it.productId);
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 text-xs flex justify-between items-center"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {prd?.name || 'Produto não encontrado'}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              {it.quantity} {prd?.unit || 'un'} x {it.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900">
                            {(it.quantity * it.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {ord.notes && (
                  <p className="mt-3 text-xs text-slate-500 bg-amber-50/50 border border-amber-100 p-2 rounded-lg">
                    <strong>Observações:</strong> {ord.notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Criar / Editar Pedido */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrder ? `Editar Pedido ${editingOrder.orderNumber}` : 'Novo Pedido de Cliente'}
        subtitle="Informe o cliente, prazo e adicione os produtos solicitados."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente *
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Selecione o cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `(${c.city})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status do Pedido
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="pendente">Pendente (Aguardando Fabricação)</option>
                <option value="em_producao">Em Produção (OP emitidas)</option>
                <option value="concluido">Concluído (Entregue)</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Pedido
              </label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prazo Prometido de Entrega *
              </label>
              <input
                type="date"
                required
                value={deliveryDeadline}
                onChange={(e) => setDeliveryDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Builder de Itens do Pedido */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Produtos do Pedido
              </h4>
              <span className="text-xs font-semibold text-slate-700">
                Valor Total:{' '}
                <strong className="text-slate-900">
                  {calculateTotal(items).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>
              </span>
            </div>

            {/* Adicionar Produto */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Produto
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelectChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Qte
                </label>
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="1"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Preço Unitário (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemUnitPrice}
                  onChange={(e) => setItemUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center justify-center transition"
                  title="Adicionar ao Pedido"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* List of items */}
            {items.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">
                Nenhum produto incluído no pedido ainda.
              </p>
            ) : (
              <div className="space-y-1.5">
                {items.map((it, idx) => {
                  const prd = getProduct(it.productId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{prd?.name}</span>
                        <span className="text-slate-500 ml-2">
                          ({it.quantity} {prd?.unit || 'un'} x {it.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-slate-900">
                          {(it.quantity * it.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações do Pedido
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções de entrega, detalhes de embalagem..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm"
            >
              {editingOrder ? 'Salvar Pedido' : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
