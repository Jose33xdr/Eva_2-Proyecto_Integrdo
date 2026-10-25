import { Navigate, Route, Routes } from "react-router-dom";

import { PermissionRoute } from "./components/auth/PermissionRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import { useAuth } from "./context/AuthContext";
import { getDefaultAuthenticatedPath } from "./lib/access";
import { AgreementsPage } from "./pages/AgreementsPage";
import { CashPage } from "./pages/CashPage";
import { ControlledPage } from "./pages/ControlledPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DoctorsPage } from "./pages/DoctorsPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { InventoryPage } from "./pages/InventoryPage";
import { LaboratoriesPage } from "./pages/LaboratoriesPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PatientsPage } from "./pages/PatientsPage";
import { PosPage } from "./pages/PosPage";
import { PrescriptionsPage } from "./pages/PrescriptionsPage";
import { ProductsPage } from "./pages/ProductsPage";
import { PurchasesPage } from "./pages/PurchasesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SalesPage } from "./pages/SalesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UsersPage } from "./pages/UsersPage";

const HomeRoute = () => {
  const { user, hasPermission } = useAuth();

  if (!hasPermission("reports.read")) {
    return <Navigate to={getDefaultAuthenticatedPath(user)} replace />;
  }

  return <DashboardPage />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route element={<PermissionRoute permission="reports.read" />}>
            <Route index element={<HomeRoute />} />
          </Route>

          <Route element={<PermissionRoute permission="sales.create" />}>
            <Route path="/pos" element={<PosPage />} />
          </Route>

          <Route element={<PermissionRoute permission="cash.read" />}>
            <Route path="/cash" element={<CashPage />} />
          </Route>

          <Route element={<PermissionRoute permission="sales.read" />}>
            <Route path="/sales" element={<SalesPage />} />
          </Route>

          <Route element={<PermissionRoute permission="inventory.read" />}>
            <Route path="/inventory" element={<InventoryPage />} />
          </Route>

          <Route element={<PermissionRoute permission="purchases.read" />}>
            <Route path="/purchases" element={<PurchasesPage />} />
          </Route>

          <Route element={<PermissionRoute permission="products.read" />}>
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/laboratories" element={<LaboratoriesPage />} />
          </Route>

          <Route element={<PermissionRoute permission="patients.read" />}>
            <Route path="/patients" element={<PatientsPage />} />
          </Route>

          <Route element={<PermissionRoute permission="prescriptions.read" />}>
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/prescriptions" element={<PrescriptionsPage />} />
          </Route>

          <Route element={<PermissionRoute permission="controlled.read" />}>
            <Route path="/controlled" element={<ControlledPage />} />
          </Route>

          <Route element={<PermissionRoute permission="agreements.read" />}>
            <Route path="/agreements" element={<AgreementsPage />} />
          </Route>

          <Route element={<PermissionRoute permission="users.read" />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>

          <Route element={<PermissionRoute permission="reports.read" />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          <Route element={<PermissionRoute permission="settings.manage" />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
