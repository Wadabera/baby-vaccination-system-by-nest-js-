import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Shield,
  Baby,
  Activity,
  Heart,
  LayoutDashboard,
  Users,
  Syringe,
  Megaphone,
  PanelLeft,
  X,
  Globe,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { homeFor } from "../utils/navigation";
import { fullName } from "../utils/format";
import { Avatar } from "./ui";

const ROLE_META = {
  admin: {
    Icon: Shield,
    label: "Administrator",
    blurb: "Accounts & access",
    home: "/admin",
  },
  registrar: {
    Icon: Baby,
    label: "Registrar",
    blurb: "Mothers & children",
    home: "/registrar",
  },
  doctor: {
    Icon: Activity,
    label: "Medical staff",
    blurb: "Doses & safety",
    home: "/doctor",
  },
  parent: {
    Icon: Heart,
    label: "Parent",
    blurb: "Family progress",
    home: "/parent",
  },
};

/**
 * Destinations per role.
 *
 * Every entry resolves to a real route or in-page anchor. The overview
 * is only offered to staff: a parent has no cohort data to see, and
 * offering it would just dead-end behind the role guard.
 */
const NAV = {
  admin: [
    {
      section: "Overview",
      items: [
        {
          to: "/admin",
          label: "Administration",
          icon: LayoutDashboard,
          end: true,
        },
      ],
    },
    {
      section: "Administration",
      items: [
        { to: "/dashboard", label: "Programme analytics", icon: Activity },
        { to: "/admin#accounts", label: "Accounts & roles", icon: Users },
        { to: "/admin#announcements", label: "Announcements", icon: Megaphone },
      ],
    },
  ],
  registrar: [
    {
      section: "Overview",
      items: [
        {
          to: "/registrar",
          label: "Registrar desk",
          icon: LayoutDashboard,
          end: true,
        },
      ],
    },
  ],
  doctor: [
    {
      section: "Overview",
      items: [
        {
          to: "/doctor",
          label: "Medical centre",
          icon: LayoutDashboard,
          end: true,
        },
      ],
    },
    {
      section: "Clinical",
      items: [
        { to: "/dashboard", label: "Coverage analytics", icon: Activity },
        { to: "/doctor#worklist", label: "Safety worklist", icon: Shield },
      ],
    },
  ],
  parent: [
    {
      section: "My family",
      items: [
        {
          to: "/parent",
          label: "Children & schedule",
          icon: LayoutDashboard,
          end: true,
        },
      ],
    },
  ],
};

/**
 * Dashboard chrome: a persistent sidebar with role-appropriate
 * destinations, plus the mobile drawer.
 *
 * The public pages (home, login, register) keep the plain top navbar;
 * this shell is what makes the signed-in screens feel like an
 * application rather than a page with a header.
 */
const AppShell = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Navigating should always dismiss the drawer, otherwise it stays
  // over the page the user just asked for.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  // Swipe left to dismiss the drawer. Expected behaviour on a phone, and
  // tapping the backdrop alone is easy to miss. Starts are only tracked
  // near the left edge so a horizontal scroll inside the drawer is not
  // hijacked.
  const touchStartX = useRef(0);

  const onTouchStart = (event) => {
    const touch = event.touches[0];
    touchStartX.current =
      touch.clientX < 48 ? touch.clientX : Number.NEGATIVE_INFINITY;
  };

  const onTouchEnd = (event) => {
    if (touchStartX.current === Number.NEGATIVE_INFINITY) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (delta < -60) setOpen(false);
    touchStartX.current = Number.NEGATIVE_INFINITY;
  };

  if (!user) return children;

  const meta = ROLE_META[user.role] ?? ROLE_META.parent;
  const groups = NAV[user.role] ?? NAV.parent;
  const name = fullName(user) || user.email;

  return (
    <div className="shell">
      {/* Backdrop for the mobile drawer only. */}
      <AnimatePresence>
        {open && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="fixed inset-x-0 bottom-0 z-40 cursor-default bg-slate-950/40 backdrop-blur-sm lg:hidden"
            style={{ top: "var(--nav-h, 4.5rem)" }}
          />
        )}
      </AnimatePresence>

      <aside
        data-open={open}
        className="shell-sidebar"
        aria-label="Section navigation"
        id="app-sidebar"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex h-full flex-col p-4">
          {/* Identity block doubles as the mobile drawer header. */}
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <Avatar name={name} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {name}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-muted">
                <meta.Icon size={11} /> {meta.label}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="btn-touch shrink-0 rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-5">
            {groups.map((group) => (
              <div key={group.section}>
                <p className="nav-section-label">{group.section}</p>
                <ul className="space-y-0.5">
                  {group.items.map(({ to, label, icon: Icon, end }) => {
                    const [path, hash] = to.split("#");
                    // A hash link only counts as current when that exact
                    // fragment is active. Without this, `/admin#accounts`
                    // and `/admin#announcements` would both highlight
                    // alongside `/admin`, since they share a pathname.
                    const active = hash
                      ? location.pathname === path &&
                        location.hash === `#${hash}`
                      : location.pathname === path &&
                        !location.hash &&
                        (end
                          ? true
                          : !NAV[user.role].some((g) =>
                              g.items.some(
                                (i) =>
                                  i.to.split("#")[0] === path &&
                                  i.to.includes("#"),
                              ),
                            ));

                    return (
                      <li key={to}>
                        <Link
                          to={to}
                          aria-current={active ? "page" : undefined}
                          className="nav-item"
                          onClick={() => {
                            // Same-page fragments need an explicit scroll;
                            // the router only jumps on a path change.
                            if (hash) {
                              setOpen(false);
                              requestAnimationFrame(() => {
                                document.getElementById(hash)?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                              });
                            }
                          }}
                        >
                          <Icon size={17} className="shrink-0" />
                          <span className="truncate">{label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-5 space-y-2 border-t border-slate-200 pt-4">
            <Link to={homeFor(user.role)} className="nav-item">
              <LayoutDashboard size={17} /> My dashboard
            </Link>
            <Link to="/" className="nav-item">
              <Globe size={17} /> Public site
            </Link>
            <p className="px-3 pt-2 text-xs leading-relaxed text-slate-400">
              {meta.blurb}
            </p>
          </div>
        </div>
      </aside>

      <div className="shell-main">
        {/* Drawer trigger, desktop-hidden. Kept in the main column so it
            sits in the reading order after the sidebar. */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-controls="app-sidebar"
          aria-expanded={open}
          className="btn-touch mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary active:scale-95 lg:hidden"
        >
          <PanelLeft size={16} /> Menu
        </button>

        {children}
      </div>
    </div>
  );
};

/** Small icon button used by page headers for secondary actions. */
export const ShellAction = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-primary/40 hover:text-primary active:scale-95"
  >
    <Icon size={17} />
  </button>
);

export { Syringe };
export default AppShell;
