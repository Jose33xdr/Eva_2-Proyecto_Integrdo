import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDefaultAuthenticatedPath } from "../../lib/access";

export const PermissionRoute = ({ permission }: { permission: string }) => {
  const { hasPermission, user } = useAuth();

  if (!hasPermission(permission)) {
    return <Navigate to={getDefaultAuthenticatedPath(user)} replace />;
  }

  return <Outlet />;
};
