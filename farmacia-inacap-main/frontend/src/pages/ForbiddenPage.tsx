import { ShieldX } from "lucide-react";
import { Link } from "react-router-dom";

export const ForbiddenPage = () => (
  <div className="message-page">
    <ShieldX size={48} />
    <h1>Acceso restringido</h1>
    <p>No tienes permisos para visualizar esta sección.</p>
    <Link className="button button--primary" to="/">
      Volver al inicio
    </Link>
  </div>
);
