export type NoticeTone = "success" | "error";
export type NoticeDetail = { message: string; tone: NoticeTone };

const NOTICE_EVENT = "farmagestion:notice";

/** Muestra un aviso breve (por ejemplo, "Producto guardado"). */
export const notify = (message: string, tone: NoticeTone = "success") => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<NoticeDetail>(NOTICE_EVENT, { detail: { message, tone } }),
  );
};

export const subscribeToNotices = (listener: (detail: NoticeDetail) => void) => {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    listener((event as CustomEvent<NoticeDetail>).detail);
  };
  window.addEventListener(NOTICE_EVENT, handler);
  return () => window.removeEventListener(NOTICE_EVENT, handler);
};
