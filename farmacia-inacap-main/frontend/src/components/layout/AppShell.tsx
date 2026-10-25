import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { NoticeHost } from "../feedback/NoticeHost";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import "./layout.module.css";

export const AppShell = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="app-shell">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="app-shell__workspace">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />

        <main className="app-content">
          <Outlet />
        </main>
      </div>

      <NoticeHost />
    </div>
  );
};