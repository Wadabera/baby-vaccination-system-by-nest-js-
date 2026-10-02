import { useId, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { CountUp, Skeleton } from "../ui/Primitives";

/**
 * Dashboard summary tile.
 *
 * `tone` picks the accent so each metric keeps a stable colour across
 * pages instead of the whole row being one blue.
 */
export const StatCard = ({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  loading = false,
  index = 0,
}) => {
  const tones = {
    primary: "from-primary/20 to-primary/5 text-primary",
    admin: "from-role-admin/20 to-role-admin/5 text-role-admin",
    registrar: "from-role-registrar/20 to-role-registrar/5 text-role-registrar",
    doctor: "from-role-doctor/20 to-role-doctor/5 text-role-doctor",
    parent: "from-role-parent/20 to-role-parent/5 text-role-parent",
    accent: "from-accent/20 to-accent/5 text-accent",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.07,
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="card tile-hover glow-border group"
    >
      {/* Accent bar that grows on hover. Always visible on touch, where
          there is no hover to reveal it. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-accent transition-transform duration-500 group-hover:scale-x-100 max-sm:scale-x-100"
      />

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 truncate text-xs font-semibold text-muted sm:text-sm">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {typeof value === "number" ? (
                <CountUp value={value} />
              ) : (
                (value ?? "—")
              )}
            </p>
          )}
          {hint && (
            <p className="mt-1.5 flex items-center gap-1 text-[0.6875rem] font-medium text-accent sm:text-xs">
              <TrendingUp size={12} /> {hint}
            </p>
          )}
        </div>

        {Icon && (
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12 ${tones[tone] ?? tones.primary}`}
          >
            <Icon size={20} className="sm:hidden" />
            <Icon size={23} className="hidden sm:block" />
          </span>
        )}
      </div>
    </motion.div>
  );
};

/** Page heading with an optional action on the right. */
export const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  tone = "primary",
  action,
}) => (
  // `stack-on-mobile` drops the action below the heading on a phone,
  // where side-by-side leaves neither enough room.
  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8 sm:gap-5">
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      {Icon && (
        <motion.span
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br shadow-lg sm:h-14 sm:w-14 ${TONES[tone]}`}
        >
          <Icon size={22} className="sm:hidden" />
          <Icon size={27} className="hidden sm:block" />
        </motion.span>
      )}
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-3xl md:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm font-medium text-balance text-muted">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {action && <div className="w-full sm:w-auto">{action}</div>}
  </div>
);

const TONES = {
  primary: "from-primary to-primary-dark shadow-primary/25 text-white",
  admin: "from-role-admin to-rose-700 shadow-role-admin/25 text-white",
  registrar:
    "from-role-registrar to-amber-600 shadow-role-registrar/25 text-white",
  doctor: "from-role-doctor to-emerald-600 shadow-role-doctor/25 text-white",
  parent: "from-role-parent to-blue-700 shadow-role-parent/25 text-white",
};

/**
 * Card with a heading row.
 *
 * Every dashboard repeats the same "icon, title, optional subtitle,
 * optional action, then content" shape. This takes care of the heading
 * and leaves the children free to be anything.
 */
export const SectionCard = ({
  title,
  subtitle,
  icon: Icon,
  tone = "primary",
  action,
  className = "",
  bodyClassName = "",
  children,
}) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className={`card ${className}`}
  >
    {(title || action) && (
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4 sm:mb-6">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br shadow-lg sm:h-11 sm:w-11 ${TONES[tone]}`}
            >
              <Icon size={19} className="sm:hidden" />
              <Icon size={20} className="hidden sm:block" />
            </span>
          )}
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-muted sm:text-sm">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="w-full sm:w-auto">{action}</div>}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </motion.section>
);

/** Initials avatar with a deterministic gradient per name. */
export const Avatar = ({ name = "", size = 40, className = "" }) => {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  // Hashing the name keeps a person's colour stable between renders and
  // between pages, instead of a single colour for every avatar.
  const palette = [
    "from-primary to-primary-dark",
    "from-role-doctor to-emerald-600",
    "from-role-registrar to-amber-600",
    "from-role-parent to-blue-700",
    "from-role-admin to-rose-700",
  ];
  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = palette[hash % palette.length];

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-extrabold text-white shadow-sm ${gradient} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
};

/**
 * Hover/focus tooltip.
 *
 * The label is always in the DOM and linked with `aria-describedby`, so
 * it is available to assistive tech rather than being a mouse-only
 * affordance. Position is one of top / bottom / left / right.
 */
export const Tooltip = ({ label, children, side = "top", className = "" }) => {
  const [open, setOpen] = useState(false);
  const id = useId();

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <span
        id={id}
        role="tooltip"
        aria-hidden={!open}
        className={`pointer-events-none absolute z-50 w-max max-w-[16rem] rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-xl transition-all duration-200 ${
          positions[side]
        } ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        {label}
      </span>
    </span>
  );
};

/** Animated progress bar; colour reflects completion. */
export const ProgressBar = ({ percent = 0, tone = "auto", className = "" }) => {
  const colour =
    tone === "auto"
      ? percent >= 100
        ? "bg-accent"
        : percent >= 50
          ? "bg-primary"
          : "bg-role-registrar"
      : tone;

  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percent, 100)}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full ${colour}`}
      />
    </div>
  );
};
