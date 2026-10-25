import { PackageOpen } from "lucide-react";

export const EmptyState = ({
  title = "Sin registros",
  description = "Todavía no hay información disponible.",
}: {
  title?: string;
  description?: string;
}) => (
  <div className="empty-state">
    <PackageOpen size={34} strokeWidth={1.6} />
    <strong>{title}</strong>
    <span>{description}</span>
  </div>
);
