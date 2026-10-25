import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTx = {
  purchaseOrder: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  inventoryLocation: {
    findUnique: vi.fn(),
  },
  purchaseReceipt: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  batch: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  inventoryStock: {
    aggregate: vi.fn(),
    upsert: vi.fn(),
  },
  inventoryMovement: {
    create: vi.fn(),
  },
  controlledDrugRecord: {
    create: vi.fn(),
  },
  purchaseOrderDetail: {
    update: vi.fn(),
    findMany: vi.fn(),
  },
};

const mockPrisma = {
  $transaction: vi.fn(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
  product: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  inventoryStock: {
    findMany: vi.fn(),
  },
  batch: {
    findMany: vi.fn(),
  },
  alert: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock("../../config/prisma.js", () => ({
  prisma: mockPrisma,
}));

const { getFefoAllocation, scanAlerts } = await import("./inventory.service.js");
const { receivePurchaseOrder } = await import("../purchases/purchases.service.js");

describe("Inventory & Purchases Integration (src/modules/inventory/inventory.service.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ingresa lotes al inventario tras recepcionar una orden de compra (purchases)", async () => {
    const futureExp = new Date(Date.now() + 180 * 86400000);

    mockTx.purchaseOrder.findUnique.mockResolvedValue({
      id: "po-1",
      code: "OC-2026-01",
      supplierId: "sup-1",
      status: "SENT",
      details: [
        {
          id: "pod-1",
          productId: "prod-1",
          quantityOrdered: 50,
          quantityReceived: 0,
          product: {
            id: "prod-1",
            sku: "PAR-500",
            name: "Paracetamol 500mg",
            presentation: "Caja x 16",
            isControlled: false,
          },
        },
      ],
    });

    mockTx.inventoryLocation.findUnique.mockResolvedValue({
      id: "loc-bodega",
      isActive: true,
    });
    mockTx.purchaseReceipt.create.mockResolvedValue({
      id: "rec-1",
      code: "REC-01",
    });
    mockTx.batch.findUnique.mockResolvedValue(null);
    mockTx.batch.create.mockResolvedValue({
      id: "batch-new-1",
      batchNumber: "LOTE-A1",
      productId: "prod-1",
      expirationDate: futureExp,
    });
    mockTx.purchaseOrderDetail.findMany.mockResolvedValue([
      {
        id: "pod-1",
        productId: "prod-1",
        quantityOrdered: 50,
        quantityReceived: 50,
      },
    ]);
    mockTx.purchaseReceipt.findUnique.mockResolvedValue({
      id: "rec-1",
      code: "REC-01",
      batches: [{ id: "batch-new-1", batchNumber: "LOTE-A1" }],
    });

    const receipt = await receivePurchaseOrder("po-1", "user-1", {
      code: "REC-01",
      items: [
        {
          productId: "prod-1",
          batchNumber: "LOTE-A1",
          expirationDate: futureExp,
          quantity: 50,
          purchasePrice: 800,
          locationId: "loc-bodega",
        },
      ],
    });

    expect(receipt?.code).toBe("REC-01");
    expect(mockTx.batch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          batchNumber: "LOTE-A1",
          productId: "prod-1",
          initialQuantity: 50,
        }),
      }),
    );
    expect(mockTx.inventoryStock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          batchId: "batch-new-1",
          locationId: "loc-bodega",
          quantity: 50,
        }),
      }),
    );
    expect(mockTx.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: "po-1" },
      data: { status: "RECEIVED" },
    });
  });

  it("asigna stock siguiendo estrictamente el ordenamiento FEFO (First Expired, First Out)", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: "prod-1",
      sku: "IBU-400",
      name: "Ibuprofeno 400mg",
    });

    const expSoon = new Date(Date.now() + 20 * 86400000);
    const expLater = new Date(Date.now() + 120 * 86400000);

    mockPrisma.inventoryStock.findMany.mockResolvedValue([
      {
        id: "stk-1",
        batchId: "b-soon",
        locationId: "loc-1",
        quantity: 6,
        reservedQuantity: 1, // 5 disponibles
        batch: { batchNumber: "L-SOON", expirationDate: expSoon },
        location: { name: "Sala de Ventas" },
      },
      {
        id: "stk-2",
        batchId: "b-later",
        locationId: "loc-1",
        quantity: 20,
        reservedQuantity: 0,
        batch: { batchNumber: "L-LATER", expirationDate: expLater },
        location: { name: "Sala de Ventas" },
      },
    ]);

    const allocation = await getFefoAllocation("prod-1", {
      quantity: 8,
    });

    expect(allocation.sufficient).toBe(true);
    expect(allocation.allocatedQuantity).toBe(8);
    expect(allocation.allocations).toEqual([
      {
        stockId: "stk-1",
        batchId: "b-soon",
        batchNumber: "L-SOON",
        expirationDate: expSoon,
        locationId: "loc-1",
        locationName: "Sala de Ventas",
        quantity: 5,
      },
      {
        stockId: "stk-2",
        batchId: "b-later",
        locationId: "loc-1",
        quantity: 3,
        batchNumber: "L-LATER",
        expirationDate: expLater,
        locationName: "Sala de Ventas",
      },
    ]);
  });

  it("genera alertas de vencimiento próximo (EXPIRING_SOON) y lotes vencidos (EXPIRED)", async () => {
    mockPrisma.product.findMany.mockResolvedValue([]);
    const soonDate = new Date(Date.now() + 10 * 86400000);
    const expiredDate = new Date(Date.now() - 2 * 86400000);

    mockPrisma.batch.findMany.mockResolvedValue([
      {
        id: "batch-expiring",
        batchNumber: "L-POR-VENCER",
        productId: "prod-1",
        expirationDate: soonDate,
        product: { name: "Losartán 50mg" },
      },
      {
        id: "batch-expired",
        batchNumber: "L-VENCIDO",
        productId: "prod-2",
        expirationDate: expiredDate,
        product: { name: "Jarabe Pediátrico" },
      },
    ]);

    mockPrisma.alert.findFirst.mockResolvedValue(null);
    mockPrisma.alert.create.mockResolvedValue({ id: "alert-1" });

    const scanResult = await scanAlerts({ expiringDays: 30 });

    expect(scanResult.createdOrUpdated).toBe(2);
    expect(mockPrisma.alert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "EXPIRING_SOON",
          productId: "prod-1",
          batchId: "batch-expiring",
        }),
      }),
    );
    expect(mockPrisma.alert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "EXPIRED",
          productId: "prod-2",
          batchId: "batch-expired",
        }),
      }),
    );
  });
});
