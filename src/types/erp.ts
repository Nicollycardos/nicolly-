export type ContactType = 'cliente' | 'fornecedor' | 'ambos';

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  document: string; // CNPJ ou CPF
  email: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  unit: string; // kg, m, m², un, L, etc.
  currentStock: number;
  minimumStock: number;
  unitCost: number; // R$
  supplierId?: string;
  notes?: string;
}

export interface BOMItem {
  rawMaterialId: string;
  quantityNeeded: number; // por unidade do produto
  notes?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  processTimeMinutes: number; // tempo de produção por unidade em minutos
  primaryWorkcenterId?: string; // máquina ou processo principal
  bom: BOMItem[]; // Ficha técnica de matérias-primas
  suggestedSalePrice: number;
  currentFinishedStock: number;
}

export interface WorkcenterCapacity {
  id: string;
  code: string;
  name: string;
  capacityPerDay: number; // valor nominal
  capacityUnit: 'horas/dia' | 'unidades/dia';
  status: 'operacional' | 'manutencao' | 'ocioso';
  operatorCount: number;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'pendente' | 'em_producao' | 'concluido' | 'cancelado';

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  items: OrderItem[];
  orderDate: string; // YYYY-MM-DD
  deliveryDeadline: string; // YYYY-MM-DD
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  productionOrderId?: string;
}

export type ProductionOrderStatus = 'aguardando' | 'em_producao' | 'concluida' | 'cancelada';

export interface ProductionOrder {
  id: string;
  code: string;
  sourceType: 'pedido' | 'manual';
  orderId?: string;
  productId: string;
  quantity: number;
  startDate: string; // YYYY-MM-DD
  deadlineDate: string; // YYYY-MM-DD
  status: ProductionOrderStatus;
  processTimeTotalMinutes: number;
  workcenterId?: string;
  stockDeducted: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialRequirementCheck {
  rawMaterialId: string;
  materialName: string;
  unit: string;
  requiredPerUnit: number;
  totalRequired: number;
  currentStock: number;
  missingAmount: number;
  isAvailable: boolean;
  unitCost: number;
  totalCost: number;
}

export interface CapacityViabilityCheck {
  isViable: boolean;
  workcenterName?: string;
  requiredHours: number;
  availableDays: number;
  availableCapacityHours: number;
  loadPercentage: number;
  message: string;
}

export interface ERPDatabase {
  rawMaterials: RawMaterial[];
  products: Product[];
  contacts: Contact[];
  capacities: WorkcenterCapacity[];
  orders: CustomerOrder[];
  productionOrders: ProductionOrder[];
}

export interface DashboardStats {
  totalActiveProductionOrders: number;
  totalPendingOrders: number;
  lowStockMaterialsCount: number;
  averageCapacityLoad: number;
  totalProductsCount: number;
  totalClientsCount: number;
  totalSuppliersCount: number;
  recentProductionOrders: ProductionOrder[];
  criticalStockMaterials: RawMaterial[];
}
