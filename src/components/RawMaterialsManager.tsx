import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  DollarSign,
  ArrowUpDown
} from 'lucide-react';
import { RawMaterial, Contact } from '../types/erp.js';
import { Modal } from './Modal.js';

interface RawMaterialsManagerProps {
  materials: RawMaterial[];
  contacts: Contact[];
  onSaveMaterial: (material: Partial<RawMaterial>) => Promise<void>;
  onDeleteMaterial: (id: string) => Promise<void>;
}

export const RawMaterialsManager: React.FC<RawMaterialsManagerProps> = ({
  materials,
  contacts,
  onSaveMaterial,
  onDeleteMaterial
}) => {
  const [search, setSearch] = useState('');
  const [filterCritical, setFilterCritical] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('un');
  const [currentStock, setCurrentStock] = useState<number | ''>(0);
  const [minimumStock, setMinimumStock] = useState<number | ''>(10);
  const [unitCost, setUnitCost] = useState<number | ''>(0);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const suppliers = contacts.filter((c) => c.type === 'fornecedor' || c.type === 'ambos');

  const openNewModal = () => {
    setEditingMaterial(null);
    setCode(`MP-${(materials.length + 1).toString().padStart(3, '0')}`);
    setName('');
    setUnit('un');
    setCurrentStock(0);
    setMinimumStock(10);
    setUnitCost(0);
    setSupplierId('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (mat: RawMaterial) => {
    setEditingMaterial(mat);
    setCode(mat.code);
    setName(mat.name);
    setUnit(mat.unit);
    setCurrentStock(mat.currentStock);
    setMinimumStock(mat.minimumStock);
    setUnitCost(mat.unitCost);
    setSupplierId(mat.supplierId || '');
    setNotes(mat.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('O nome da matéria-prima é obrigatório.');
      return;
    }
    if (currentStock === '' || Number(currentStock) < 0) {
      setFormError('A quantidade em estoque deve ser um número maior ou igual a zero.');
      return;
    }
    if (unitCost === '' || Number(unitCost) < 0) {
      setFormError('O custo unitário deve ser um número maior ou igual a zero.');
      return;
    }

    try {
      await onSaveMaterial({
        ...(editingMaterial ? { id: editingMaterial.id } : {}),
        code: code.trim(),
        name: name.trim(),
        unit: unit.trim(),
        currentStock: Number(currentStock),
        minimumStock: Number(minimumStock || 0),
        unitCost: Number(unitCost),
        supplierId: supplierId || undefined,
        notes: notes.trim()
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar matéria-prima');
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase());
    const matchesCritical = filterCritical ? m.currentStock <= m.minimumStock : true;
    return matchesSearch && matchesCritical;
  });

  const totalInventoryValue = materials.reduce(
    (acc, m) => acc + m.currentStock * m.unitCost,
    0
  );
  const criticalCount = materials.filter((m) => m.currentStock <= m.minimumStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-2" />
            Cadastro de Matérias-Primas & Estoque
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Controle de insumos, unidades de medida, quantidades em estoque e custos unitários.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Matéria-Prima</span>
        </button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Itens Cadastrados</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{materials.length}</p>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Valor em Estoque</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {totalInventoryValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div
          onClick={() => setFilterCritical(!filterCritical)}
          className={`p-4 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition ${
            criticalCount > 0
              ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Estoque Crítico</span>
            <p className={`text-2xl font-extrabold mt-1 ${criticalCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {criticalCount} {criticalCount === 1 ? 'item' : 'itens'}
            </p>
          </div>
          <div
            className={`p-2.5 rounded-lg ${
              criticalCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou código (ex: Cedro, MP-001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterCritical(!filterCritical)}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition ${
              filterCritical
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{filterCritical ? 'Exibindo Apenas Críticos' : 'Filtrar Estoque Baixo'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <th className="py-3.5 px-4">Código / Item</th>
                <th className="py-3.5 px-4">Unidade</th>
                <th className="py-3.5 px-4">Estoque Atual</th>
                <th className="py-3.5 px-4">Estoque Mínimo</th>
                <th className="py-3.5 px-4">Custo Unitário</th>
                <th className="py-3.5 px-4">Total Imobilizado</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">Nenhuma matéria-prima encontrada com os filtros atuais.</p>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const isCritical = mat.currentStock <= mat.minimumStock;
                  const supplier = suppliers.find((s) => s.id === mat.supplierId);
                  const totalCost = mat.currentStock * mat.unitCost;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{mat.name}</div>
                        <div className="text-xs text-slate-500 font-mono flex items-center space-x-2">
                          <span>{mat.code}</span>
                          {supplier && (
                            <span className="text-slate-400 truncate max-w-[150px]">
                              • Forn: {supplier.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {mat.unit}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${isCritical ? 'text-rose-600' : 'text-slate-900'}`}>
                          {mat.currentStock} {mat.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {mat.minimumStock} {mat.unit}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {mat.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-emerald-800">
                        {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-3.5 px-4">
                        {isCritical ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Abaixo do Mínimo
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(mat)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Editar Matéria-Prima"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente excluir "${mat.name}"?`)) {
                                onDeleteMaterial(mat.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Excluir"
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

      {/* Modal Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}
        subtitle="Informe os dados técnicos, níveis de estoque e custos do insumo."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código / SKU
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: MP-001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Matéria-Prima *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Madeira Cedro Rosa, Parafuso M6, Tubo de Aço..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unidade de Medida *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="un">un (Unidade)</option>
                <option value="m²">m² (Metro Quadrado)</option>
                <option value="m">m (Metro Linear)</option>
                <option value="kg">kg (Quilograma)</option>
                <option value="g">g (Grama)</option>
                <option value="L">L (Litro)</option>
                <option value="ml">ml (Mililitro)</option>
                <option value="cx">cx (Caixa)</option>
                <option value="pc">pç (Peça)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estoque Atual *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estoque Mínimo
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="10"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custo Unitário (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fornecedor Padrão (Opcional)
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Selecione um fornecedor...</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Especificação Técnica
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Espessura, fornecedor alternativo, armazenar em local seco..."
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
              {editingMaterial ? 'Salvar Alterações' : 'Criar Matéria-Prima'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
