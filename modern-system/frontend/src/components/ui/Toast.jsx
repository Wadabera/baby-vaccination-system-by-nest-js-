import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { ToastContext } from "./toastContext";

/**
 * Toast surface.
 *
 * Success messages replace the previous inline "notice" banners: they
 * confirm an action without pushing the table down the page. Errors stay
 * inline where the user was looking, so `notify` is for confirmations.
 *
 * Only the provider is exported from here; `useToast` lives in
 * `toastContext.js` to keep Fast Refresh working.
 */

const KINDS = {
  success: {
    cls: "border-emerald-200 bg-white text-emerald-800",
    Icon: CheckCircle2,
    bar: "bg-emerald-500",
  },
  error: {
    cls: "border-rose-200 bg-white text-rose-800",
    Icon: AlertCircle,
    bar: "bg-rose-500",
  },
  info: {
    cls: "border-sky-200 bg-white text-sky-800",
    Icon: Info,
    bar: "bg-sky-500",
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (message, kind = "success", duration = 4000) => {
      // Keyed by a monotonic counter: two identical messages in a row
      // should stack, not silently replace each other.
      const id = Date.now() + Math.random();
      setToasts((list) => [...list.slice(-2), { id, message, kind }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map(({ id, message, kind }) => {
            const { cls, Icon, bar } = KINDS[kind] ?? KINDS.info;
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                role={kind === "error" ? "alert" : "status"}
                className={`pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl border py-3.5 pl-4 pr-3 shadow-xl ${cls}`}
              >
                <span
                  className={`absolute inset-y-0 left-0 w-1 ${bar}`}
                  aria-hidden="true"
                />
                <Icon size={19} className="mt-0.5 shrink-0" />
                <p className="flex-1 text-sm font-medium">{message}</p>
                <button
                  onClick={() => dismiss(id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 rounded-full p-1 transition hover:bg-black/5 active:scale-90"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
