import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LogIn,
  User,
  Lock,
  Eye,
  EyeOff,
  Activity,
  ShieldCheck,
  CalendarCheck,
  HeartHandshake,
  Wand2,
  Baby,
  Stethoscope,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { homeFor } from "../utils/navigation";
import { apiErrorMessage } from "../utils/apiError";
import { Reveal, Alert, Field } from "../components/ui/Primitives";

const HIGHLIGHTS = [
  {
    Icon: CalendarCheck,
    title: "Full schedule tracking",
    text: "16-dose infant schedule and TT/Rh for mothers.",
  },
  {
    Icon: ShieldCheck,
    title: "Safety gate built in",
    text: "Contraindications block a dose until a doctor clears it.",
  },
  {
    Icon: HeartHandshake,
    title: "One record per family",
    text: "Link each child to a mother and follow progress together.",
  },
];

/**
 * Accounts created by `npm run seed`.
 *
 * Surfaced on the sign-in screen so the application can be demonstrated
 * without typing credentials, and so a reviewer can see each role's view
 * immediately. The shared password is defined once, by the seed script,
 * and read from `SEED_PASSWORD` at build time via Vite's env handling;
 * it falls back to the documented default.
 */
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? "Vaccinate@2024";

const DEMO_ACCOUNTS = [
  {
    role: "admin",
    icon: ShieldCheck,
    username: "admin",
    blurb: "Accounts, roles, announcements",
  },
  {
    role: "registrar",
    icon: Baby,
    username: "registrar",
    blurb: "Register mothers and children",
  },
  {
    role: "doctor",
    icon: Stethoscope,
    username: "doctor",
    blurb: "Worklist and dose administration",
  },
  {
    role: "parent",
    icon: HeartHandshake,
    username: "parent",
    blurb: "Family schedule and coverage",
  },
];

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filled, setFilled] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  /** Fills both fields and clears any stale error, without signing in. */
  const fillDemo = (username) => {
    setIdentifier(username);
    setPassword(DEMO_PASSWORD);
    setError("");
    setFilled(username);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // The backend accepts either a username or an email address.
      const user = await login(identifier, password);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      // A network or CORS failure must not be reported as a bad password:
      // that sends people looking for the wrong problem entirely.
      setError(apiErrorMessage(err, "Invalid username or password"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid items-center gap-12 py-6 lg:grid-cols-2 lg:gap-20">
      {/* Marketing panel, hidden on small screens where it would only
          push the form below the fold. */}
      <Reveal className="hidden lg:block" y={24}>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <Activity size={14} /> Immunization records
        </p>
        <h1 className="mb-5 text-5xl font-extrabold leading-[1.1] text-slate-900">
          Every dose, <span className="text-gradient">accounted for.</span>
        </h1>
        <p className="mb-10 max-w-md text-lg text-muted">
          A shared system for health centres and families to register infants
          and mothers, follow the national schedule, and record every
          vaccination as it happens.
        </p>

        <ul className="space-y-5">
          {HIGHLIGHTS.map(({ Icon, title, text }, index) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.15 + index * 0.12,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-start gap-4"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                <Icon size={21} />
              </span>
              <div>
                <p className="font-bold text-slate-900">{title}</p>
                <p className="text-sm text-muted">{text}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="card glass mx-auto w-full max-w-md !p-8">
          <div className="mb-8 text-center">
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }}
              className="mb-4 inline-grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-xl shadow-primary/30"
            >
              <LogIn size={30} />
            </motion.div>
            <h2 className="mb-2 text-3xl font-extrabold text-slate-900">
              Welcome Back
            </h2>
            <p className="text-muted">Please enter your details to sign in</p>
          </div>

          {error && (
            <div className="mb-6">
              <Alert kind="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field
              label="Username or Email"
              icon={User}
              placeholder="admin or admin@vaccination.et"
              autoComplete="username"
              value={identifier}
              onChange={setIdentifier}
              required
            />

            {/* The reveal toggle needs to sit inside the input, so this
                one field is laid out by hand rather than via `Field`. */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 ml-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700"
              >
                <Lock size={15} className="text-primary" /> Password
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="input px-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="btn-touch absolute right-1 top-1/2 -translate-y-1/2 rounded-lg text-slate-400 transition hover:bg-primary/10 hover:text-primary active:scale-90"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full !py-3.5 text-base"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </button>
          </form>

          {/* ---------------------------------------------------- *
           * Demo accounts
           *
           * One click per role. Fills the form so the reviewer can press
           * Sign In, rather than signing in on their behalf — which keeps
           * the password field, validation and error handling visible.
           * ---------------------------------------------------- */}
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Wand2 size={13} className="text-primary" />
              Demo accounts
            </p>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => {
                const active = filled === account.username;

                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => fillDemo(account.username)}
                    aria-pressed={active}
                    title={`${account.username} — ${account.blurb}`}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 active:scale-95 ${
                      active
                        ? "border-primary bg-white shadow-md shadow-primary/15"
                        : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <account.icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-slate-900">
                        {account.username}
                      </span>
                      <span className="block truncate text-[0.625rem] capitalize text-muted">
                        {account.role}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-[0.6875rem] leading-relaxed text-slate-400">
              Seeded by <code className="font-mono">npm run seed</code>. Shared
              password <code className="font-mono">{DEMO_PASSWORD}</code>.
              {filled && ` “${filled}” filled — press Sign In.`}
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-primary transition hover:underline"
            >
              Sign up now
            </Link>
          </p>
        </div>
      </Reveal>
    </div>
  );
};

export default Login;
