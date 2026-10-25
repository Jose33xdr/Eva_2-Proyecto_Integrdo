import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarDays,
  ClipboardCheck,
  PackageSearch,
  PackageX,
  Pill,
  Plus,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  Stethoscope,
  UserPlus,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { useResource } from "../hooks/useResource";

type DashboardData = {
  today: {
    sales: number;
    revenue: number;
  };
  counters: {
    activeProducts: number;
    activePatients: number;
    lowStock: number;
    expiringBatches: number;
    openCashSessions: number;
    activePrescriptions: number;
    pendingAlerts: number;
  };
  lowStock: Array<{
    id: string;
    sku: string;
    name: string;
    minimumStock: number;
    stock: number;
  }>;
};

type SaleRow = {
  id: string;
  code: string;
  saleDate: string;
  totalAmount: string | number;
  seller: {
    username: string;
    firstName: string;
    lastName: string;
  };
  patient: {
    rut: string;
    firstName: string;
    lastName: string;
  } | null;
};

type SalesReport = {
  summary: {
    count: number;
    total: number;
    discounts: number;
    coverages: number;
  };
  sales: SaleRow[];
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const shortNumber = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 0,
});

const getDayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const buildSevenDaySeries = (sales: SaleRow[]) => {
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      key: getDayKey(date),
      label: date.toLocaleDateString("es-CL", {
        weekday: "short",
      }),
      total: 0,
      count: 0,
    };
  });

  const map = new Map(days.map((day) => [day.key, day]));

  sales.forEach((sale) => {
    const date = new Date(sale.saleDate);
    const key = getDayKey(date);
    const day = map.get(key);

    if (day) {
      day.total += Number(sale.totalAmount);
      day.count += 1;
    }
  });

  return days;
};

const formatRoleName = (
  firstName?: string,
  lastName?: string,
  username?: string,
) => {
  const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return fullName || username || "Usuario";
};

export const DashboardPage = () => {
  const dashboardSelector = useCallback(
    (payload: { dashboard: DashboardData }) => payload.dashboard,
    [],
  );

  const salesSelector = useCallback(
    (payload: { report: SalesReport }) => payload.report,
    [],
  );

  const salesEndpoint = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - 6);
    return `/reports/sales?from=${encodeURIComponent(from.toISOString())}`;
  }, []);

  const {
    data: dashboard,
    loading: dashboardLoading,
    error: dashboardError,
    reload: reloadDashboard,
  } = useResource<DashboardData, { dashboard: DashboardData }>(
    "/reports/dashboard",
    dashboardSelector,
  );

  const {
    data: salesReport,
    loading: salesLoading,
    error: salesError,
    reload: reloadSales,
  } = useResource<SalesReport, { report: SalesReport }>(
    salesEndpoint,
    salesSelector,
  );

  const sevenDays = useMemo(
    () => buildSevenDaySeries(salesReport?.sales ?? []),
    [salesReport],
  );

  const sevenDaysSummary = useMemo(
    () =>
      sevenDays.reduce(
        (acc, day) => ({
          count: acc.count + day.count,
          total: acc.total + day.total,
        }),
        { count: 0, total: 0 },
      ),
    [sevenDays],
  );

  const maxDayTotal = useMemo(
    () => Math.max(...sevenDays.map((day) => day.total), 1),
    [sevenDays],
  );

  const recentSales = useMemo(
    () => (salesReport?.sales ?? []).slice(0, 5),
    [salesReport],
  );

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  const loading = dashboardLoading || salesLoading;
  const error = dashboardError || salesError;

  const handleReload = async () => {
    await Promise.all([reloadDashboard(), reloadSales()]);
  };

  if (loading) {
    return <PageLoader label="Cargando dashboard..." />;
  }

  return (
    <div className="dashboard-v2">
      <header className="dashboard-v2__header">
        <div>
          <span className="dashboard-v2__eyebrow">Resumen general</span>
          <h1>Dashboard</h1>
          <p>Visión rápida de la operación diaria de FarmaGestión.</p>
        </div>

        <div className="dashboard-v2__header-actions">
          <div className="dashboard-v2__date">
            <CalendarDays size={16} />
            <span>{today}</span>
          </div>

          <button
            type="button"
            className="dashboard-v2__refresh"
            onClick={() => void handleReload()}
            aria-label="Actualizar dashboard"
            title="Actualizar"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </header>

      {error ? <div className="alert alert--error">{error}</div> : null}

      {dashboard ? (
        <>
          <section className="dashboard-v2__kpis">
            <article className="dashboard-kpi dashboard-kpi--sales">
              <div className="dashboard-kpi__icon">
                <ReceiptText size={21} />
              </div>
              <div className="dashboard-kpi__body">
                <span>Ventas de hoy</span>
                <strong>{clp.format(dashboard.today.revenue)}</strong>
                <small>{dashboard.today.sales} ventas registradas</small>
              </div>
            </article>

            <article className="dashboard-kpi dashboard-kpi--products">
              <div className="dashboard-kpi__icon">
                <Boxes size={21} />
              </div>
              <div className="dashboard-kpi__body">
                <span>Productos activos</span>
                <strong>
                  {shortNumber.format(dashboard.counters.activeProducts)}
                </strong>
                <small>{dashboard.counters.lowStock} con stock bajo</small>
              </div>
            </article>

            <article className="dashboard-kpi dashboard-kpi--patients">
              <div className="dashboard-kpi__icon">
                <UsersRound size={21} />
              </div>
              <div className="dashboard-kpi__body">
                <span>Pacientes activos</span>
                <strong>
                  {shortNumber.format(dashboard.counters.activePatients)}
                </strong>
                <small>
                  {dashboard.counters.activePrescriptions} recetas activas
                </small>
              </div>
            </article>

            <article className="dashboard-kpi dashboard-kpi--cash">
              <div className="dashboard-kpi__icon">
                <WalletCards size={21} />
              </div>
              <div className="dashboard-kpi__body">
                <span>Cajas abiertas</span>
                <strong>{dashboard.counters.openCashSessions}</strong>
                <small>Sesiones operativas actuales</small>
              </div>
            </article>
          </section>

          <section className="dashboard-v2__alerts">
            <div className="dashboard-alert dashboard-alert--warning">
              <PackageX size={17} />
              <span>Stock bajo</span>
              <strong>{dashboard.counters.lowStock}</strong>
            </div>

            <div className="dashboard-alert dashboard-alert--amber">
              <AlertTriangle size={17} />
              <span>Lotes por vencer</span>
              <strong>{dashboard.counters.expiringBatches}</strong>
            </div>

            <div className="dashboard-alert dashboard-alert--blue">
              <ClipboardCheck size={17} />
              <span>Recetas activas</span>
              <strong>{dashboard.counters.activePrescriptions}</strong>
            </div>

            <div className="dashboard-alert dashboard-alert--danger">
              <AlertTriangle size={17} />
              <span>Alertas pendientes</span>
              <strong>{dashboard.counters.pendingAlerts}</strong>
            </div>
          </section>

          <section className="dashboard-v2__main-grid">
            <article className="dashboard-panel dashboard-panel--chart">
              <div className="dashboard-panel__header">
                <div>
                  <span className="dashboard-panel__eyebrow">Ventas</span>
                  <h2>Últimos 7 días</h2>
                </div>

                <span className="dashboard-panel__muted">
                  {sevenDaysSummary.count} ventas registradas
                </span>
              </div>

              <div className="dashboard-chart">
                <div className="dashboard-chart__plot">
                  {sevenDays.map((day) => {
                    const height =
                      day.total > 0
                        ? Math.max(
                            12,
                            Math.round((day.total / maxDayTotal) * 100),
                          )
                        : 4;

                    return (
                      <div className="dashboard-chart__column" key={day.key}>
                        <div className="dashboard-chart__bar-wrap">
                          <span
                            className="dashboard-chart__bar"
                            style={{ height: `${height}%` }}
                            title={`${clp.format(day.total)} · ${day.count} ventas`}
                          />
                        </div>

                        <span className="dashboard-chart__label">
                          {day.label.replace(".", "")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="dashboard-chart__footer">
                <div>
                  <span>Total reportado</span>
                  <strong>{clp.format(sevenDaysSummary.total)}</strong>
                </div>

                <Link to="/reports" className="dashboard-link">
                  Ver reportes
                  <ArrowRight size={15} />
                </Link>
              </div>
            </article>

            <article className="dashboard-panel dashboard-panel--sales">
              <div className="dashboard-panel__header">
                <div>
                  <span className="dashboard-panel__eyebrow">Actividad</span>
                  <h2>Últimas ventas</h2>
                </div>

                <Link to="/sales" className="dashboard-link">
                  Ver todas
                  <ArrowRight size={15} />
                </Link>
              </div>

              {recentSales.length ? (
                <div className="dashboard-sales-list">
                  {recentSales.map((sale) => (
                    <Link
                      to="/sales"
                      className="dashboard-sale-row"
                      key={sale.id}
                    >
                      <div className="dashboard-sale-row__icon">
                        <ReceiptText size={17} />
                      </div>

                      <div className="dashboard-sale-row__body">
                        <strong>{sale.code}</strong>
                        <span>
                          {sale.patient
                            ? `${sale.patient.firstName} ${sale.patient.lastName}`
                            : "Venta directa"}
                        </span>
                        <small>
                          {new Date(sale.saleDate).toLocaleString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {formatRoleName(
                            sale.seller?.firstName,
                            sale.seller?.lastName,
                            sale.seller?.username,
                          )}
                        </small>
                      </div>

                      <strong className="dashboard-sale-row__amount">
                        {clp.format(Number(sale.totalAmount))}
                      </strong>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Sin ventas recientes"
                  description="Las ventas más recientes aparecerán aquí."
                />
              )}
            </article>
          </section>

          <section className="dashboard-v2__bottom-grid">
            <article className="dashboard-panel dashboard-panel--stock">
              <div className="dashboard-panel__header">
                <div>
                  <span className="dashboard-panel__eyebrow">Inventario</span>
                  <h2>Productos con stock bajo</h2>
                </div>

                <Link to="/inventory" className="dashboard-link">
                  Ver inventario
                  <ArrowRight size={15} />
                </Link>
              </div>

              {dashboard.lowStock.length ? (
                <div className="dashboard-stock-table">
                  <div className="dashboard-stock-table__head">
                    <span>Producto</span>
                    <span>Stock</span>
                    <span>Mínimo</span>
                    <span>Estado</span>
                  </div>

                  {dashboard.lowStock.slice(0, 6).map((item) => {
                    const critical =
                      item.minimumStock > 0 &&
                      item.stock <= Math.max(1, item.minimumStock * 0.4);

                    return (
                      <div className="dashboard-stock-table__row" key={item.id}>
                        <div>
                          <span className="dashboard-stock-product__icon">
                            <Pill size={15} />
                          </span>

                          <div>
                            <strong>{item.name}</strong>
                            <small>{item.sku}</small>
                          </div>
                        </div>

                        <strong>{item.stock}</strong>
                        <span>{item.minimumStock}</span>

                        <span
                          className={`dashboard-stock-status ${
                            critical
                              ? "dashboard-stock-status--critical"
                              : "dashboard-stock-status--low"
                          }`}
                        >
                          {critical ? "Crítico" : "Bajo"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="dashboard-inventory-ok">
                  <div className="dashboard-inventory-ok__icon">
                    <Boxes size={25} />
                  </div>

                  <div>
                    <strong>Inventario estable</strong>
                    <span>
                      No hay productos bajo el stock mínimo configurado.
                    </span>
                  </div>
                </div>
              )}
            </article>

            <article className="dashboard-panel dashboard-panel--quick">
              <div className="dashboard-panel__header">
                <div>
                  <span className="dashboard-panel__eyebrow">Atajos</span>
                  <h2>Accesos rápidos</h2>
                </div>
              </div>

              <div className="dashboard-quick-grid">
                <Link to="/pos" className="dashboard-quick dashboard-quick--green">
                  <ShoppingCart size={19} />
                  <span>Nueva venta</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  to="/products"
                  className="dashboard-quick dashboard-quick--blue"
                >
                  <PackageSearch size={19} />
                  <span>Buscar producto</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  to="/patients"
                  className="dashboard-quick dashboard-quick--violet"
                >
                  <UserPlus size={19} />
                  <span>Registrar paciente</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  to="/prescriptions"
                  className="dashboard-quick dashboard-quick--amber"
                >
                  <Stethoscope size={19} />
                  <span>Nueva receta</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  to="/inventory"
                  className="dashboard-quick dashboard-quick--mint"
                >
                  <Boxes size={19} />
                  <span>Inventario</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  to="/reports"
                  className="dashboard-quick dashboard-quick--soft-blue"
                >
                  <Plus size={19} />
                  <span>Ver reportes</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
};
