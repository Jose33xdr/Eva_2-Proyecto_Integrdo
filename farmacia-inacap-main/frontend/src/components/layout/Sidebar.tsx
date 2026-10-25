import {
  Pill,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { navigation } from "./navigation";
import "./layout.module.css";

export const Sidebar = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { hasPermission } = useAuth();

  return (
    <>
      <button
        type="button"
        className={`sidebar-backdrop ${
          open ? "sidebar-backdrop--visible" : ""
        }`}
        onClick={onClose}
        aria-label="Cerrar menú"
      />

      <aside
        className={[
          "sidebar",
          open ? "sidebar--open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="sidebar__brand">
          <NavLink
            to="/"
            className="sidebar__brand-link"
            onClick={onClose}
            title="FarmaGestión"
          >
            <div className="sidebar__brand-full">
              <img
                src="/logo-farma.png"
                alt="FarmaGestión"
                className="sidebar__brand-logo"
              />
            </div>

            <div className="sidebar__brand-compact" aria-hidden="true">
              <Pill size={22} strokeWidth={2.1} />
            </div>
          </NavLink>

          <button
            type="button"
            className="sidebar__mobile-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Navegación principal">
          {navigation.map((section) => {
            const visibleItems = section.items.filter((item) =>
              hasPermission(item.permission),
            );

            if (!visibleItems.length) {
              return null;
            }

            return (
              <section className="sidebar__section" key={section.label}>
                <span className="sidebar__section-title">
                  {section.label}
                </span>

                <div className="sidebar__section-items">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/"}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `sidebar__link ${
                            isActive ? "sidebar__link--active" : ""
                          }`
                        }
                      >
                        <span className="sidebar__link-icon">
                          <Icon size={18} strokeWidth={1.9} />
                        </span>

                        <span className="sidebar__link-label">
                          {item.label}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </nav>
      </aside>
    </>
  );
};