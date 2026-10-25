export type InventoryStockRow = {
  quantity: number | string;
  reservedQuantity: number | string;
  location?: {
    isActive?: boolean;
    type?: string;
  } | null;
  batch?: {
    expirationDate?: string | Date | null;
    isBlocked?: boolean;
    product?: { id: string } | null;
  } | null;
};

export const getAvailableStockByProduct = (
  stockRows: InventoryStockRow[],
  now: Date = new Date(),
) => {
  const quantities = new Map<string, number>();
  const nowTime = now.getTime();

  stockRows.forEach((row) => {
    const productId = row.batch?.product?.id;
    if (!productId) return;

    if (row.batch?.isBlocked === true) return;

    if (
      row.batch?.expirationDate &&
      new Date(row.batch.expirationDate).getTime() <= nowTime
    ) {
      return;
    }

    if (
      row.location &&
      (row.location.isActive === false || row.location.type === "QUARANTINE")
    ) {
      return;
    }

    quantities.set(
      productId,
      (quantities.get(productId) ?? 0) +
        Math.max(0, Number(row.quantity) - Number(row.reservedQuantity)),
    );
  });

  return quantities;
};
