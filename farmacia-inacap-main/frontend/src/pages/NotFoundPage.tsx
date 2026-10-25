import { SearchX } from "lucide-react";
import { Link } from "react-router-dom";

export const NotFoundPage = () => (
  <div className="message-page">
    <SearchX size={48} />
    <h1>Página no encontrada</h1>
    <p>La ruta solicitada no existe.</p>
    <Link className="button button--primary" to="/">
      Volver al inicio
    </Link>
  </div>
);
