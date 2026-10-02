import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  Search,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Primitives
 *
 * Small building blocks shared by every page: animated mount/unmount,
 * skeletons for loading and a toast surface. Keeping them here means the
 * dashboards stay readable and the motion stays consistent.
 * ------------------------------------------------------------------ */

/**
 * Reads the new value out of whatever `Field`'s `onChange` was called
 * with. The documented input is a string; an object with a `target` is
 * tolerated so a caller that reaches for `event.target` gets the right
 * answer instead of an exception mid-form.
 */
const valueFromChange = (arg) =>
  typeof arg === "object" && arg !== null && "target" in arg
    ? arg.target.value
    : arg;

/** Fade-and-rise on mount. */
export const Reveal = ({ children, delay = 0, y = 16, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

/** Scale-in card, used for dashboard summary tiles. */
export const Pop = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.94 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

/** Counts up to `value` once it enters the viewport. */
export const CountUp = ({ value, duration = 1.1 }) => {
  const target = Number.isFinite(Number(value)) ? Number(value) : 0;
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || done.current) return;
        done.current = true;

        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / (duration * 1000), 1);
          // easeOutExpo: fast start, gentle settle.
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          setDisplay(Math.round(target * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target, duration]);

  // A changed target after the first animation should re-count.
  useEffect(() => {
    done.current = false;
    setDisplay(0);
  }, [target]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
};

export const Skeleton = ({ className = "h-5 w-full" }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

export const Spinner = ({ size = 28, label = "Loading" }) => (
  <div
    className="flex flex-col items-center justify-center gap-3 py-12"
    role="status"
  >
    <Loader2 className="animate-spin text-primary" size={size} />
    <span className="sr-only">{label}</span>
  </div>
);

export const Alert = ({ kind = "error", children }) => {
  const map = {
    error: {
      cls: "bg-rose-50 text-rose-700 border-rose-200",
      Icon: AlertCircle,
    },
    success: {
      cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
      Icon: CheckCircle2,
    },
    info: { cls: "bg-sky-50 text-sky-800 border-sky-200", Icon: Info },
  };
  const { cls, Icon } = map[kind] ?? map.error;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm font-medium ${cls}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <span className="flex-1">{children}</span>
    </motion.div>
  );
};

/**
 * Labeled form field.
 *
 * The dashboards each had their own `Field` helper with a `<label>`
 * wrapping the input and no `htmlFor`, so the association only worked
 * by nesting. This generates the ids and wires them properly, which
 * makes clicking the label focus the input and screen readers announce
 * the right name.
 *
 * CONTRACT: `onChange` receives the new **value as a string**, matching a
 * plain `useState` setter. It does not receive an event. `valueFromChange`
 * below still accepts an event-shaped argument as a safety net, because a
 * caller passing the wrong shape otherwise throws on every keystroke and
 * takes the whole form down with it — which is exactly what happened on
 * the registration page.
 */
export const Field = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  hint,
  error,
  icon: Icon,
  className = "",
  ...rest
}) => {
  const id = useId();
  const hintId = hint || error ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 ml-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700"
        >
          {Icon && <Icon size={15} className="text-primary" />}
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          type={type}
          className={`input ${Icon ? "pl-11" : ""}`}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(valueFromChange(event.target.value))}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={hintId}
          {...rest}
        />
      </div>

      {(hint || error) && (
        <p
          id={hintId}
          className={`mt-1.5 ml-1 text-xs ${error ? "font-semibold text-rose-600" : "text-muted"}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
};

/**
 * Search input with a clear button.
 *
 * Several screens filter a list as you type. Clearing via a button beats
 * selecting the text and deleting it, and the button only appears once
 * there is something to clear.
 */
export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search…",
  label,
}) => (
  <div className="relative">
    <Search
      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
      size={17}
      aria-hidden="true"
    />
    <input
      type="search"
      aria-label={label ?? placeholder}
      className="input pl-11 pr-11"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label="Clear search"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-90"
      >
        <X size={15} />
      </button>
    )}
  </div>
);

/**
 * Accessible modal: focus moves in on open, Escape closes, the page
 * behind is locked from scrolling, and focus returns to the trigger.
 */
export const Modal = ({
  open,
  onClose,
  title,
  children,
  size = "max-w-2xl",
}) => {
  const panelRef = useRef(null);
  const restoreTo = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    restoreTo.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);

    // Focus the panel rather than the first input: announcing the title
    // first is more useful than dropping the user mid-form.
    const timer = setTimeout(() => panelRef.current?.focus(), 30);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      clearTimeout(timer);
      if (restoreTo.current instanceof HTMLElement) restoreTo.current.focus();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={`relative my-auto w-full ${size} outline-none`}
          >
            <div className="glass overflow-hidden rounded-3xl border border-white shadow-2xl">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 bg-white/60 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-y-auto bg-white/70 p-6">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

/** Expand/collapse panel used for inline create forms. */
export const Collapse = ({ open, children }) => (
  <AnimatePresence initial={false}>
    {open && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="pt-6">{children}</div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const Accordion = ({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden !p-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-6 py-5 text-left font-bold transition hover:bg-slate-50/70"
      >
        {Icon && <Icon size={19} className="shrink-0 text-primary" />}
        <span className="flex-1">{title}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <Collapse open={open}>
        <div className="border-t border-slate-100 px-6 pb-6 pt-5">
          {children}
        </div>
      </Collapse>
    </div>
  );
};

/** Animated empty state; `action` renders on the right. */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center"
  >
    {Icon && (
      <div className="animate-float rounded-2xl bg-primary/10 p-4 text-primary">
        <Icon size={36} />
      </div>
    )}
    <div>
      <p className="text-lg font-bold text-slate-800">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          {description}
        </p>
      )}
    </div>
    {action}
  </motion.div>
);

/**
 * Animated route transitions.
 *
 * Keyed on `location.pathname` so React unmounts the old page before
 * mounting the new one, which is what lets `AnimatePresence` run an
 * exit animation. Without the exit the new page simply replaces the old
 * one and the transition reads as a flicker.
 */
export const PageTransition = ({ children }) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.div
      key={useLocation().pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

/** Returns to the top of the page whenever the route changes. */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
};
