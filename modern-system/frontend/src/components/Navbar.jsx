import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LogOut,
  Heart,
  Baby,
  Activity,
  Home as HomeIcon,
  Shield,
  Menu,
  X,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { homeFor } from "../utils/navigation";
import { fullName } from "../utils/format";
import { Avatar } from "./ui";

const ROLE_META = {
  admin: {
    Icon: Shield,
    label: "Admin",
    ring: "group-hover:border-role-admin/40",
  },
  registrar: {
    Icon: Baby,
    label: "Registrar",
    ring: "group-hover:border-role-registrar/40",
  },
  doctor: {
    Icon: Activity,
    label: "Medical",
    ring: "group-hover:border-role-doctor/40",
  },
  parent: {
    Icon: Heart,
    label: "Parent Portal",
    ring: "group-hover:border-role-parent/40",
  },
};

/** One nav item, shared by the desktop bar and the mobile drawer. */
const NavItem = ({ to, active, icon: Icon, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
      active ? "text-primary" : "text-slate-600 hover:text-primary"
    }`}
  >
    {active && (
      <motion.span
        layoutId="nav-active"
        className="absolute inset-0 -z-10 rounded-xl bg-primary/10 ring-1 ring-primary/20"
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      />
    )}
    <Icon size={17} />
    <span className="hidden sm:inline">{children}</span>
  </Link>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null);

  // Publish the real header height as `--nav-h`. The header shrinks on
  // scroll, so anything offset below it (the sidebar, the mobile drawer,
  // scroll-margin on anchors) has to follow rather than assume a value.
  useLayoutEffect(() => {
    const node = headerRef.current;
    if (!node) return undefined;

    const publish = () => {
      document.documentElement.style.setProperty(
        "--nav-h",
        `${Math.round(node.getBoundingClientRect().height)}px`,
      );
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Close the mobile drawer on navigation, otherwise it stays over the
  // page the user just asked for.
  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // The header condenses once the page scrolls so it does not eat the
  // viewport on the long schedule pages.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const role = user ? ROLE_META[user.role] : null;
  const RoleIcon = role?.Icon;
  const dashboardPath = user ? homeFor(user.role) : null;
  const onDashboard =
    dashboardPath && location.pathname.startsWith(dashboardPath);
  const name = user ? fullName(user) || user.email : "";

  const links = (
    <>
      <NavItem to="/" active={location.pathname === "/"} icon={HomeIcon}>
        Home
      </NavItem>

      {user && (
        <NavItem to={dashboardPath} active={onDashboard} icon={RoleIcon}>
          {role.label}
        </NavItem>
      )}
    </>
  );

  const account = user ? (
    <div className="relative">
      <button
        onClick={() => setAccountOpen((v) => !v)}
        aria-expanded={accountOpen}
        aria-haspopup="menu"
        className={`group flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2 transition hover:bg-white/70 sm:gap-2.5 ${role.ring}`}
      >
        <Avatar name={name} size={34} />
        <span className="hidden max-w-[9rem] truncate text-sm font-semibold text-slate-700 md:block">
          {name}
        </span>
        <ChevronDown
          size={15}
          className={`hidden text-slate-400 transition-transform duration-200 md:block ${
            accountOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {accountOpen && (
          <>
            {/* Click-away layer. Sits behind the panel so it never
                intercepts clicks on the menu itself. */}
            <button
              aria-label="Close account menu"
              onClick={() => setAccountOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="glass absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-white p-2 shadow-2xl"
            >
              <div className="border-b border-slate-200/70 px-3 py-2.5">
                <p className="truncate font-bold text-slate-900">{name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
                <span className="badge badge-info mt-2">
                  <RoleIcon size={11} /> {role.label}
                </span>
              </div>

              <Link
                to={dashboardPath}
                role="menuitem"
                onClick={() => setAccountOpen(false)}
                className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-primary/10 hover:text-primary"
              >
                <RoleIcon size={16} /> Go to dashboard
              </Link>

              <button
                onClick={handleLogout}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut size={16} /> Logout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-primary/10 hover:text-primary"
      >
        Login
      </Link>
      <Link to="/register" className="btn btn-primary !px-5 !py-2 text-sm">
        Sign Up
      </Link>
    </div>
  );

  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable btn btn-primary fixed left-4 top-4 z-[200]"
      >
        Skip to content
      </a>

      <header
        ref={headerRef}
        className={`glass sticky top-0 z-50 border-b border-white/70 transition-all duration-300 ${
          scrolled
            ? "shadow-[0_8px_32px_-16px_rgba(15,23,42,0.4)] backdrop-blur-xl"
            : "shadow-[0_4px_24px_-18px_rgba(15,23,42,0.35)]"
        }`}
      >
        <nav
          className={`container mx-auto flex items-center justify-between gap-3 px-4 transition-all duration-300 sm:gap-4 sm:px-6 ${
            scrolled ? "py-2.5" : "py-3.5"
          }`}
          // Safe-area top inset keeps the bar clear of the iPhone notch.
          // `style` rather than a utility because `env()` cannot be
          // composed into a Tailwind arbitrary value reliably.
          style={{
            paddingTop: `calc(${scrolled ? "0.625rem" : "0.875rem"} + var(--safe-top))`,
            paddingBottom: scrolled ? "0.625rem" : "0.875rem",
          }}
        >
          <Link
            to="/"
            className="group flex min-w-0 shrink-0 items-center gap-2.5"
          >
            <span className="pulse-mark relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Activity size={21} />
              <span
                className="absolute inset-0 animate-pulse-ring rounded-xl"
                aria-hidden="true"
              />
            </span>
            {/* The full wordmark does not fit beside the menu button on a
                360px phone, so it collapses to the short form. */}
            <span className="min-w-0 truncate text-base font-extrabold tracking-tight text-slate-900 sm:text-lg md:text-xl">
              Infant <span className="text-gradient">Immunization</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {links}
            <span className="mx-1 h-6 w-px bg-slate-200/80" />
            {account}
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="btn-touch grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white/70 text-slate-700 transition hover:border-primary hover:text-primary active:scale-95 md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 top-[var(--nav-h,4.5rem)] z-40 md:hidden"
          >
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="glass relative m-4 flex flex-col gap-2 rounded-2xl border border-white p-4 shadow-2xl"
            >
              {links}
              <div className="mt-2 border-t border-slate-200/80 pt-3">
                {account}
              </div>
              {!user && (
                <p className="flex items-center gap-1.5 pt-1 text-xs text-muted">
                  <Sparkles size={13} /> Track every dose from birth to two
                  years.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
