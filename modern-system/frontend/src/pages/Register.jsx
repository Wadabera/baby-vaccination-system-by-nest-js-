import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { homeFor } from "../utils/navigation";
import { apiErrorMessage } from "../utils/apiError";
import {
  UserPlus,
  Mail,
  Lock,
  Phone,
  CheckCircle,
  User,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { Field, Alert } from "../components/ui";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const HIGHLIGHTS = [
  {
    Icon: ShieldCheck,
    title: "Your records stay private",
    text: "Only you and your clinic see your family’s data.",
  },
  {
    Icon: CheckCircle,
    title: "Every dose tracked",
    text: "See what is due, what is done and what is next.",
  },
  {
    Icon: UserPlus,
    title: "Self-service for parents",
    text: "Staff accounts are created by an administrator.",
  },
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // `event.target` is read here rather than inside the updater: the updater
  // runs after this handler returns, at which point the event's target is no
  // longer guaranteed to be the input.
  // `Field` hands the handler a plain string (the new value), not an event,
  // so this takes the value directly. Reading `event.target` here would
  // throw on every keystroke.
  const update = (field) => (value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      // `confirmPassword` is UI-only and must not reach the API.
      //
      // Optional fields the user left blank are omitted rather than sent as
      // empty strings: the API marks them `@IsOptional()`, which skips only
      // `undefined`. Sending `""` therefore failed validation on a field the
      // form labels "(optional)".
      const payload = Object.fromEntries(
        Object.entries(form).filter(
          ([key, value]) =>
            key !== "confirmPassword" &&
            (typeof value !== "string" || value.trim() !== ""),
        ),
      );

      const user = await register(payload);
      setSuccess(true);
      // The account is signed in as soon as it is created. Navigate through
      // the router rather than `window.location`, which would force a full
      // page reload and throw away the session we just stored.
      setTimeout(() => navigate(homeFor(user.role)), 1200);
    } catch (err) {
      // Joins the ValidationPipe rule list into a sentence, and keeps a
      // transport failure from masquerading as a rejected form.
      setError(
        apiErrorMessage(err, "Registration failed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="card glass max-w-md p-12 text-center"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.15,
              type: "spring",
              stiffness: 260,
              damping: 16,
            }}
            className="mb-6 inline-grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-500"
          >
            <CheckCircle size={48} />
          </motion.span>
          <h2 className="mb-3 text-3xl font-extrabold text-slate-900">
            Account Created
          </h2>
          <p className="mb-6 text-muted">Taking you to your dashboard…</p>
          <div className="mx-auto h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
            <motion.span
              className="block h-full rounded-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.3, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grid items-center gap-12 py-6 lg:grid-cols-[1fr_minmax(0,42rem)] lg:gap-16">
      {/* Marketing panel, hidden on small screens. */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:block"
      >
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <UserPlus size={14} /> Get started
        </p>
        <h1 className="mb-5 text-5xl font-extrabold leading-[1.1] text-slate-900">
          Follow every dose,{" "}
          <span className="text-gradient">without the guesswork.</span>
        </h1>
        <p className="mb-10 max-w-md text-lg text-muted">
          Create a parent account to see your children’s schedule, what has been
          given and what is due next.
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="card glass mx-auto w-full !p-8 md:!p-10"
      >
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-extrabold text-slate-900">
            Create Account
          </h2>
          <p className="text-muted">
            Parent accounts are self-service. Staff accounts are created by an
            administrator.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert kind="error">{error}</Alert>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-5 md:grid-cols-2"
        >
          <Field
            label="First Name"
            icon={User}
            required
            value={form.firstName}
            onChange={update("firstName")}
          />
          <Field
            label="Middle Name"
            value={form.middleName}
            onChange={update("middleName")}
          />
          <Field
            label="Last Name"
            icon={User}
            required
            value={form.lastName}
            onChange={update("lastName")}
          />
          <Field
            label="Phone Number"
            type="tel"
            icon={Phone}
            placeholder="+251911000004"
            hint="Ethiopian format, e.g. +251 91 100 0004"
            required
            value={form.phoneNumber}
            onChange={update("phoneNumber")}
          />
          <Field
            label="Username (optional)"
            icon={User}
            value={form.username}
            onChange={update("username")}
          />
          <Field
            label="Email"
            type="email"
            icon={Mail}
            required
            value={form.email}
            onChange={update("email")}
          />
          <Field
            label="Password"
            type="password"
            icon={Lock}
            minLength={8}
            hint="At least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol."
            required
            value={form.password}
            onChange={update("password")}
          />
          <Field
            label="Confirm Password"
            type="password"
            icon={Lock}
            minLength={8}
            required
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
          />

          <div className="col-span-1 mt-2 md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full justify-center !py-4 text-base"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus size={19} /> Register Account
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-primary transition hover:underline"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export { BLOOD_TYPES };
export default Register;
