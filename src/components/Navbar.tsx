import React from 'react';
import {
  LayoutDashboard,
  Factory,
  ClipboardList,
  Layers,
  Package,
  Gauge,
  Users,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'production-orders'
  | 'orders'
  | 'products'
  | 'raw-materials'
  | 'capacity'
  | 'contacts';

interface NavbarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  criticalStockCount: number;
  activeOPsCount: number;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  criticalStockCount,
  activeOPsCount,
  onResetData
}) => {
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Visão Geral', icon: LayoutDashboard },
    {
      id: 'production-orders' as TabType,
      label: 'Ordens de Produção (PCP)',
      icon: Factory,
      badge: activeOPsCount > 0 ? activeOPsCount : undefined,
      badgeColor: 'bg-amber-500 text-white'
    },
    { id: 'orders' as TabType, label: 'Pedidos de Clientes', icon: ClipboardList },
    { id: 'products' as TabType, label: 'Fichas Técnicas (BOM)', icon: Layers },
    {
      id: 'raw-materials' as TabType,
      label: 'Matérias-Primas',
      icon: Package,
      badge: criticalStockCount > 0 ? criticalStockCount : undefined,
      badgeColor: 'bg-red-500 text-white'
    },
    { id: 'capacity' as TabType, label: 'Capacidade Produtiva', icon: Gauge },
    { id: 'contacts' as TabType, label: 'Clientes & Fornecedores', icon: Users }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">PlanoERP</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                  PCP Pequena Empresa
                </span>
              </div>
              <p className="text-xs text-slate-400">Planejamento e Controle de Produção Descomplicado</p>
            </div>
          </div>

          {/* Quick status & Reset demo */}
          <div className="flex items-center space-x-3">
            {criticalStockCount > 0 && (
              <button
                onClick={() => setCurrentTab('raw-materials')}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-medium rounded-lg hover:bg-red-900/60 transition"
                title="Itens com estoque abaixo do mínimo de segurança"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                <span>{criticalStockCount} insumo(s) em nível crítico</span>
              </button>
            )}

            <button
              onClick={onResetData}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition"
              title="Restaurar dados de exemplo da fábrica de demonstração"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Restaurar Exemplo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-950/60 border-t border-slate-800/60 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
