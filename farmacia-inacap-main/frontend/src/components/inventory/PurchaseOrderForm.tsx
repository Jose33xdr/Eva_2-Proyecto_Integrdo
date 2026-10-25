import { useMemo } from "react";
import { ActionModal, type ActionField } from "../ui/ActionModal";
import { translateChoiceLabel } from "../../lib/choiceLabels";

export type PurchaseSupplier = {
  id: string;
  businessName: string;
  rut: string;
  isActive: boolean;
};

export type PurchaseProduct = {
  id: string;
  name: string;
  sku: string;
  isActive: boolean;
  purchasePrice?: number | string | null;
};

export type PurchaseLocation = {
  id: string;
  name: string;
  isActive: boolean;
};

export type PurchaseDetail = {
  id: string;
  productId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number | string;
  product: PurchaseProduct;
};

export type PurchaseOrderItem = {
  id: string;
  code: string;
  orderDate: string;
  expectedDate?: string | null;
  totalAmount: number | string;
  status: string;
  supplier: PurchaseSupplier;
  details: PurchaseDetail[];
};

export type PurchaseModalMode =
  | "order"
  | "supplier"
  | "status"
  | "receive"
  | null;

const supplierFields: ActionField[] = [
  {
    name: "rut",
    label: "RUT",
    required: true,
    minLength: 8,
    maxLength: 10,
    example: "76123456-7",
    placeholder: "Ej.: 76123456-7 (8 a 10 car., sin puntos)",
    hint: "RUT tributario sin puntos. El guion antes del dígito verificador se coloca solo.",
  },
  {
    name: "businessName",
    label: "Razón social",
    required: true,
    minLength: 3,
    maxLength: 150,
    example: "Droguería e Insumos Farmacéuticos SpA",
    placeholder: "Ej.: Droguería Central SpA (de 3 a 150 car.)",
    hint: "Nombre legal completo tal como figura en las facturas de compra.",
  },
  {
    name: "tradeName",
    label: "Nombre fantasía",
    maxLength: 100,
    example: "Droguería Sur",
    placeholder: "Ej.: Droguería Sur (máx. 100 car.)",
    hint: "Nombre comercial o marca conocida por la cual identificas al proveedor.",
  },
  {
    name: "contactName",
    label: "Contacto",
    maxLength: 100,
    example: "Carlos Mendoza (Ejecutivo de ventas)",
    placeholder: "Ej.: Carlos Mendoza - Ventas (máx. 100 car.)",
    hint: "Nombre de tu vendedor asignado o ejecutivo de cuentas.",
  },
  {
    name: "email",
    label: "Correo",
    type: "email",
    maxLength: 100,
    example: "ventas@proveedor.cl",
    placeholder: "Ej.: pedidos@drogueria.cl (máx. 100 car.)",
    hint: "Correo electrónico para envío de órdenes de compra.",
  },
  {
    name: "phone",
    label: "Teléfono",
    maxLength: 25,
    example: "+56 9 1234 5678",
    placeholder: "Ej.: +56 9 1234 5678 (máx. 25 car.)",
    hint: "Teléfono fijo o celular para consultas de despachos.",
  },
  {
    name: "address",
    label: "Dirección",
    maxLength: 150,
    example: "Av. Providencia 1234, Oficina 501",
    placeholder: "Ej.: Av. Providencia 1234, Bodega 3 (máx. 150 car.)",
    hint: "Calle, número y bodega/oficina del proveedor.",
  },
  {
    name: "commune",
    label: "Comuna",
    maxLength: 60,
    example: "Providencia",
    placeholder: "Ej.: Providencia (máx. 60 car.)",
    hint: "Comuna de la casa matriz o centro de distribución.",
  },
  {
    name: "region",
    label: "Región",
    maxLength: 60,
    example: "Región Metropolitana",
    placeholder: "Ej.: Región Metropolitana (máx. 60 car.)",
    hint: "Región del país.",
  },
];

const statusFields: ActionField[] = [
  {
    name: "status",
    label: "Estado",
    type: "select",
    required: true,
    options: ["DRAFT", "SENT", "CANCELLED"].map((v) => ({
      value: v,
      label: translateChoiceLabel(v),
    })),
  },
];

type Props = {
  mode: PurchaseModalMode;
  selected: PurchaseOrderItem | null;
  receiptCode: string;
  suppliers: PurchaseSupplier[];
  products: PurchaseProduct[];
  locations: PurchaseLocation[];
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string | number | boolean>) => void | Promise<void>;
};

export const PurchaseOrderForm = ({
  mode,
  selected,
  receiptCode,
  suppliers,
  products,
  locations,
  busy,
  error,
  onClose,
  onSubmit,
}: Props) => {
  const fields = useMemo<ActionField[]>(() => {
    if (mode === "supplier") return supplierFields;
    if (mode === "order") {
      return [
        {
          name: "code",
          label: "Código OC",
          required: true,
          minLength: 3,
          maxLength: 50,
          example: "OC-2026-001",
          placeholder: "Ej.: OC-2026-001 (3 a 50 caracteres)",
          hint: "Identificador único para esta orden. No repitas el código de otra orden.",
        },
        {
          name: "supplierId",
          label: "Proveedor",
          type: "select",
          required: true,
          hint: "Elige el proveedor al que realizarás el pedido.",
          emptyOptionsHint: "Todavía no hay proveedores registrados. Crea uno con «Nuevo proveedor».",
          options: suppliers
            .filter((s) => s.isActive)
            .map((s) => ({ value: s.id, label: s.businessName })),
        },
        {
          name: "productId",
          label: "Producto",
          type: "select",
          required: true,
          hint: "Elige el producto que pedirás. Si no aparece, primero debe crearse en Productos.",
          emptyOptionsHint: "Todavía no hay productos registrados en el catálogo.",
          options: products
            .filter((p) => p.isActive !== false)
            .map((p) => ({ value: p.id, label: `${p.sku} · ${p.name}` })),
        },
        {
          name: "quantityOrdered",
          label: "Cantidad",
          type: "number",
          min: 1,
          integer: true,
          required: true,
          example: "10",
          placeholder: "Ej.: 10 (unidades enteras, mínimo 1)",
          hint: "Escribe cuántas unidades pedirás; solo números enteros.",
        },
        {
          name: "unitCost",
          label: "Costo unitario",
          type: "number",
          min: 0,
          required: true,
          example: "1250",
          placeholder: "Ej.: 1250 (pesos por unidad, sin IVA)",
          hint: "Ingresa el precio neto real de una unidad, sin IVA.",
        },
        {
          name: "taxRate",
          label: "IVA %",
          type: "number",
          min: 0,
          required: true,
          example: "19",
          placeholder: "Ej.: 19 (porcentaje)",
          hint: "En Chile normalmente se usa 19%.",
        },
        {
          name: "expectedDate",
          label: "Fecha esperada",
          type: "date",
          hint: "Selecciona la fecha estimada de entrega. Es opcional.",
        },
        {
          name: "notes",
          label: "Notas",
          type: "textarea",
          maxLength: 255,
          example: "Entregar en bodega de 09:00 a 14:00 hrs. Pago a 30 días.",
          placeholder: "Ej.: Entregar en bodega de 09:00 a 14:00 (máx. 255 caracteres)",
          hint: "Agrega instrucciones de entrega si corresponde; puedes dejarlo vacío.",
        },
      ];
    }
    if (mode === "status") return statusFields;
    if (mode === "receive" && selected) {
      const receiveFields: ActionField[] = [
        {
          name: "code",
          label: "Código recepción",
          required: true,
          minLength: 3,
          maxLength: 50,
          example: "REC-2026-001",
          placeholder: "Ej.: REC-2026-001 (3 a 50 caracteres)",
          hint: "Identificador único de esta recepción. Se genera uno automáticamente.",
        },
        {
          name: "notes",
          label: "Notas",
          type: "textarea",
          maxLength: 255,
          example: "Recepción completa, cajas sin daños.",
          placeholder: "Ej.: Cajas recibidas sin daños (máx. 255 caracteres)",
          hint: "Anota observaciones de la entrega; es opcional.",
        },
      ];
      selected.details
        .filter((d) => d.quantityOrdered > d.quantityReceived)
        .forEach((d) => {
          receiveFields.push(
            {
              name: `batch_${d.productId}`,
              label: `Lote · ${d.product.name}`,
              required: true,
              maxLength: 100,
              example: "L240815A",
              placeholder: "Ej.: L240815A (máx. 100 caracteres)",
              hint: "Copia el número de lote impreso en el envase.",
            },
            {
              name: `expiry_${d.productId}`,
              label: `Vencimiento · ${d.product.name}`,
              type: "date",
              required: true,
              hint: "Selecciona la fecha de vencimiento impresa en el envase.",
            },
            {
              name: `qty_${d.productId}`,
              label: `Cantidad · saldo ${d.quantityOrdered - d.quantityReceived}`,
              type: "number",
              min: 1,
              required: true,
              integer: true,
              example: String(d.quantityOrdered - d.quantityReceived),
              placeholder: `Ej.: ${d.quantityOrdered - d.quantityReceived} (máximo: saldo pendiente)`,
              hint: `Ingresa las unidades recibidas; no puede superar el saldo pendiente (${d.quantityOrdered - d.quantityReceived}).`,
            },
            {
              name: `price_${d.productId}`,
              label: `Costo · ${d.product.name}`,
              type: "number",
              min: 0,
              required: true,
              example: String(d.unitCost),
              placeholder: `Ej.: ${d.unitCost} (pesos por unidad)`,
              hint: "Escribe el costo real por unidad, según la compra.",
            },
            {
              name: `loc_${d.productId}`,
              label: `Ubicación · ${d.product.name}`,
              type: "select",
              required: true,
              hint: "Elige la bodega o ubicación donde guardarás estas unidades.",
              options: locations
                .filter((l) => l.isActive)
                .map((l) => ({ value: l.id, label: l.name })),
            },
          );
        });
      return receiveFields;
    }
    return [];
  }, [mode, suppliers, products, selected, locations]);

  const initialValues = useMemo<Record<string, unknown>>(() => {
    if (mode === "order") return { taxRate: 19, quantityOrdered: 1 };
    if (mode === "receive") return { code: receiptCode };
    if (mode === "status" && selected) return { status: selected.status };
    return {};
  }, [mode, receiptCode, selected]);

  return (
    <ActionModal
      open={Boolean(mode)}
      title={
        mode === "supplier"
          ? "Nuevo proveedor"
          : mode === "order"
            ? "Nueva orden de compra"
            : mode === "status"
              ? "Cambiar estado"
              : "Recepcionar orden"
      }
      fields={fields}
      initialValues={initialValues}
      busy={busy}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
};
