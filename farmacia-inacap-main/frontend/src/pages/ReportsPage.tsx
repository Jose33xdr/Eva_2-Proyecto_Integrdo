import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  PackageSearch,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { api, getApiErrorMessage } from "../lib/api";
import { PageHeader } from "../components/ui/PageHeader";

export const ReportsPage = () => {
  const { hasPermission } = useAuth();
  const canExport = hasPermission("reports.export");
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const download = async (path: string, filename: string) => {
    if (!canExport) return;

    setDownloadError("");
    setDownloading(path);

    try {
      const response = await api.get<Blob>(path, {
        responseType: "blob",
      });

      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      setDownloadError(
        getApiErrorMessage(error) || "No fue posible descargar el reporte",
      );
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Análisis"
        title="Reportes"
        description="Descarga información operacional para análisis y respaldo."
      />

      {downloadError ? (
        <div className="alert alert--error">{downloadError}</div>
      ) : null}

      <section className="reports-v2__intro">
        <div>
          <span className="reports-v2__intro-icon">
            <ShieldCheck size={22} />
          </span>
          <div>
            <strong>Centro de reportes</strong>
            <p>
              Exporta información de ventas e inventario en formatos listos para
              análisis, respaldo y auditoría.
            </p>
          </div>
        </div>
      </section>

      <section className="reports-v2__grid">
        <article className="report-card report-card--v2">
          <div className="report-card__top">
            <span className="report-card__icon">
              <ReceiptText size={22} />
            </span>
            <span className="report-card__tag">Comercial</span>
          </div>

          <h2>Reporte de ventas</h2>
          <p>Ventas, vendedor, paciente, descuentos y coberturas.</p>

          <div className="report-card__meta">
            <span>Formatos disponibles</span>
            <strong>Excel · PDF</strong>
          </div>

          {canExport ? (
            <div className="report-card__actions">
              <button
                className="button button--secondary"
                disabled={downloading !== null}
                onClick={() =>
                  void download("/reports/sales.xlsx", "reporte-ventas.xlsx")
                }
              >
                <FileSpreadsheet size={17} />
                Excel
              </button>

              <button
                className="button button--secondary"
                disabled={downloading !== null}
                onClick={() =>
                  void download("/reports/sales.pdf", "reporte-ventas.pdf")
                }
              >
                <FileText size={17} />
                PDF
              </button>
            </div>
          ) : null}
        </article>

        <article className="report-card report-card--v2">
          <div className="report-card__top">
            <span className="report-card__icon">
              <PackageSearch size={22} />
            </span>
            <span className="report-card__tag">Inventario</span>
          </div>

          <h2>Reporte de inventario</h2>
          <p>Stock, categoría, laboratorio y productos en nivel crítico.</p>

          <div className="report-card__meta">
            <span>Formato disponible</span>
            <strong>Excel</strong>
          </div>

          {canExport ? (
            <div className="report-card__actions">
              <button
                className="button button--secondary"
                disabled={downloading !== null}
                onClick={() =>
                  void download(
                    "/reports/inventory.xlsx",
                    "reporte-inventario.xlsx",
                  )
                }
              >
                <Download size={17} />
                Excel
              </button>
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
};
