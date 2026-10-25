import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { subscribeToNotices, type NoticeTone } from "../../lib/notify";
import "../ui/ui.module.css";

type Notice = { id: number; message: string; tone: NoticeTone };

const NOTICE_DURATION_MS = 5000;

/** Muestra avisos breves, por ejemplo "Producto guardado correctamente". */
export const NoticeHost = () => {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    let nextId = 1;
    return subscribeToNotices(({ message, tone }) => {
      const id = nextId++;
      setNotices((current) => [...current.slice(-2), { id, message, tone }]);
      window.setTimeout(() => {
        setNotices((current) => current.filter((notice) => notice.id !== id));
      }, NOTICE_DURATION_MS);
    });
  }, []);

  return (
    <div className="notice-host" role="status" aria-live="polite">
      {notices.map((notice) => (
        <div className={`notice notice--${notice.tone}`} key={notice.id}>
          {notice.tone === "success" ? (
            <CircleCheck size={18} aria-hidden="true" />
          ) : (
            <CircleAlert size={18} aria-hidden="true" />
          )}
          <span>{notice.message}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() =>
              setNotices((current) => current.filter((item) => item.id !== notice.id))
            }
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};
