import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageLoader } from "../feedback/PageLoader";

export const ProtectedRoute = () => {
  const { authenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader label="Cargando sesión..." />;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
