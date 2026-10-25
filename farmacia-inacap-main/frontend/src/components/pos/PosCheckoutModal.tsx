import { ActionModal, type ActionField } from "../ui/ActionModal";

export type CheckoutValues = Record<string, string | number | boolean>;

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const checkoutFields: ActionField[] = [
  {
    name: "paymentMethod",
    label: "Medio de pago",
    type: "select",
    required: true,
    options: [
      { value: "CASH", label: "Efectivo" },
      { value: "DEBIT_CARD", label: "Débito" },
      { value: "CREDIT_CARD", label: "Crédito" },
      { value: "BANK_TRANSFER", label: "Transferencia" },
      { value: "OTHER", label: "Otro" },
    ],
  },
  {
    name: "taxDocumentType",
    label: "Documento",
    type: "select",
    required: true,
    options: [
      { value: "RECEIPT", label: "Boleta" },
      { value: "INVOICE", label: "Factura" },
    ],
  },
  { name: "referenceCode", label: "Referencia pago" },
  { name: "customerRut", label: "RUT cliente", hint: "Obligatorio para Factura" },
  { name: "customerName", label: "Nombre cliente" },
  {
    name: "customerBusinessName",
    label: "Razón social",
    hint: "Obligatorio para Factura",
  },
  {
    name: "customerBusinessActivity",
    label: "Giro",
    hint: "Obligatorio para Factura",
  },
  {
    name: "customerAddress",
    label: "Dirección",
    hint: "Obligatorio para Factura",
  },
  { name: "notes", label: "Notas", type: "textarea" },
];

type Props = {
  open: boolean;
  total: number;
  initialValues: Record<string, unknown>;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (values: CheckoutValues) => void | Promise<void>;
};

export const PosCheckoutModal = ({
  open,
  total,
  initialValues,
  busy,
  error,
  onClose,
  onSubmit,
}: Props) => (
  <ActionModal
    open={open}
    title="Finalizar venta"
    description={`Total a pagar: ${clp.format(total)}`}
    fields={checkoutFields}
    initialValues={initialValues}
    busy={busy}
    error={error}
    onClose={onClose}
    onSubmit={onSubmit}
  />
);
