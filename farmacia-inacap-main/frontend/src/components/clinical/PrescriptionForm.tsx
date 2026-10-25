import { useMemo } from "react";
import { ActionModal, type ActionField } from "../ui/ActionModal";
import { translateChoiceLabel } from "../../lib/choiceLabels";

export type ClinicalPatient = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
};

export type ClinicalDoctor = {
  id: string;
  firstName: string;
  lastName: string;
  rut: string;
  isActive: boolean;
};

export type ClinicalProduct = {
  id: string;
  sku: string;
  name: string;
  isActive: boolean;
};

export type PrescriptionFormValues = Record<string, string | number | boolean>;

const cancelPrescriptionFields: ActionField[] = [
  {
    name: "reason",
    label: "Motivo de cancelación",
    type: "textarea",
    required: true,
  },
];

type Props = {
  mode: "create" | "cancel" | null;
  patients: ClinicalPatient[];
  doctors: ClinicalDoctor[];
  products: ClinicalProduct[];
  todayDate: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (values: PrescriptionFormValues) => void | Promise<void>;
};

export const PrescriptionForm = ({
  mode,
  patients,
  doctors,
  products,
  todayDate,
  busy,
  error,
  onClose,
  onSubmit,
}: Props) => {
  const fields = useMemo<ActionField[]>(() => {
    if (mode === "cancel") return cancelPrescriptionFields;
    return [
      { name: "folio", label: "Folio", required: true },
      {
        name: "origin",
        label: "Origen",
        type: "select",
        required: true,
        options: [
          { value: "PHYSICAL", label: "Física" },
          { value: "DIGITAL", label: "Digital" },
        ],
      },
      {
        name: "prescriptionType",
        label: "Tipo receta",
        type: "select",
        required: true,
        options: ["NONE", "SIMPLE", "RETAINED", "CHECK", "BALANCE_CONTROL"].map(
          (v) => ({ value: v, label: translateChoiceLabel(v) }),
        ),
      },
      { name: "issueDate", label: "Fecha emisión", type: "date", required: true },
      { name: "expirationDate", label: "Vencimiento", type: "date" },
      {
        name: "patientId",
        label: "Paciente",
        type: "select",
        required: true,
        options: patients
          .filter((p) => p.isActive)
          .map((p) => ({
            value: p.id,
            label: `${p.rut} · ${p.firstName} ${p.lastName}`,
          })),
      },
      {
        name: "doctorId",
        label: "Médico",
        type: "select",
        required: true,
        options: doctors
          .filter((d) => d.isActive)
          .map((d) => ({
            value: d.id,
            label: `${d.firstName} ${d.lastName} · ${d.rut}`,
          })),
      },
      {
        name: "productId",
        label: "Medicamento",
        type: "select",
        required: true,
        options: products
          .filter((p) => p.isActive)
          .map((p) => ({ value: p.id, label: `${p.sku} · ${p.name}` })),
      },
      {
        name: "prescribedQuantity",
        label: "Cantidad prescrita",
        type: "number",
        min: 1,
        required: true,
      },
      { name: "dosage", label: "Dosis" },
      { name: "frequency", label: "Frecuencia" },
      { name: "duration", label: "Duración" },
      { name: "fileUrl", label: "URL archivo receta" },
      { name: "retainedFileUrl", label: "URL receta retenida" },
      { name: "notes", label: "Notas", type: "textarea" },
      { name: "hasBalanceControl", label: "Control de saldo", type: "checkbox" },
    ];
  }, [mode, patients, doctors, products]);

  const initialValues = useMemo<Record<string, unknown>>(
    () =>
      mode === "create"
        ? {
            origin: "PHYSICAL",
            prescriptionType: "SIMPLE",
            issueDate: todayDate,
            prescribedQuantity: 1,
            hasBalanceControl: false,
          }
        : {},
    [mode, todayDate],
  );

  return (
    <ActionModal
      open={Boolean(mode)}
      title={mode === "cancel" ? "Cancelar receta" : "Nueva receta"}
      fields={fields}
      initialValues={initialValues}
      busy={busy}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
};
