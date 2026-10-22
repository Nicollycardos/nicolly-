import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, TabType } from './components/Navbar.js';
import { Dashboard } from './components/Dashboard.js';
import { RawMaterialsManager } from './components/RawMaterialsManager.js';
import { ProductBOMManager } from './components/ProductBOMManager.js';
import { CapacityManager } from './components/CapacityManager.js';
import { OrdersManager } from './components/OrdersManager.js';
import { ProductionOrdersManager } from './components/ProductionOrdersManager.js';
import { ContactsManager } from './components/ContactsManager.js';
import { NotificationToast, ToastMessage } from './components/NotificationToast.js';
import { api } from './services/api.js';
import {
  RawMaterial,
  Product,
  Contact,
  WorkcenterCapacity,
  CustomerOrder,
  ProductionOrder,
  DashboardStats
} from './types/erp.js';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Application Data States
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [capacities, setCapacities] = useState<WorkcenterCapacity[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // External trigger for new OP modal from Dashboard
  const [isNewOPModalTriggered, setIsNewOPModalTriggered] = useState(false);

  // Helper Toast Notification
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load All ERP Data from Persistent Server API
  const loadAllData = useCallback(async () => {
    try {
      const [
        materialsData,
        productsData,
        contactsData,
        capacitiesData,
        ordersData,
        opData,
        statsData
      ] = await Promise.all([
        api.getRawMaterials(),
        api.getProducts(),
        api.getContacts(),
        api.getCapacities(),
        api.getOrders(),
        api.getProductionOrders(),
        api.getStats()
      ]);

      setRawMaterials(materialsData);
      setProducts(productsData);
      setContacts(contactsData);
      setCapacities(capacitiesData);
      setOrders(ordersData);
      setProductionOrders(opData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      addToast('error', `Falha ao carregar dados do servidor: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Actions: Matérias-Primas
  const handleSaveMaterial = async (data: Partial<RawMaterial>) => {
    if (data.id) {
      await api.updateRawMaterial(data.id, data);
      addToast('success', 'Matéria-prima atualizada com sucesso!');
    } else {
      await api.createRawMaterial(data);
      addToast('success', 'Matéria-prima cadastrada com sucesso!');
    }
    await loadAllData();
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await api.deleteRawMaterial(id);
      addToast('success', 'Matéria-prima excluída com sucesso.');
      await loadAllData();
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  // Actions: Produtos & BOM
  const handleSaveProduct = async (data: Partial<Product>) => {
    if (data.id) {
      await api.updateProduct(data.id, data);
      addToast('success', 'Ficha técnica do produto atualizada com sucesso!');
    } else {
      await api.createProduct(data);
      addToast('success', 'Produto e Ficha Técnica cadastrados!');
    }
    await loadAllData();
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      addToast('success', 'Produto removido com sucesso.');
      await loadAllData();
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  // Actions: Contatos
  const handleSaveContact = async (data: Partial<Contact>) => {
    if (data.id) {
      await api.updateContact(data.id, data);
      addToast('success', 'Contato atualizado com sucesso!');
    } else {
      await api.createContact(data);
      addToast('success', 'Parceiro comercial cadastrado com sucesso!');
    }
    await loadAllData();
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await api.deleteContact(id);
      addToast('success', 'Contato removido com sucesso.');
      await loadAllData();
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  // Actions: Capacidades
  const handleSaveCapacity = async (data: Partial<WorkcenterCapacity>) => {
    if (data.id) {
      await api.updateCapacity(data.id, data);
      addToast('success', 'Posto de trabalho atualizado com sucesso!');
    } else {
      await api.createCapacity(data);
      addToast('success', 'Novo posto de trabalho cadastrado!');
    }
    await loadAllData();
  };

  const handleDeleteCapacity = async (id: string) => {
    try {
      await api.deleteCapacity(id);
      addToast('success', 'Posto de trabalho removido.');
      await loadAllData();
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  // Actions: Pedidos
  const handleSaveOrder = async (data: Partial<CustomerOrder>) => {
    if (data.id) {
      await api.updateOrder(data.id, data);
      addToast('success', 'Pedido atualizado com sucesso!');
    } else {
      await api.createOrder(data);
      addToast('success', 'Pedido de cliente registrado com sucesso!');
    }
    await loadAllData();
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await api.deleteOrder(id);
      addToast('success', 'Pedido removido com sucesso.');
      await loadAllData();
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  // 1-Click: Gerar OP a partir de Pedido
  const handleGenerateOPFromOrder = async (orderId: string) => {
    try {
      const res = await api.generateOPFromOrder(orderId);
      addToast('success', res.message);
      await loadAllData();
      setCurrentTab('production-orders');
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao gerar ordem de produção');
    }
  };

  // Actions: Ordens de Produção (PCP)
  const handleCreateOP = async (data: any) => {
    try {
      await api.createProductionOrder(data);
      addToast('success', 'Ordem de Produção emitida com sucesso!');
      await loadAllData();
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao emitir ordem');
    }
  };

  const handleUpdateOPStatus = async (id: string, status: string, options?: any) => {
    try {
      await api.updateProductionOrderStatus(id, status, options);
      addToast('success', `Status da OP atualizado para "${status}"!`);
      await loadAllData();
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao atualizar status');
    }
  };

  const handleDeductOPStock = async (id: string) => {
    try {
      const res = await api.deductOPStock(id);
      addToast('success', res.message);
      await loadAllData();
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao dar baixa no estoque');
    }
  };

  const handleDeleteOP = async (id: string) => {
    try {
      await api.deleteProductionOrder(id);
      addToast('success', 'Ordem de Produção removida.');
      await loadAllData();
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  // Reset demo data
  const handleResetData = async () => {
    if (confirm('Deseja restaurar todos os dados para os exemplos padrão da marcenaria/fábrica?')) {
      try {
        await api.resetDemoData();
        addToast('success', 'Dados de demonstração restaurados com sucesso!');
        await loadAllData();
      } catch (err: any) {
        addToast('error', 'Falha ao restaurar dados');
      }
    }
  };

  const criticalStockCount = rawMaterials.filter(
    (m) => m.currentStock <= m.minimumStock
  ).length;

  const activeOPsCount = productionOrders.filter(
    (op) => op.status === 'em_producao' || op.status === 'aguardando'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        criticalStockCount={criticalStockCount}
        activeOPsCount={activeOPsCount}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Carregando sistema PlanoERP...</p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard
                stats={stats}
                products={products}
                orders={orders}
                productionOrders={productionOrders}
                rawMaterials={rawMaterials}
                setCurrentTab={setCurrentTab}
                onOpenNewOPModal={() => {
                  setCurrentTab('production-orders');
                  setIsNewOPModalTriggered(true);
                }}
                onOpenNewOrderModal={() => setCurrentTab('orders')}
                onOpenNewMaterialModal={() => setCurrentTab('raw-materials')}
              />
            )}

            {currentTab === 'production-orders' && (
              <ProductionOrdersManager
                productionOrders={productionOrders}
                products={products}
                rawMaterials={rawMaterials}
                capacities={capacities}
                orders={orders}
                onCreateOP={handleCreateOP}
                onUpdateStatus={handleUpdateOPStatus}
                onDeductStock={handleDeductOPStock}
                onDeleteOP={handleDeleteOP}
                isNewModalOpenExternal={isNewOPModalTriggered}
                onCloseNewModalExternal={() => setIsNewOPModalTriggered(false)}
              />
            )}

            {currentTab === 'orders' && (
              <OrdersManager
                orders={orders}
                contacts={contacts}
                products={products}
                onSaveOrder={handleSaveOrder}
                onDeleteOrder={handleDeleteOrder}
                onGenerateOP={handleGenerateOPFromOrder}
              />
            )}

            {currentTab === 'products' && (
              <ProductBOMManager
                products={products}
                rawMaterials={rawMaterials}
                capacities={capacities}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {currentTab === 'raw-materials' && (
              <RawMaterialsManager
                materials={rawMaterials}
                contacts={contacts}
                onSaveMaterial={handleSaveMaterial}
                onDeleteMaterial={handleDeleteMaterial}
              />
            )}

            {currentTab === 'capacity' && (
              <CapacityManager
                capacities={capacities}
                productionOrders={productionOrders}
                products={products}
                onSaveCapacity={handleSaveCapacity}
                onDeleteCapacity={handleDeleteCapacity}
              />
            )}

            {currentTab === 'contacts' && (
              <ContactsManager
                contacts={contacts}
                onSaveContact={handleSaveContact}
                onDeleteContact={handleDeleteContact}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PlanoERP • Sistema de Planejamento e Controle de Produção (PCP)</span>
          <span>Persistência Ativa em Banco de Dados JSON Local</span>
        </div>
      </footer>

      {/* Notification Toasts */}
      <NotificationToast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
