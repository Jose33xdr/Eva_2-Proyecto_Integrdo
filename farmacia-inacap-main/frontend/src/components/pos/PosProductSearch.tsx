import { Barcode, Pill, Plus, Search } from "lucide-react";
import "./pos.module.css";

export type PosProduct = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  salePrice: string | number;
  requiresPrescription: boolean;
  isControlled: boolean;
  isActive: boolean;
  category?: { name: string } | null;
  laboratory?: { name: string } | null;
};

type Props = {
  query: string;
  category: string;
  categories: string[];
  products: PosProduct[];
  stockByProduct: Map<string, number>;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onReload: () => void;
  onAddProduct: (product: PosProduct) => void;
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const PosProductSearch = ({
  query,
  category,
  categories,
  products,
  stockByProduct,
  loading,
  onQueryChange,
  onCategoryChange,
  onReload,
  onAddProduct,
}: Props) => (
  <div className="pos-v2__catalog">
    <div className="pos-v2__toolbar">
      <div className="pos-v2__search">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar producto, SKU o código de barras..."
        />
        <span className="pos-v2__search-code">
          <Barcode size={18} />
        </span>
      </div>
      <div className="pos-v2__category-scroll">
        {categories.map((item) => (
          <button
            key={item}
            className={`pos-v2__category ${
              category === item ? "pos-v2__category--active" : ""
            }`}
            onClick={() => onCategoryChange(item)}
          >
            {item === "TODAS" ? "Todos" : item}
          </button>
        ))}
      </div>
    </div>

    <div className="pos-v2__catalog-heading">
      <div>
        <h2>Productos</h2>
        <span>{products.length} disponibles</span>
      </div>
      <button className="pos-v2__reload" onClick={onReload}>
        Actualizar
      </button>
    </div>

    {loading ? (
      <div className="pos-v2__loading">Cargando...</div>
    ) : (
      <div className="pos-v2__products">
        {products.map((product) => {
          const stock = stockByProduct.get(product.id) ?? 0;
          return (
            <article
              className={`pos-product ${
                stock <= 0 ? "pos-product--out" : ""
              }`}
              key={product.id}
            >
              <div className="pos-product__top">
                <div className="pos-product__icon">
                  <Pill size={21} />
                </div>
                <div className="pos-product__badges">
                  {product.isControlled ? (
                    <span className="pos-product__badge pos-product__badge--controlled">
                      Controlado
                    </span>
                  ) : product.requiresPrescription ? (
                    <span className="pos-product__badge pos-product__badge--rx">
                      Receta
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="pos-product__body">
                <span className="pos-product__category">
                  {product.category?.name ?? "Producto"}
                </span>
                <h3>{product.name}</h3>
                <small>{product.laboratory?.name ?? product.sku}</small>
              </div>
              <div className="pos-product__meta">
                <div>
                  <span>Stock</span>
                  <strong>{stock}</strong>
                </div>
                <strong className="pos-product__price">
                  {clp.format(Number(product.salePrice))}
                </strong>
              </div>
              <button
                className="pos-product__add"
                disabled={stock <= 0}
                onClick={() => onAddProduct(product)}
              >
                <Plus size={16} />
                {stock <= 0 ? "Sin stock" : "Agregar"}
              </button>
            </article>
          );
        })}
      </div>
    )}
  </div>
);
