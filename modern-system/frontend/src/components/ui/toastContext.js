import { createContext, useContext } from "react";

/**
 * Toast context and hook, kept apart from the provider component so each
 * module exports only one kind of thing. A file that exports both a
 * component and a hook defeats React Fast Refresh.
 */
export const ToastContext = createContext(null);

/** Requires an enclosing ToastProvider; throws rather than silently no-op. */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside a ToastProvider");
  return context;
};
