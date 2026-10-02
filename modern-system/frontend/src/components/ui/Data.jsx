import { motion } from "framer-motion";
import { useId, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Syringe,
  Sparkles,
} from "lucide-react";
import { formatDate } from "../../utils/format";

/* ------------------------------------------------------------------ *
 * Data visualisation primitives
 *
 * The schedule is the centre of this product, so it gets first-class
 * components: a vertical timeline for a dose schedule and a ring for
 * coverage. Both animate on mount because a static list of 15 rows gives
 * no sense of how far along a child is.
 * ------------------------------------------------------------------ */

const DOSE_VISUALS = {
  completed: {
    Icon: CheckCircle2,
    ring: "border-emerald-500",
    fill: "bg-emerald-500",
    text: "text-emerald-700",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  overdue: {
    Icon: AlertTriangle,
    ring: "border-rose-500",
    fill: "bg-rose-500",
    text: "text-rose-700",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
  },
  pending: {
    Icon: Clock,
    ring: "border-amber-400",
    fill: "bg-amber-400",
    text: "text-amber-700",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
  },
  missed: {
    Icon: Circle,
    ring: "border-slate-300",
    fill: "bg-slate-300",
    text: "text-slate-600",
    chip: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const FALLBACK = DOSE_VISUALS.pending;

/**
 * Vertical dose timeline.
 *
 * The connecting rail is drawn by the container rather than each row so
 * it stays continuous regardless of how many doses a child has. Rows
 * stagger in from the left so the eye is led down the schedule.
 *
 * `action` receives the dose and renders on the right, which is how the
 * doctor screen attaches a "Record" button to outstanding doses.
 */
export const DoseTimeline = ({
  schedule = [],
  action,
  emptyMessage = "No schedule generated yet.",
}) => {
  if (!schedule.length) {
    return (
      <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>
    );
  }

  return (
    <ol className="relative space-y-1" role="list">
      {/* Rail. inset-inline keeps it aligned with the marker column
          regardless of list padding. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-4 left-[17px] w-0.5 rounded-full bg-gradient-to-b from-emerald-200 via-amber-200 to-slate-200 sm:left-[19px]"
      />

      {schedule.map((dose, index) => {
        const visuals = DOSE_VISUALS[dose.status] ?? FALLBACK;
        const { Icon } = visuals;
        const isLast = index === schedule.length - 1;

        return (
          <motion.li
            key={`${dose.vaccineName}-${dose.dueDate}`}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: Math.min(index * 0.045, 0.6),
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group relative flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-1 py-2.5 transition-colors hover:bg-slate-50/80 sm:flex-nowrap sm:gap-4"
          >
            <span
              className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-[3px] bg-white shadow-sm transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10 ${visuals.ring}`}
            >
              <Icon
                size={16}
                className={visuals.fill.replace("bg-", "text-")}
              />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900">
                  {dose.vaccineName}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide ${visuals.chip}`}
                >
                  {dose.status}
                </span>
                {dose.status === "completed" && dose.batchNumber && (
                  <span className="font-mono text-[0.6875rem] text-muted">
                    {dose.batchNumber}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {dose.status === "completed" && dose.givenDate
                  ? `Given ${formatDate(dose.givenDate)}`
                  : `Due ${formatDate(dose.dueDate)}`}
              </p>
            </div>

            {action?.(dose) && (
              <div className="shrink-0 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
                {action(dose)}
              </div>
            )}

            {/* Keeps the last rail segment from overshooting the final
                marker on long schedules. */}
            {!isLast && (
              <span className="sr-only">followed by the next dose</span>
            )}
          </motion.li>
        );
      })}
    </ol>
  );
};

/**
 * Circular coverage indicator.
 *
 * `pathLength` normalises the stroke maths, so the same `percent` works
 * at any size without recalculating a circumference.
 */
export const CoverageRing = ({
  percent = 0,
  size = 168,
  thickness = 12,
  label,
  sublabel,
  tone = "auto",
}) => {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(percent, 100));

  // Colour by completion so the ring itself carries the signal, with
  // `tone` available for callers that want a fixed brand colour.
  const stroke =
    tone === "auto"
      ? clamped >= 100
        ? "var(--color-accent)"
        : clamped >= 50
          ? "var(--color-primary)"
          : "var(--color-role-registrar)"
      : tone;

  const gradientId = useId();

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(clamped)} percent complete. ${label ?? ""}`.trim()}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.65" />
            <stop offset="100%" stopColor={stroke} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-100"
          strokeWidth={thickness}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - (clamped / 100) * circumference,
          }}
          transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 4px 12px ${stroke}55)` }}
        />
      </svg>

      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="text-4xl font-extrabold tracking-tight text-slate-900">
          {Math.round(clamped)}
          <span className="text-xl text-muted">%</span>
        </span>
        {label && (
          <span className="mt-1 text-xs font-semibold text-muted">{label}</span>
        )}
        {sublabel && (
          <span className="mt-0.5 text-xs font-bold text-slate-700">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Horizontal dose-distribution bars.
 *
 * Replaces the inline `flex` + percentage-width divs the overview page
 * used. Segments animate from zero so a change in coverage is visible
 * rather than silently re-coloured.
 */
export const StackedBars = ({ rows = [], valueKey = "value", max }) => {
  // Spread needs parentheses: `a ?? ...b` is a parse error because `??`
  // cannot be mixed with a spread in the same expression.
  const ceiling = Math.max(
    1,
    max ?? Math.max(0, ...rows.map((row) => row[valueKey] ?? 0)),
  );

  return (
    <ul className="space-y-4" role="list">
      {rows.map((row, index) => {
        const segments = row.segments ?? [];
        return (
          <li key={row.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-slate-800">{row.label}</span>
              <span className="shrink-0 text-xs font-medium text-muted">
                {row.hint ?? `${row[valueKey] ?? 0} total`}
              </span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              {segments.map((segment, segIndex) => (
                <motion.span
                  key={segment.label}
                  className={`h-full ${segment.colour}`}
                  title={`${segment.label}: ${segment.value}`}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(segment.value / ceiling) * 100}%`,
                  }}
                  transition={{
                    delay: index * 0.06 + segIndex * 0.04,
                    duration: 0.8,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/**
 * Segmented control for switching a view in place.
 *
 * The active pill slides between items via a shared `layoutId` so the
 * change reads as movement rather than a repaint. Buttons keep real
 * `role="tab"` semantics and arrow-key support.
 */
export const Segmented = ({ items = [], value, onChange, className = "" }) => {
  const [focusIndex, setFocusIndex] = useState(0);

  const onKeyDown = (event) => {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (focusIndex + delta + items.length) % items.length;
    setFocusIndex(next);
    onChange(items[next].value);
    // Keep the newly selected tab focused so arrow keys keep working.
    event.currentTarget.querySelectorAll("button")[next]?.focus();
  };

  return (
    <div
      role="tablist"
      onKeyDown={onKeyDown}
      // Scrolls horizontally on a phone rather than wrapping or forcing the
      // page wider. `w-full` + `overflow-x-auto` keeps the pill animation
      // intact because the item elements are the animated children.
      className={`no-scrollbar -mx-1 flex max-w-full gap-1 overflow-x-auto rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur ${className}`}
    >
      {items.map((item, index) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => {
              setFocusIndex(index);
              onChange(item.value);
            }}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors duration-200 sm:px-4 sm:text-sm ${
              active ? "text-white" : "text-muted hover:text-slate-800"
            }`}
          >
            {active && (
              <motion.span
                layoutId="segmented-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary-dark shadow-md shadow-primary/25"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {item.icon && <item.icon size={15} />}
              {item.label}
              {item.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[0.625rem] ${
                    active ? "bg-white/25" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Compact distribution of dose statuses for a whole schedule.
 *
 * A single glance at "how is this child doing" without reading 15 rows.
 */
export const DoseSummary = ({ schedule = [] }) => {
  const counts = schedule.reduce(
    (acc, dose) => {
      acc[dose.status] = (acc[dose.status] ?? 0) + 1;
      return acc;
    },
    { completed: 0, pending: 0, overdue: 0, missed: 0 },
  );

  const order = ["completed", "overdue", "pending", "missed"];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {order.map((status, index) => {
        const visuals = DOSE_VISUALS[status];
        const Icon = visuals.Icon;
        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white/70 p-2.5 sm:gap-3 sm:p-3"
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl sm:h-9 sm:w-9 ${visuals.chip}`}
            >
              <Icon size={15} className="sm:hidden" />
              <Icon size={16} className="hidden sm:block" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-none text-slate-900 sm:text-xl">
                {counts[status] ?? 0}
              </p>
              <p className="mt-0.5 truncate text-[0.625rem] font-bold uppercase tracking-wide text-muted sm:text-[0.6875rem]">
                {status}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

/**
 * Callout used for the "no records yet" states the dashboards show
 * before anything has been registered. Distinct from `EmptyState` in
 * that it fills its container rather than being a dashed drop target.
 */
export const OnboardingHint = ({
  icon: Icon = Sparkles,
  title,
  children,
  action,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className="stripe-soft flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 px-6 py-14 text-center"
  >
    {Icon && (
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon size={30} />
      </span>
    )}
    <div>
      <p className="text-lg font-bold text-slate-800">{title}</p>
      {children && (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</p>
      )}
    </div>
    {action}
  </motion.div>
);

/** Re-exported so pages can build a timeline without a second icon import. */
export { Syringe };
