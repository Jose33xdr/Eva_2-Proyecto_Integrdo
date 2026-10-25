import { describe, expect, it } from "vitest";
import { getAvailableStockByProduct } from "./posInventory";

describe("getAvailableStockByProduct", () => {
  it("sums sellable quantities across batches for the same product", () => {
    const stock = getAvailableStockByProduct([
      {
        quantity: 8,
        reservedQuantity: 2,
        batch: { product: { id: "paracetamol" } },
      },
      {
        quantity: 5,
        reservedQuantity: 0,
        batch: { product: { id: "paracetamol" } },
      },
    ]);

    expect(stock.get("paracetamol")).toBe(11);
  });

  it("excludes reserved units and clamps unavailable stock to zero", () => {
    const stock = getAvailableStockByProduct([
      {
        quantity: 5,
        reservedQuantity: 3,
        batch: { product: { id: "ibuprofen" } },
      },
      {
        quantity: 2,
        reservedQuantity: 4,
        batch: { product: { id: "ibuprofen" } },
      },
    ]);

    expect(stock.get("ibuprofen")).toBe(2);
  });

  it("does not associate rows without a product with a catalog item", () => {
    const stock = getAvailableStockByProduct([
      { quantity: 9, reservedQuantity: 0, batch: null },
      {
        quantity: 4,
        reservedQuantity: 1,
        batch: { product: null },
      },
    ]);

    expect(stock.size).toBe(0);
  });

  it("excludes expired batches, blocked batches, inactive locations and quarantine locations", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const stock = getAvailableStockByProduct(
      [
        {
          quantity: 10,
          reservedQuantity: 0,
          location: { isActive: true, type: "DISPLAY" },
          batch: {
            expirationDate: "2026-12-31T00:00:00.000Z",
            isBlocked: false,
            product: { id: "amoxicilina" },
          },
        },
        {
          quantity: 7,
          reservedQuantity: 0,
          location: { isActive: true, type: "DISPLAY" },
          batch: {
            expirationDate: "2026-05-01T00:00:00.000Z",
            isBlocked: false,
            product: { id: "amoxicilina" },
          },
        },
        {
          quantity: 5,
          reservedQuantity: 0,
          location: { isActive: true, type: "DISPLAY" },
          batch: {
            expirationDate: "2026-12-31T00:00:00.000Z",
            isBlocked: true,
            product: { id: "amoxicilina" },
          },
        },
        {
          quantity: 4,
          reservedQuantity: 0,
          location: { isActive: false, type: "DISPLAY" },
          batch: {
            expirationDate: "2026-12-31T00:00:00.000Z",
            isBlocked: false,
            product: { id: "amoxicilina" },
          },
        },
        {
          quantity: 6,
          reservedQuantity: 0,
          location: { isActive: true, type: "QUARANTINE" },
          batch: {
            expirationDate: "2026-12-31T00:00:00.000Z",
            isBlocked: false,
            product: { id: "amoxicilina" },
          },
        },
      ],
      now,
    );

    expect(stock.get("amoxicilina")).toBe(10);
  });
});
