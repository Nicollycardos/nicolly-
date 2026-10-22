import React, { useState } from 'react';
import {
  Gauge,
  Plus,
  Cpu,
  Clock,
  Users,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { WorkcenterCapacity, ProductionOrder, Product } from '../types/erp.js';
import { Modal } from './Modal.js';

interface CapacityManagerProps {
  capacities: WorkcenterCapacity[];
  productionOrders: ProductionOrder[];
  products: Product[];
  onSaveCapacity: (capacity: Partial<WorkcenterCapacity>) => Promise<void>;
  onDeleteCapacity: (id: string) => Promise<void>;
}

export const CapacityManager: React.FC<CapacityManagerProps> = ({
  capacities,
  productionOrders,
  products,
  onSaveCapacity,
  onDeleteCapacity
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState<WorkcenterCapacity | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [capacityPerDay, setCapacityPerDay] = useState<number | ''>(8);
  const [capacityUnit, setCapacityUnit] = useState<'horas/dia' | 'unidades/dia'>('horas/dia');
  const [status, setStatus] = useState<'operacional' | 'manutencao' | 'ocioso'>('operacional');
  const [operatorCount, setOperatorCount] = useState<number | ''>(1);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const openNewModal = () => {
    setEditingCapacity(null);
    setCode(`POSTO-${(capacities.length + 1).toString().padStart(2, '0')}`);
    setName('');
    setCapacityPerDay(8);
    setCapacityUnit('horas/dia');
    setStatus('operacional');
    setOperatorCount(1);
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cap: WorkcenterCapacity) => {
    setEditingCapacity(cap);
    setCode(cap.code);
    setName(cap.name);
    setCapacityPerDay(cap.capacityPerDay);
    setCapacityUnit(cap.capacityUnit);
    setStatus(cap.status);
    setOperatorCount(cap.operatorCount);
    setNotes(cap.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('O nome do processo ou máquina é obrigatório.');
      return;
    }
    if (capacityPerDay === '' || Number(capacityPerDay) <= 0) {
      setFormError('A capacidade nominal deve ser maior que zero.');
      return;
    }

    try {
      await onSaveCapacity({
        ...(editingCapacity ? { id: editingCapacity.id } : {}),
        code: code.trim(),
        name: name.trim(),
        capacityPerDay: Number(capacityPerDay),
        capacityUnit,
        status,
        operatorCount: Number(operatorCount || 1),
        notes: notes.trim()
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar posto de trabalho');
    }
  };

  // Calcular carga atual de cada posto a partir das OPs ativas
  const getWorkcenterLoad = (workcenterId: string, dailyCapacity: number) => {
    const activeOPsForWorkcenter = productionOrders.filter(
      (op) =>
        (op.status === 'em_producao' || op.status === 'aguardando') &&
        (op.workcenterId === workcenterId || (!op.workcenterId && capacities[0]?.id === workcenterId))
    );

    const totalMinutesAllocated = activeOPsForWorkcenter.reduce(
      (acc, op) => acc + (op.processTimeTotalMinutes || 0),
      0
    );
    const totalHoursAllocated = totalMinutesAllocated / 60;
    
    // Capacidade para os próximos 5 dias de turno
    const weeklyAvailableHours = dailyCapacity * 5;
    const loadPercent = weeklyAvailableHours > 0 ? Math.round((totalHoursAllocated / weeklyAvailableHours) * 100) : 0;

    return {
      activeOPCount: activeOPsForWorkcenter.length,
      totalHoursAllocated: Number(totalHoursAllocated.toFixed(1)),
      loadPercent: Math.min(150, loadPercent)
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Gauge className="h-6 w-6 text-blue-600 mr-2" />
            Capacidade Produtiva & Postos de Trabalho
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastros de máquinas, postos de trabalho e dimensionamento de carga fabril.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Posto / Processo</span>
        </button>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {capacities.map((cap) => {
          const loadInfo = getWorkcenterLoad(cap.id, cap.capacityPerDay);
          const isOverloaded = loadInfo.loadPercent > 90;

          return (
            <div
              key={cap.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition hover:shadow-md ${
                isOverloaded ? 'border-amber-300' : 'border-slate-200'
              }`}
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {cap.code}
                </span>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      cap.status === 'operacional'
                        ? 'bg-emerald-100 text-emerald-800'
                        : cap.status === 'manutencao'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {cap.status === 'operacional' ? 'Operacional' : cap.status === 'manutencao' ? 'Em Manutenção' : 'Ocioso'}
                  </span>
                  <button
                    onClick={() => openEditModal(cap)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover o posto "${cap.name}"?`)) {
                        onDeleteCapacity(cap.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Workcenter title */}
              <h3 className="font-bold text-base text-slate-900 mt-2">{cap.name}</h3>
              {cap.notes && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{cap.notes}</p>}

              {/* Stats & Capacity */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Capacidade Diária</span>
                  <strong className="text-slate-800 flex items-center mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-blue-500 mr-1" />
                    {cap.capacityPerDay} {cap.capacityUnit}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block">Equipe / Operadores</span>
                  <strong className="text-slate-800 flex items-center mt-0.5">
                    <Users className="h-3.5 w-3.5 text-indigo-500 mr-1" />
                    {cap.operatorCount} {cap.operatorCount === 1 ? 'operador' : 'operadores'}
                  </strong>
                </div>
              </div>

              {/* Load Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600 flex items-center">
                    <Activity className="h-3.5 w-3.5 mr-1 text-slate-400" />
                    Ocupação estimada (5 dias)
                  </span>
                  <span
                    className={`font-bold ${
                      isOverloaded ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {loadInfo.loadPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      loadInfo.loadPercent > 100
                        ? 'bg-rose-600'
                        : loadInfo.loadPercent > 80
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, loadInfo.loadPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>{loadInfo.activeOPCount} OP(s) alocadas</span>
                  <span>{loadInfo.totalHoursAllocated}h de produção</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCapacity ? 'Editar Posto de Trabalho' : 'Novo Posto de Trabalho / Máquina'}
        subtitle="Defina o processo produtivo, turnos e capacidade nominal."
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
                Código do Posto
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: POSTO-01"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Processo / Máquina *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Corte de Madeira, Solda MIG, Pintura Eletrostática..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Capacidade Nominal *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={capacityPerDay}
                onChange={(e) => setCapacityPerDay(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="8"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unidade de Capacidade
              </label>
              <select
                value={capacityUnit}
                onChange={(e) => setCapacityUnit(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="horas/dia">Horas por Dia</option>
                <option value="unidades/dia">Unidades por Dia</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operadores Alocados
              </label>
              <input
                type="number"
                min="1"
                value={operatorCount}
                onChange={(e) => setOperatorCount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Operacional
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="operacional">Operacional (Em pleno funcionamento)</option>
              <option value="manutencao">Em Manutenção Preventiva/Corretiva</option>
              <option value="ocioso">Ocioso / Reserva Técnica</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição do Posto e Restrições
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Turno diurno, limite de dimensão da chapa, tempo de setup..."
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
              {editingCapacity ? 'Salvar Posto' : 'Criar Posto de Trabalho'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
