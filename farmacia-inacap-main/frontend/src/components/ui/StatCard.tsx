import type { LucideIcon } from "lucide-react";
import "./ui.module.css";

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
}) => (
  <article className="stat-card">
    <div className="stat-card__icon">
      <Icon size={22} />
    </div>
    <div className="stat-card__content">
      <span className="stat-card__title">{title}</span>
      <strong className="stat-card__value">{value}</strong>
      {subtitle ? <small>{subtitle}</small> : null}
    </div>
  </article>
);
