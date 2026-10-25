import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../utils/ApiError.js";

const mockTx = {
  cashSession: {
    findUnique: vi.fn(),
  },
  patient: {
    findUnique: vi.fn(),
  },
  product: {
    findMany: vi.fn(),
  },
  prescriptionItem: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  prescription: {
    update: vi.fn(),
  },
  inventoryStock: {
    findMany: vi.fn(),
    aggregate: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  },
  sale: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  saleItem: {
    create: vi.fn(),
  },
  saleItemBatch: {
    create: vi.fn(),
  },
  inventoryMovement: {
    create: vi.fn(),
  },
  controlledDrugRecord: {
    create: vi.fn(),
  },
  payment: {
    create: vi.fn(),
  },
  cashMovement: {
    create: vi.fn(),
  },
  taxDocument: {
    create: vi.fn(),
  },
};

const mockPrisma = {
  $transaction: vi.fn(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
};

vi.mock("../../config/prisma.js", () => ({
  prisma: mockPrisma,
}));

const { checkout } = await import("./sales.service.js");

describe("Sales Service Integration (src/modules/sales/sales.service.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.cashSession.findUnique.mockResolvedValue({
      id: "sess-open",
      status: "OPEN",
    });
  });

  it("crea una venta aplicando descuento atómico de stock por lote bajo orden FEFO", async () => {
    mockTx.product.findMany.mockResolvedValue([
      {
        id: "prod-1",
        name: "Paracetamol 500mg",
        salePrice: 2000,
        requiresPrescription: false,
        isControlled: false,
        isActive: true,
      },
    ]);

    mockTx.sale.create.mockResolvedValue({ id: "sale-1", code: "VTA-001" });
    mockTx.saleItem.create.mockResolvedValue({ id: "sitem-1" });

    // Dos lotes ordenados por vencimiento (FEFO): el primero tiene 3 unidades, el segundo 10
    mockTx.inventoryStock.findMany.mockResolvedValue([
      {
        batchId: "batch-early",
        locationId: "loc-pos",
        quantity: 3,
        reservedQuantity: 0,
        batch: {
          id: "batch-early",
          expirationDate: new Date(Date.now() + 15 * 86400000),
          purchasePrice: 900,
        },
      },
      {
        batchId: "batch-later",
        locationId: "loc-pos",
        quantity: 10,
        reservedQuantity: 0,
        batch: {
          id: "batch-later",
          expirationDate: new Date(Date.now() + 90 * 86400000),
          purchasePrice: 950,
        },
      },
    ]);

    mockTx.inventoryStock.updateMany.mockResolvedValue({ count: 1 });
    mockTx.inventoryStock.findUnique.mockResolvedValue({
      quantity: 5,
      reservedQuantity: 0,
    });
    mockTx.sale.findUnique.mockResolvedValue({
      id: "sale-1",
      code: "VTA-001",
      status: "COMPLETED",
      totalAmount: 10000,
    });

    const result = await checkout("seller-1", {
      code: "VTA-001",
      cashSessionId: "sess-open",
      taxRate: 19,
      taxDocumentType: "RECEIPT",
      items: [
        {
          productId: "prod-1",
          quantity: 5,
          discountAmount: 0,
        },
      ],
      payments: [{ method: "CASH", amount: 10000 }],
    });

    expect(result?.status).toBe("COMPLETED");
    expect(mockTx.inventoryStock.updateMany).toHaveBeenCalledTimes(2);
    expect(mockTx.inventoryStock.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        batchId: "batch-early",
        locationId: "loc-pos",
        quantity: { gte: 3 },
      },
      data: { quantity: { decrement: 3 } },
    });
    expect(mockTx.inventoryStock.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        batchId: "batch-later",
        locationId: "loc-pos",
        quantity: { gte: 2 },
      },
      data: { quantity: { decrement: 2 } },
    });
  });

  it("aborta y revierte la transacción (rollback) si el stock disponible es insuficiente", async () => {
    mockTx.product.findMany.mockResolvedValue([
      {
        id: "prod-1",
        name: "Amoxicilina 500mg",
        salePrice: 3500,
        requiresPrescription: false,
        isControlled: false,
        isActive: true,
      },
    ]);
    mockTx.sale.create.mockResolvedValue({ id: "sale-rollback" });

    // Solo hay 2 unidades disponibles y se solicitan 4
    mockTx.inventoryStock.findMany.mockResolvedValue([
      {
        batchId: "batch-1",
        locationId: "loc-pos",
        quantity: 2,
        reservedQuantity: 0,
        batch: {
          id: "batch-1",
          expirationDate: new Date(Date.now() + 30 * 86400000),
          purchasePrice: 1500,
        },
      },
    ]);

    await expect(
      checkout("seller-1", {
        code: "VTA-002",
        cashSessionId: "sess-open",
        taxRate: 19,
        taxDocumentType: "RECEIPT",
        items: [{ productId: "prod-1", quantity: 4, discountAmount: 0 }],
        payments: [{ method: "CASH", amount: 14000 }],
      }),
    ).rejects.toThrowError(
      new ApiError(409, "Stock disponible insuficiente para completar la venta"),
    );

    expect(mockTx.inventoryStock.updateMany).not.toHaveBeenCalled();
    expect(mockTx.sale.update).not.toHaveBeenCalled();
  });

  it("exige obligatoriamente una receta médica válida en medicamentos controlados", async () => {
    mockTx.product.findMany.mockResolvedValue([
      {
        id: "prod-ctrl",
        name: "Clonazepam 2mg",
        salePrice: 4500,
        requiresPrescription: true,
        isControlled: true,
        isActive: true,
      },
    ]);

    await expect(
      checkout("seller-1", {
        code: "VTA-CTRL-01",
        cashSessionId: "sess-open",
        taxRate: 19,
        taxDocumentType: "RECEIPT",
        items: [
          {
            productId: "prod-ctrl",
            quantity: 1,
            discountAmount: 0,
          },
        ],
        payments: [{ method: "CASH", amount: 4500 }],
      }),
    ).rejects.toThrowError(
      new ApiError(400, "Clonazepam 2mg requiere una receta válida"),
    );

    expect(mockTx.sale.create).not.toHaveBeenCalled();
  });
});
