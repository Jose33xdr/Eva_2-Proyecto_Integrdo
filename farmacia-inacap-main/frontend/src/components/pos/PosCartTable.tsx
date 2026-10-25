import {
  ChevronDown,
  ChevronRight,
  Minus,
  Pill,
  Plus,
  ReceiptText,
  ShoppingCart,
  Trash2,
  UserRound,
} from "lucide-react";
import type { PosProduct } from "./PosProductSearch";
import "./pos.module.css";

export type PosPatient = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
};

export type PosCartItem = {
  product: PosProduct;
  quantity: number;
  stock: number;
  maxQuantity: number;
  prescriptionItemId?: string | null;
};

type Props = {
  cart: PosCartItem[];
  units: number;
  total: number;
  patients: PosPatient[];
  selectedPatientId: string;
  selectedPatient: PosPatient | null;
  hasOpenCash: boolean;
  onSelectPatient: (patientId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onOpenCheckout: () => void;
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const PosCartTable = ({
  cart,
  units,
  total,
  patients,
  selectedPatientId,
  selectedPatient,
  hasOpenCash,
  onSelectPatient,
  onUpdateQuantity,
  onRemoveItem,
  onOpenCheckout,
}: Props) => (
  <aside className="pos-v2__cart">
    <div className="pos-v2__cart-header">
      <div>
        <span className="pos-v2__eyebrow">Venta actual</span>
        <h2>Resumen</h2>
      </div>
      <div className="pos-v2__cart-count">
        <ShoppingCart size={16} />
        <span>{units}</span>
      </div>
    </div>
    <label className="pos-v2__customer">
      <span className="pos-v2__customer-icon">
        <UserRound size={17} />
      </span>
      <div>
        <strong>
          {selectedPatient
            ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
            : "Venta directa"}
        </strong>
        <span>
          {selectedPatient ? selectedPatient.rut : "Seleccionar paciente"}
        </span>
      </div>
      <ChevronDown size={15} style={{ color: "#88958f" }} />
      <select
        value={selectedPatientId}
        onChange={(event) => onSelectPatient(event.target.value)}
      >
        <option value="">Venta directa</option>
        {patients.map((patient) => (
          <option value={patient.id} key={patient.id}>
            {patient.rut} · {patient.firstName} {patient.lastName}
          </option>
        ))}
      </select>
    </label>

    <div className="pos-v2__cart-items">
      {cart.length ? (
        cart.map((item) => (
          <div className="pos-cart-item" key={item.product.id}>
            <div className="pos-cart-item__main">
              <div className="pos-cart-item__icon">
                <Pill size={17} />
              </div>
              <div className="pos-cart-item__info">
                <strong>{item.product.name}</strong>
                <span>{clp.format(Number(item.product.salePrice))} c/u</span>
              </div>
              <button
                className="pos-cart-item__remove"
                onClick={() => onRemoveItem(item.product.id)}
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="pos-cart-item__bottom">
              <div className="pos-quantity">
                <button
                  onClick={() =>
                    onUpdateQuantity(item.product.id, item.quantity - 1)
                  }
                >
                  <Minus size={14} />
                </button>
                <strong>{item.quantity}</strong>
                <button
                  onClick={() =>
                    onUpdateQuantity(item.product.id, item.quantity + 1)
                  }
                >
                  <Plus size={14} />
                </button>
              </div>
              <strong>
                {clp.format(Number(item.product.salePrice) * item.quantity)}
              </strong>
            </div>
          </div>
        ))
      ) : (
        <div className="pos-v2__cart-empty">
          <div>
            <ShoppingCart size={26} />
          </div>
          <strong>Tu venta está vacía</strong>
          <span>Selecciona productos para comenzar.</span>
        </div>
      )}
    </div>

    <div className="pos-v2__cart-footer">
      <div className="pos-v2__totals">
        <div>
          <span>Productos</span>
          <strong>{units}</strong>
        </div>
        <div className="pos-v2__total">
          <span>Total</span>
          <strong>{clp.format(total)}</strong>
        </div>
      </div>
      <button
        className="pos-v2__checkout"
        disabled={!cart.length || !hasOpenCash}
        onClick={onOpenCheckout}
      >
        <ReceiptText size={18} />
        <span>{hasOpenCash ? "Continuar al pago" : "Abrir caja para cobrar"}</span>
        <ChevronRight size={17} />
      </button>
    </div>
  </aside>
);
