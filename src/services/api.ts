import {
  RawMaterial,
  Product,
  Contact,
  WorkcenterCapacity,
  CustomerOrder,
  ProductionOrder,
  DashboardStats,
  MaterialRequirementCheck,
  CapacityViabilityCheck
} from '../types/erp.js';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Erro ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.error) errMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  // Matérias-Primas
  async getRawMaterials(): Promise<RawMaterial[]> {
    const res = await fetch(`${API_BASE}/raw-materials`);
    return handleResponse<RawMaterial[]>(res);
  },
  async createRawMaterial(data: Partial<RawMaterial>): Promise<RawMaterial> {
    const res = await fetch(`${API_BASE}/raw-materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<RawMaterial>(res);
  },
  async updateRawMaterial(id: string, data: Partial<RawMaterial>): Promise<RawMaterial> {
    const res = await fetch(`${API_BASE}/raw-materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<RawMaterial>(res);
  },
  async deleteRawMaterial(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/raw-materials/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Produtos & Ficha Técnica
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/products`);
    return handleResponse<Product[]>(res);
  },
  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Product>(res);
  },
  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Product>(res);
  },
  async deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Contatos (Clientes / Fornecedores)
  async getContacts(): Promise<Contact[]> {
    const res = await fetch(`${API_BASE}/contacts`);
    return handleResponse<Contact[]>(res);
  },
  async createContact(data: Partial<Contact>): Promise<Contact> {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Contact>(res);
  },
  async updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
    const res = await fetch(`${API_BASE}/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Contact>(res);
  },
  async deleteContact(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/contacts/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Capacidade Produtiva
  async getCapacities(): Promise<WorkcenterCapacity[]> {
    const res = await fetch(`${API_BASE}/capacities`);
    return handleResponse<WorkcenterCapacity[]>(res);
  },
  async createCapacity(data: Partial<WorkcenterCapacity>): Promise<WorkcenterCapacity> {
    const res = await fetch(`${API_BASE}/capacities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<WorkcenterCapacity>(res);
  },
  async updateCapacity(id: string, data: Partial<WorkcenterCapacity>): Promise<WorkcenterCapacity> {
    const res = await fetch(`${API_BASE}/capacities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<WorkcenterCapacity>(res);
  },
  async deleteCapacity(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/capacities/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Pedidos
  async getOrders(): Promise<CustomerOrder[]> {
    const res = await fetch(`${API_BASE}/orders`);
    return handleResponse<CustomerOrder[]>(res);
  },
  async createOrder(data: Partial<CustomerOrder>): Promise<CustomerOrder> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<CustomerOrder>(res);
  },
  async updateOrder(id: string, data: Partial<CustomerOrder>): Promise<CustomerOrder> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<CustomerOrder>(res);
  },
  async deleteOrder(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean }>(res);
  },
  async generateOPFromOrder(orderId: string): Promise<{ message: string; orders: ProductionOrder[] }> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/generate-op`, {
      method: 'POST'
    });
    return handleResponse<{ message: string; orders: ProductionOrder[] }>(res);
  },

  // Ordens de Produção
  async getProductionOrders(): Promise<ProductionOrder[]> {
    const res = await fetch(`${API_BASE}/production-orders`);
    return handleResponse<ProductionOrder[]>(res);
  },
  async createProductionOrder(data: {
    productId: string;
    quantity: number;
    startDate?: string;
    deadlineDate: string;
    sourceType?: 'pedido' | 'manual';
    orderId?: string;
    notes?: string;
    deductStockImmediately?: boolean;
  }): Promise<ProductionOrder> {
    const res = await fetch(`${API_BASE}/production-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<ProductionOrder>(res);
  },
  async updateProductionOrderStatus(
    id: string,
    status: string,
    options?: { deductStock?: boolean; addToFinishedStock?: boolean }
  ): Promise<ProductionOrder> {
    const res = await fetch(`${API_BASE}/production-orders/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...options })
    });
    return handleResponse<ProductionOrder>(res);
  },
  async deductOPStock(id: string): Promise<{ success: boolean; message: string; op: ProductionOrder }> {
    const res = await fetch(`${API_BASE}/production-orders/${id}/deduct-stock`, {
      method: 'POST'
    });
    return handleResponse<{ success: boolean; message: string; op: ProductionOrder }>(res);
  },
  async deleteProductionOrder(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/production-orders/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean }>(res);
  },
  async checkMaterialsAndCapacity(
    productId: string,
    quantity: number,
    deadlineDate?: string,
    startDate?: string
  ): Promise<{
    product: Product;
    quantity: number;
    totalProcessMinutes: number;
    totalProcessHours: number;
    allMaterialsAvailable: boolean;
    materialChecks: MaterialRequirementCheck[];
    capacityCheck: CapacityViabilityCheck;
  }> {
    const params = new URLSearchParams({
      productId,
      quantity: quantity.toString(),
      ...(deadlineDate ? { deadlineDate } : {}),
      ...(startDate ? { startDate } : {})
    });
    const res = await fetch(`${API_BASE}/production-orders/check-materials?${params.toString()}`);
    return handleResponse<any>(res);
  },

  // Dashboard & Reset
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats`);
    return handleResponse<DashboardStats>(res);
  },
  async resetDemoData(): Promise<any> {
    const res = await fetch(`${API_BASE}/reset-data`, {
      method: 'POST'
    });
    return handleResponse<any>(res);
  }
};
