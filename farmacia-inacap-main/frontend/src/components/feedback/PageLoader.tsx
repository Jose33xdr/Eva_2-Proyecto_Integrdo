export const PageLoader = ({ label = "Cargando..." }: { label?: string }) => (
  <div className="page-loader" role="status" aria-live="polite">
    <div className="spinner" />
    <span>{label}</span>
  </div>
);
