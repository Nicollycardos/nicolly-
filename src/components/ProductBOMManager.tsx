import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Clock,
  DollarSign,
  Package,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { Product, BOMItem, RawMaterial, WorkcenterCapacity } from '../types/erp.js';
import { Modal } from './Modal.js';

interface ProductBOMManagerProps {
  products: Product[];
  rawMaterials: RawMaterial[];
  capacities: WorkcenterCapacity[];
  onSaveProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export const ProductBOMManager: React.FC<ProductBOMManagerProps> = ({
  products,
  rawMaterials,
  capacities,
  onSaveProduct,
  onDeleteProduct
}) => {
  const [search, setSearch] = useState('');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Móveis');
  const [unit, setUnit] = useState('un');
  const [processTimeMinutes, setProcessTimeMinutes] = useState<number | ''>(60);
  const [primaryWorkcenterId, setPrimaryWorkcenterId] = useState('');
  const [suggestedSalePrice, setSuggestedSalePrice] = useState<number | ''>(0);
  const [currentFinishedStock, setCurrentFinishedStock] = useState<number | ''>(0);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [formError, setFormError] = useState('');

  // BOM item line being added
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState('');
  const [materialQty, setMaterialQty] = useState<number | ''>(1);
  const [itemNotes, setItemNotes] = useState('');

  const getRawMaterial = (id: string) => rawMaterials.find((m) => m.id === id);
  const getWorkcenter = (id?: string) => capacities.find((c) => c.id === id);

  const calculateProductBOMCost = (bom: BOMItem[]) => {
    return bom.reduce((acc, item) => {
      const mat = getRawMaterial(item.rawMaterialId);
      const cost = mat ? mat.unitCost : 0;
      return acc + cost * item.quantityNeeded;
    }, 0);
  };

  const openNewModal = () => {
    setEditingProduct(null);
    setCode(`PRD-${(products.length + 1).toString().padStart(3, '0')}`);
    setName('');
    setDescription('');
    setCategory('Móveis');
    setUnit('un');
    setProcessTimeMinutes(60);
    setPrimaryWorkcenterId(capacities[0]?.id || '');
    setSuggestedSalePrice(0);
    setCurrentFinishedStock(0);
    setBomItems([]);
    setSelectedRawMaterialId(rawMaterials[0]?.id || '');
    setMaterialQty(1);
    setItemNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (prd: Product) => {
    setEditingProduct(prd);
    setCode(prd.code);
    setName(prd.name);
    setDescription(prd.description);
    setCategory(prd.category);
    setUnit(prd.unit);
    setProcessTimeMinutes(prd.processTimeMinutes);
    setPrimaryWorkcenterId(prd.primaryWorkcenterId || '');
    setSuggestedSalePrice(prd.suggestedSalePrice);
    setCurrentFinishedStock(prd.currentFinishedStock);
    setBomItems([...prd.bom]);
    setSelectedRawMaterialId(rawMaterials[0]?.id || '');
    setMaterialQty(1);
    setItemNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddBOMItem = () => {
    if (!selectedRawMaterialId) return;
    if (materialQty === '' || Number(materialQty) <= 0) return;

    // Check if already in list
    const existingIndex = bomItems.findIndex((b) => b.rawMaterialId === selectedRawMaterialId);
    if (existingIndex >= 0) {
      const updated = [...bomItems];
      updated[existingIndex].quantityNeeded += Number(materialQty);
      if (itemNotes) updated[existingIndex].notes = itemNotes;
      setBomItems(updated);
    } else {
      setBomItems([
        ...bomItems,
        {
          rawMaterialId: selectedRawMaterialId,
          quantityNeeded: Number(materialQty),
          notes: itemNotes.trim()
        }
      ]);
    }

    setMaterialQty(1);
    setItemNotes('');
  };

  const handleRemoveBOMItem = (index: number) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('O nome do produto é obrigatório.');
      return;
    }
    if (processTimeMinutes === '' || Number(processTimeMinutes) < 1) {
      setFormError('O tempo de processo deve ser de pelo menos 1 minuto.');
      return;
    }

    try {
      await onSaveProduct({
        ...(editingProduct ? { id: editingProduct.id } : {}),
        code: code.trim(),
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        unit: unit.trim(),
        processTimeMinutes: Number(processTimeMinutes),
        primaryWorkcenterId: primaryWorkcenterId || undefined,
        suggestedSalePrice: Number(suggestedSalePrice || 0),
        currentFinishedStock: Number(currentFinishedStock || 0),
        bom: bomItems
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar produto');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours === 0) return `${m} min`;
    if (m === 0) return `${hours}h`;
    return `${hours}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Layers className="h-6 w-6 text-blue-600 mr-2" />
            Fichas Técnicas dos Produtos (BOM) & Tempos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Definição da estrutura de insumos por unidade e tempo padrão de fabricação.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Novo Produto & Ficha</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por produto, código ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Products List & BOM Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <Layers className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">Nenhum produto cadastrado.</p>
          </div>
        ) : (
          filteredProducts.map((prd) => {
            const bomCost = calculateProductBOMCost(prd.bom);
            const workcenter = getWorkcenter(prd.primaryWorkcenterId);
            const isExpanded = expandedProductId === prd.id;

            return (
              <div
                key={prd.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition"
              >
                {/* Product Summary Row */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {prd.code}
                      </span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {prd.category}
                      </span>
                      <h2 className="text-base font-bold text-slate-900">{prd.name}</h2>
                    </div>
                    {prd.description && (
                      <p className="text-xs text-slate-500">{prd.description}</p>
                    )}
                  </div>

                  {/* Highlights (Tempo, Custo da BOM, Preço de Venda) */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                        Tempo de Processo
                      </span>
                      <span className="font-bold text-slate-800 flex items-center mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-blue-500 mr-1" />
                        {formatMinutes(prd.processTimeMinutes)} / {prd.unit}
                      </span>
                    </div>

                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                        Custo da Ficha (BOM)
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5">
                        {bomCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                        Preço Sugerido
                      </span>
                      <span className="font-bold text-emerald-700 mt-0.5">
                        {prd.suggestedSalePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                        Estoque Acabado
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5">
                        {prd.currentFinishedStock} {prd.unit}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1.5 ml-auto">
                      <button
                        onClick={() => setExpandedProductId(isExpanded ? null : prd.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                      >
                        <span>{isExpanded ? 'Ocultar Ficha' : `Ver Ficha (${prd.bom.length})`}</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        onClick={() => openEditModal(prd)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar Produto e Ficha"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Deseja excluir o produto "${prd.name}"?`)) {
                            onDeleteProduct(prd.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded BOM Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                        <Layers className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                        Composição de Matérias-Primas (por 1 {prd.unit})
                      </h4>
                      {workcenter && (
                        <span className="text-xs text-slate-500 flex items-center">
                          <Cpu className="h-3.5 w-3.5 mr-1 text-slate-400" />
                          Posto Principal: <strong className="ml-1 text-slate-700">{workcenter.name}</strong>
                        </span>
                      )}
                    </div>

                    {prd.bom.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        Nenhuma matéria-prima associada a esta ficha técnica. Clique em Editar para cadastrar a BOM.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                              <th className="py-2 px-3">Código</th>
                              <th className="py-2 px-3">Matéria-Prima</th>
                              <th className="py-2 px-3">Qte Necessária</th>
                              <th className="py-2 px-3">Custo Unitário</th>
                              <th className="py-2 px-3">Custo na Peça</th>
                              <th className="py-2 px-3">Estoque Disponível</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {prd.bom.map((item, idx) => {
                              const mat = getRawMaterial(item.rawMaterialId);
                              const lineCost = mat ? mat.unitCost * item.quantityNeeded : 0;
                              const hasStock = mat ? mat.currentStock >= item.quantityNeeded : false;

                              return (
                                <tr key={idx} className="hover:bg-slate-50/80">
                                  <td className="py-2 px-3 font-mono text-slate-500">
                                    {mat?.code || 'N/A'}
                                  </td>
                                  <td className="py-2 px-3 font-medium text-slate-900">
                                    {mat?.name || 'Item não encontrado'}
                                    {item.notes && (
                                      <span className="text-slate-400 ml-1.5 italic">({item.notes})</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 font-bold text-slate-800">
                                    {item.quantityNeeded} {mat?.unit || 'un'}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600">
                                    {(mat?.unitCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="py-2 px-3 font-semibold text-slate-900">
                                    {lineCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`font-semibold ${
                                        hasStock ? 'text-emerald-700' : 'text-amber-700'
                                      }`}
                                    >
                                      {mat?.currentStock || 0} {mat?.unit || 'un'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Criar / Editar Produto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Ficha Técnica do Produto' : 'Novo Produto & Ficha Técnica'}
        subtitle="Defina tempos de produção, matérias-primas e preços."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Dados Gerais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código do Produto
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: PRD-001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Mesa Industrial Noronha, Banqueta Oslo..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Mesas, Cadeiras..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unidade
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="un, cj, pç..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tempo de Processo (minutos) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={processTimeMinutes}
                onChange={(e) => setProcessTimeMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="60"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {processTimeMinutes ? formatMinutes(Number(processTimeMinutes)) : ''} por unidade
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Posto / Máquina Principal
              </label>
              <select
                value={primaryWorkcenterId}
                onChange={(e) => setPrimaryWorkcenterId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Selecione...</option>
                {capacities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.capacityPerDay}h/dia)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preço Sugerido de Venda (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={suggestedSalePrice}
                onChange={(e) => setSuggestedSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estoque Atual de Produto Acabado
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={currentFinishedStock}
                onChange={(e) => setCurrentFinishedStock(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Builder da Ficha Técnica (BOM) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                <Package className="h-4 w-4 mr-1 text-blue-600" />
                Matérias-Primas da Ficha Técnica
              </h4>
              <span className="text-xs font-semibold text-slate-700">
                Custo Total de Insumos:{' '}
                <strong className="text-emerald-700">
                  {calculateProductBOMCost(bomItems).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>
              </span>
            </div>

            {/* Inclusão de Item */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Matéria-Prima
                </label>
                <select
                  value={selectedRawMaterialId}
                  onChange={(e) => setSelectedRawMaterialId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o insumo...</option>
                  {rawMaterials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.code} - {mat.name} ({mat.currentStock} {mat.unit} em estoque)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Qte por Unidade
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  value={materialQty}
                  onChange={(e) => setMaterialQty(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="1.0"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Observação
                </label>
                <input
                  type="text"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Ex: Tampo, solda..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={handleAddBOMItem}
                  disabled={!selectedRawMaterialId}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center justify-center transition"
                  title="Adicionar à Ficha"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Lista dos Itens da BOM */}
            {bomItems.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">
                Nenhuma matéria-prima adicionada ainda à ficha deste produto.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {bomItems.map((item, index) => {
                  const mat = getRawMaterial(item.rawMaterialId);
                  const lineCost = mat ? mat.unitCost * item.quantityNeeded : 0;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-400 font-bold">{mat?.code}</span>
                        <span className="font-semibold text-slate-900">{mat?.name}</span>
                        {item.notes && <span className="text-slate-400">({item.notes})</span>}
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="font-bold text-slate-700">
                          {item.quantityNeeded} {mat?.unit || 'un'}
                        </span>
                        <span className="text-slate-600 font-medium">
                          {lineCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBOMItem(index)}
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
              {editingProduct ? 'Salvar Ficha Técnica' : 'Criar Produto & Ficha'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
