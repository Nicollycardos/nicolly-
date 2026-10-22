import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase, resetToSeedDatabase } from './db.js';
import {
  RawMaterial,
  Product,
  Contact,
  WorkcenterCapacity,
  CustomerOrder,
  ProductionOrder,
  MaterialRequirementCheck,
  DashboardStats,
  CapacityViabilityCheck
} from '../src/types/erp.js';

export const apiRouter = Router();

// ==========================================
// 1. MATÉRIAS-PRIMAS
// ==========================================

apiRouter.get('/raw-materials', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.rawMaterials);
});

apiRouter.post('/raw-materials', (req: Request, res: Response) => {
  const db = getDatabase();
  const { code, name, unit, currentStock, minimumStock, unitCost, supplierId, notes } = req.body;

  if (!name || !unit || currentStock === undefined || unitCost === undefined) {
    return res.status(400).json({ error: 'Campos obrigatórios: Nome, Unidade, Estoque e Custo Unitário.' });
  }

  const newMaterial: RawMaterial = {
    id: `mp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code: code || `MP-${(db.rawMaterials.length + 1).toString().padStart(3, '0')}`,
    name: name.trim(),
    unit: unit.trim(),
    currentStock: Math.max(0, Number(currentStock)),
    minimumStock: Math.max(0, Number(minimumStock || 0)),
    unitCost: Math.max(0, Number(unitCost)),
    supplierId: supplierId || undefined,
    notes: notes?.trim() || ''
  };

  db.rawMaterials.push(newMaterial);
  saveDatabase(db);
  res.status(201).json(newMaterial);
});

apiRouter.put('/raw-materials/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const index = db.rawMaterials.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Matéria-prima não encontrada.' });
  }

  const { code, name, unit, currentStock, minimumStock, unitCost, supplierId, notes } = req.body;

  db.rawMaterials[index] = {
    ...db.rawMaterials[index],
    code: code !== undefined ? code : db.rawMaterials[index].code,
    name: name !== undefined ? name.trim() : db.rawMaterials[index].name,
    unit: unit !== undefined ? unit.trim() : db.rawMaterials[index].unit,
    currentStock: currentStock !== undefined ? Math.max(0, Number(currentStock)) : db.rawMaterials[index].currentStock,
    minimumStock: minimumStock !== undefined ? Math.max(0, Number(minimumStock)) : db.rawMaterials[index].minimumStock,
    unitCost: unitCost !== undefined ? Math.max(0, Number(unitCost)) : db.rawMaterials[index].unitCost,
    supplierId: supplierId !== undefined ? supplierId : db.rawMaterials[index].supplierId,
    notes: notes !== undefined ? notes.trim() : db.rawMaterials[index].notes
  };

  saveDatabase(db);
  res.json(db.rawMaterials[index]);
});

apiRouter.delete('/raw-materials/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  // Verificar se alguma ficha técnica usa este material
  const usedInProducts = db.products.filter((p) => p.bom.some((b) => b.rawMaterialId === id));
  if (usedInProducts.length > 0) {
    return res.status(400).json({
      error: `Não é possível excluir: matéria-prima utilizada na Ficha Técnica do(s) produto(s): ${usedInProducts.map((p) => p.name).join(', ')}.`
    });
  }

  db.rawMaterials = db.rawMaterials.filter((m) => m.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Matéria-prima excluída com sucesso.' });
});

// ==========================================
// 2. PRODUTOS & FICHA TÉCNICA (BOM) & TEMPOS DE PROCESSO
// ==========================================

apiRouter.get('/products', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.products);
});

apiRouter.post('/products', (req: Request, res: Response) => {
  const db = getDatabase();
  const { code, name, description, category, unit, processTimeMinutes, primaryWorkcenterId, suggestedSalePrice, currentFinishedStock, bom } = req.body;

  if (!name || processTimeMinutes === undefined) {
    return res.status(400).json({ error: 'Campos obrigatórios: Nome do Produto e Tempo de Processo.' });
  }

  const newProduct: Product = {
    id: `prd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code: code || `PRD-${(db.products.length + 1).toString().padStart(3, '0')}`,
    name: name.trim(),
    description: description?.trim() || '',
    category: category?.trim() || 'Geral',
    unit: unit?.trim() || 'un',
    processTimeMinutes: Math.max(1, Number(processTimeMinutes)),
    primaryWorkcenterId: primaryWorkcenterId || undefined,
    suggestedSalePrice: Math.max(0, Number(suggestedSalePrice || 0)),
    currentFinishedStock: Math.max(0, Number(currentFinishedStock || 0)),
    bom: Array.isArray(bom) ? bom : []
  };

  db.products.push(newProduct);
  saveDatabase(db);
  res.status(201).json(newProduct);
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const index = db.products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const { code, name, description, category, unit, processTimeMinutes, primaryWorkcenterId, suggestedSalePrice, currentFinishedStock, bom } = req.body;

  db.products[index] = {
    ...db.products[index],
    code: code !== undefined ? code : db.products[index].code,
    name: name !== undefined ? name.trim() : db.products[index].name,
    description: description !== undefined ? description.trim() : db.products[index].description,
    category: category !== undefined ? category.trim() : db.products[index].category,
    unit: unit !== undefined ? unit.trim() : db.products[index].unit,
    processTimeMinutes: processTimeMinutes !== undefined ? Math.max(1, Number(processTimeMinutes)) : db.products[index].processTimeMinutes,
    primaryWorkcenterId: primaryWorkcenterId !== undefined ? primaryWorkcenterId : db.products[index].primaryWorkcenterId,
    suggestedSalePrice: suggestedSalePrice !== undefined ? Math.max(0, Number(suggestedSalePrice)) : db.products[index].suggestedSalePrice,
    currentFinishedStock: currentFinishedStock !== undefined ? Math.max(0, Number(currentFinishedStock)) : db.products[index].currentFinishedStock,
    bom: Array.isArray(bom) ? bom : db.products[index].bom
  };

  saveDatabase(db);
  res.json(db.products[index]);
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  // Verificar se há ordens de produção ou pedidos ativos
  const hasOrders = db.orders.some((o) => o.items.some((i) => i.productId === id));
  const hasOPs = db.productionOrders.some((op) => op.productId === id);

  if (hasOrders || hasOPs) {
    return res.status(400).json({
      error: 'Não é possível excluir: existem pedidos de clientes ou ordens de produção vinculadas a este produto.'
    });
  }

  db.products = db.products.filter((p) => p.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Produto removido com sucesso.' });
});

// ==========================================
// 3. CONTATOS (CLIENTES E FORNECEDORES)
// ==========================================

apiRouter.get('/contacts', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.contacts);
});

apiRouter.post('/contacts', (req: Request, res: Response) => {
  const db = getDatabase();
  const { name, type, document, email, phone, city, address, notes } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Campos obrigatórios: Nome e Tipo (Cliente, Fornecedor ou Ambos).' });
  }

  const newContact: Contact = {
    id: `cont-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    type: type,
    document: document?.trim() || '',
    email: email?.trim() || '',
    phone: phone?.trim() || '',
    city: city?.trim() || '',
    address: address?.trim() || '',
    notes: notes?.trim() || ''
  };

  db.contacts.push(newContact);
  saveDatabase(db);
  res.status(201).json(newContact);
});

apiRouter.put('/contacts/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const index = db.contacts.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Contato não encontrado.' });
  }

  db.contacts[index] = {
    ...db.contacts[index],
    ...req.body
  };

  saveDatabase(db);
  res.json(db.contacts[index]);
});

apiRouter.delete('/contacts/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  const hasOrders = db.orders.some((o) => o.clientId === id);
  if (hasOrders) {
    return res.status(400).json({ error: 'Não é possível excluir: existem pedidos vinculados a este cliente.' });
  }

  db.contacts = db.contacts.filter((c) => c.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Contato removido com sucesso.' });
});

// ==========================================
// 4. CAPACIDADE PRODUTIVA (MÁQUINAS E PROCESSOS)
// ==========================================

apiRouter.get('/capacities', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.capacities);
});

apiRouter.post('/capacities', (req: Request, res: Response) => {
  const db = getDatabase();
  const { code, name, capacityPerDay, capacityUnit, status, operatorCount, notes } = req.body;

  if (!name || capacityPerDay === undefined) {
    return res.status(400).json({ error: 'Campos obrigatórios: Nome e Capacidade Nominal por Dia.' });
  }

  const newWorkcenter: WorkcenterCapacity = {
    id: `maq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code: code || `POSTO-${(db.capacities.length + 1).toString().padStart(2, '0')}`,
    name: name.trim(),
    capacityPerDay: Math.max(0.5, Number(capacityPerDay)),
    capacityUnit: capacityUnit || 'horas/dia',
    status: status || 'operacional',
    operatorCount: Math.max(1, Number(operatorCount || 1)),
    notes: notes?.trim() || ''
  };

  db.capacities.push(newWorkcenter);
  saveDatabase(db);
  res.status(201).json(newWorkcenter);
});

apiRouter.put('/capacities/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const index = db.capacities.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Posto de trabalho não encontrado.' });
  }

  db.capacities[index] = {
    ...db.capacities[index],
    ...req.body
  };

  saveDatabase(db);
  res.json(db.capacities[index]);
});

apiRouter.delete('/capacities/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  db.capacities = db.capacities.filter((c) => c.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Posto de trabalho removido.' });
});

// ==========================================
// 5. CADASTRO DE PEDIDOS DE CLIENTES
// ==========================================

apiRouter.get('/orders', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.orders);
});

apiRouter.post('/orders', (req: Request, res: Response) => {
  const db = getDatabase();
  const { clientId, items, orderDate, deliveryDeadline, status, notes } = req.body;

  if (!clientId || !Array.isArray(items) || items.length === 0 || !deliveryDeadline) {
    return res.status(400).json({ error: 'Selecione um cliente, pelo menos 1 produto e o prazo de entrega.' });
  }

  // Calcular valor total
  let totalAmount = 0;
  const processedItems = items.map((it: any) => {
    const qty = Math.max(1, Number(it.quantity || 1));
    const prd = db.products.find((p) => p.id === it.productId);
    const price = it.unitPrice !== undefined ? Number(it.unitPrice) : (prd?.suggestedSalePrice || 0);
    totalAmount += qty * price;
    return {
      productId: it.productId,
      quantity: qty,
      unitPrice: price
    };
  });

  const newOrder: CustomerOrder = {
    id: `ped-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    orderNumber: `PED-${(100 + db.orders.length + 1)}`,
    clientId,
    items: processedItems,
    orderDate: orderDate || new Date().toISOString().split('T')[0],
    deliveryDeadline,
    status: status || 'pendente',
    totalAmount,
    notes: notes?.trim() || ''
  };

  db.orders.push(newOrder);
  saveDatabase(db);
  res.status(201).json(newOrder);
});

apiRouter.put('/orders/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const index = db.orders.findIndex((o) => o.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  let totalAmount = db.orders[index].totalAmount;
  if (req.body.items && Array.isArray(req.body.items)) {
    totalAmount = req.body.items.reduce((acc: number, it: any) => {
      const qty = Number(it.quantity || 1);
      const prc = Number(it.unitPrice || 0);
      return acc + qty * prc;
    }, 0);
  }

  db.orders[index] = {
    ...db.orders[index],
    ...req.body,
    totalAmount: req.body.items ? totalAmount : db.orders[index].totalAmount
  };

  saveDatabase(db);
  res.json(db.orders[index]);
});

apiRouter.delete('/orders/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  db.orders = db.orders.filter((o) => o.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Pedido removido com sucesso.' });
});

// Ação de 1-Clique: Gerar Ordens de Produção a partir de um Pedido
apiRouter.post('/orders/:id/generate-op', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const order = db.orders.find((o) => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  const generatedOPs: ProductionOrder[] = [];

  for (const item of order.items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) continue;

    const totalMinutes = product.processTimeMinutes * item.quantity;
    const newOP: ProductionOrder = {
      id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: `OP-${(2400 + db.productionOrders.length + generatedOPs.length + 1)}`,
      sourceType: 'pedido',
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      startDate: new Date().toISOString().split('T')[0],
      deadlineDate: order.deliveryDeadline,
      status: 'aguardando',
      processTimeTotalMinutes: totalMinutes,
      workcenterId: product.primaryWorkcenterId || (db.capacities[0]?.id || ''),
      stockDeducted: false,
      notes: `Gerada automaticamente a partir do pedido ${order.orderNumber}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    generatedOPs.push(newOP);
  }

  db.productionOrders.push(...generatedOPs);
  order.status = 'em_producao';
  saveDatabase(db);

  res.status(201).json({
    message: `${generatedOPs.length} Ordem(ns) de Produção gerada(s) com sucesso!`,
    orders: generatedOPs
  });
});

// ==========================================
// 6. ORDENS DE PRODUÇÃO (OP) & ACOMPANHAMENTO
// ==========================================

apiRouter.get('/production-orders', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.productionOrders);
});

// Checagem de disponibilidade de matéria-prima e viabilidade de capacidade para produto e quantidade
apiRouter.get('/production-orders/check-materials', (req: Request, res: Response) => {
  const db = getDatabase();
  const productId = req.query.productId as string;
  const quantity = Math.max(1, Number(req.query.quantity || 1));
  const deadlineDate = req.query.deadlineDate as string;
  const startDate = (req.query.startDate as string) || new Date().toISOString().split('T')[0];

  const product = db.products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const materialChecks: MaterialRequirementCheck[] = product.bom.map((bomItem) => {
    const rawMaterial = db.rawMaterials.find((m) => m.id === bomItem.rawMaterialId);
    const totalRequired = bomItem.quantityNeeded * quantity;
    const currentStock = rawMaterial ? rawMaterial.currentStock : 0;
    const missingAmount = Math.max(0, totalRequired - currentStock);
    const isAvailable = currentStock >= totalRequired;

    return {
      rawMaterialId: bomItem.rawMaterialId,
      materialName: rawMaterial ? rawMaterial.name : 'Material não encontrado',
      unit: rawMaterial ? rawMaterial.unit : 'un',
      requiredPerUnit: bomItem.quantityNeeded,
      totalRequired,
      currentStock,
      missingAmount,
      isAvailable,
      unitCost: rawMaterial ? rawMaterial.unitCost : 0,
      totalCost: (rawMaterial ? rawMaterial.unitCost : 0) * totalRequired
    };
  });

  const allMaterialsAvailable = materialChecks.every((m) => m.isAvailable);

  // Checagem de viabilidade de capacidade produtiva
  const workcenter = db.capacities.find((c) => c.id === product.primaryWorkcenterId);
  const totalProcessMinutes = product.processTimeMinutes * quantity;
  const totalProcessHours = totalProcessMinutes / 60;

  let capacityCheck: CapacityViabilityCheck;

  if (workcenter) {
    // Calcular dias disponíveis entre startDate e deadlineDate
    const start = new Date(startDate);
    const end = deadlineDate ? new Date(deadlineDate) : new Date(start.getTime() + 7 * 86400000);
    const diffTime = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Capacidade total do posto no período (considerando 80% de dias úteis se mais de 5 dias)
    const availableWorkDays = diffTime <= 2 ? diffTime : Math.ceil(diffTime * 0.72);
    const dailyCapHours = workcenter.capacityUnit === 'horas/dia' ? workcenter.capacityPerDay : (workcenter.capacityPerDay * (product.processTimeMinutes / 60));
    const totalCapacityHours = dailyCapHours * availableWorkDays;
    const loadPercentage = totalCapacityHours > 0 ? Math.round((totalProcessHours / totalCapacityHours) * 100) : 100;
    const isViable = totalProcessHours <= totalCapacityHours;

    capacityCheck = {
      isViable,
      workcenterName: workcenter.name,
      requiredHours: Number(totalProcessHours.toFixed(1)),
      availableDays: availableWorkDays,
      availableCapacityHours: Number(totalCapacityHours.toFixed(1)),
      loadPercentage,
      message: isViable
        ? `Viável: demanda de ${totalProcessHours.toFixed(1)}h dentro da capacidade estimada de ${totalCapacityHours.toFixed(1)}h em ${availableWorkDays} dia(s). Carga de ${loadPercentage}%.`
        : `Atenção: Prazo ou capacidade apertada! Demanda de ${totalProcessHours.toFixed(1)}h excede ou atinge o limite da capacidade estimada de ${totalCapacityHours.toFixed(1)}h (${loadPercentage}% de carga).`
    };
  } else {
    capacityCheck = {
      isViable: true,
      requiredHours: Number(totalProcessHours.toFixed(1)),
      availableDays: 5,
      availableCapacityHours: 40,
      loadPercentage: 0,
      message: `Tempo estimado de produção: ${totalProcessHours.toFixed(1)}h (${totalProcessMinutes} minutos). Nenhum posto específico atribuído.`
    };
  }

  res.json({
    product,
    quantity,
    totalProcessMinutes,
    totalProcessHours: Number(totalProcessHours.toFixed(1)),
    allMaterialsAvailable,
    materialChecks,
    capacityCheck
  });
});

apiRouter.post('/production-orders', (req: Request, res: Response) => {
  const db = getDatabase();
  const { productId, quantity, startDate, deadlineDate, sourceType, orderId, notes, deductStockImmediately } = req.body;

  if (!productId || !quantity || !deadlineDate) {
    return res.status(400).json({ error: 'Campos obrigatórios: Produto, Quantidade e Prazo de Conclusão.' });
  }

  const product = db.products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const parsedQty = Math.max(1, Number(quantity));
  const processTimeTotalMinutes = product.processTimeMinutes * parsedQty;

  const newOP: ProductionOrder = {
    id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code: `OP-${(2400 + db.productionOrders.length + 1)}`,
    sourceType: sourceType || 'manual',
    orderId: orderId || undefined,
    productId,
    quantity: parsedQty,
    startDate: startDate || new Date().toISOString().split('T')[0],
    deadlineDate,
    status: 'aguardando',
    processTimeTotalMinutes,
    workcenterId: product.primaryWorkcenterId || (db.capacities[0]?.id || ''),
    stockDeducted: false,
    notes: notes?.trim() || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Se o usuário solicitou baixa imediata de estoque
  if (deductStockImmediately) {
    for (const bomItem of product.bom) {
      const mat = db.rawMaterials.find((m) => m.id === bomItem.rawMaterialId);
      if (mat) {
        mat.currentStock = Math.max(0, Number((mat.currentStock - (bomItem.quantityNeeded * parsedQty)).toFixed(2)));
      }
    }
    newOP.stockDeducted = true;
  }

  db.productionOrders.push(newOP);
  saveDatabase(db);
  res.status(201).json(newOP);
});

// Atualizar status da Ordem de Produção (Aguardando -> Em Produção -> Concluída / Cancelada)
apiRouter.post('/production-orders/:id/status', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { status, deductStock, addToFinishedStock } = req.body;

  const op = db.productionOrders.find((o) => o.id === id);
  if (!op) {
    return res.status(404).json({ error: 'Ordem de produção não encontrada.' });
  }

  const product = db.products.find((p) => p.id === op.productId);

  // Se transicionar para 'em_producao' ou 'concluida' e pedir baixa de matéria-prima (se ainda não baixado)
  if (deductStock && !op.stockDeducted && product) {
    for (const bomItem of product.bom) {
      const mat = db.rawMaterials.find((m) => m.id === bomItem.rawMaterialId);
      if (mat) {
        mat.currentStock = Math.max(0, Number((mat.currentStock - (bomItem.quantityNeeded * op.quantity)).toFixed(2)));
      }
    }
    op.stockDeducted = true;
  }

  // Se concluir a OP e solicitar entrada no estoque de produtos acabados
  if (status === 'concluida' && addToFinishedStock && product) {
    product.currentFinishedStock = (product.currentFinishedStock || 0) + op.quantity;
  }

  op.status = status;
  op.updatedAt = new Date().toISOString();

  // Se a OP está vinculada a um pedido, atualizar status do pedido se todas as OPs dele estiverem prontas
  if (op.orderId && status === 'concluida') {
    const relatedOrder = db.orders.find((o) => o.id === op.orderId);
    if (relatedOrder) {
      const siblingOPs = db.productionOrders.filter((o) => o.orderId === op.orderId);
      const allSiblingsFinished = siblingOPs.every((o) => o.id === op.id ? true : o.status === 'concluida');
      if (allSiblingsFinished) {
        relatedOrder.status = 'concluido';
      }
    }
  }

  saveDatabase(db);
  res.json(op);
});

// Ação de dar baixa no estoque das matérias-primas da OP
apiRouter.post('/production-orders/:id/deduct-stock', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  const op = db.productionOrders.find((o) => o.id === id);
  if (!op) {
    return res.status(404).json({ error: 'Ordem de produção não encontrada.' });
  }

  if (op.stockDeducted) {
    return res.status(400).json({ error: 'O estoque para esta ordem de produção já foi baixado anteriormente.' });
  }

  const product = db.products.find((p) => p.id === op.productId);
  if (!product) {
    return res.status(404).json({ error: 'Produto associado não encontrado.' });
  }

  for (const bomItem of product.bom) {
    const mat = db.rawMaterials.find((m) => m.id === bomItem.rawMaterialId);
    if (mat) {
      mat.currentStock = Math.max(0, Number((mat.currentStock - (bomItem.quantityNeeded * op.quantity)).toFixed(2)));
    }
  }

  op.stockDeducted = true;
  op.updatedAt = new Date().toISOString();

  saveDatabase(db);
  res.json({ success: true, message: 'Matérias-primas consumidas e baixadas do estoque com sucesso!', op });
});

apiRouter.delete('/production-orders/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  db.productionOrders = db.productionOrders.filter((o) => o.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Ordem de produção removida.' });
});

// ==========================================
// 7. DASHBOARD STATS
// ==========================================

apiRouter.get('/stats', (req: Request, res: Response) => {
  const db = getDatabase();

  const totalActiveProductionOrders = db.productionOrders.filter(
    (o) => o.status === 'em_producao' || o.status === 'aguardando'
  ).length;

  const totalPendingOrders = db.orders.filter(
    (o) => o.status === 'pendente' || o.status === 'em_producao'
  ).length;

  const criticalStockMaterials = db.rawMaterials.filter(
    (m) => m.currentStock <= m.minimumStock
  );

  const lowStockMaterialsCount = criticalStockMaterials.length;

  const totalClientsCount = db.contacts.filter((c) => c.type === 'cliente' || c.type === 'ambos').length;
  const totalSuppliersCount = db.contacts.filter((c) => c.type === 'fornecedor' || c.type === 'ambos').length;

  // Cálculo de carga média dos postos
  const totalCapacityHours = db.capacities.reduce((acc, c) => acc + (c.capacityPerDay || 8), 0);
  const activeOPsMinutes = db.productionOrders
    .filter((o) => o.status === 'em_producao' || o.status === 'aguardando')
    .reduce((acc, o) => acc + (o.processTimeTotalMinutes || 0), 0);
  const activeOPsHours = activeOPsMinutes / 60;

  // estimativa de carga considerando 5 dias úteis de trabalho dos postos
  const weeklyCap = totalCapacityHours * 5;
  const averageCapacityLoad = weeklyCap > 0 ? Math.min(100, Math.round((activeOPsHours / weeklyCap) * 100)) : 0;

  const recentProductionOrders = [...db.productionOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats: DashboardStats = {
    totalActiveProductionOrders,
    totalPendingOrders,
    lowStockMaterialsCount,
    averageCapacityLoad,
    totalProductsCount: db.products.length,
    totalClientsCount,
    totalSuppliersCount,
    recentProductionOrders,
    criticalStockMaterials
  };

  res.json(stats);
});

// Reset para dados de demonstração
apiRouter.post('/reset-data', (req: Request, res: Response) => {
  const db = resetToSeedDatabase();
  res.json({ success: true, message: 'Dados restaurados com sucesso para os exemplos padrão!', db });
});
