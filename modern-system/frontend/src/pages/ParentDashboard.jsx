import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Baby,
  Calendar,
  Activity,
  Heart,
  Sparkles,
  ArrowRight,
  Phone,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import api from "../api/axios";
import { fullName, formatDate, progressOf } from "../utils/format";
import { apiErrorMessage } from "../utils/apiError";
import {
  PageHeader,
  ProgressBar,
  CoverageRing,
  Alert,
  EmptyState,
  Skeleton,
  StatCard,
  useToast,
} from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const { notify } = useToast();

  const load = useCallback(async () => {
    setError("");
    try {
      // Scoped server-side: a parent only ever sees their own children.
      const { data } = await api.get("/children/my-children");
      setChildren(data ?? []);
    } catch (err) {
      // A 403 here is the meaningful case: a parent account with no children
      // linked. Keep that specific message ahead of the generic one.
      const message =
        err.response?.status === 403
          ? "This account is not set up as a parent portal account."
          : apiErrorMessage(err, "Could not load your children");
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = children.reduce(
    (acc, child) => {
      const progress = progressOf(child.schedule);
      return {
        doses: acc.doses + progress.done,
        expected: acc.expected + progress.total,
        overdue: acc.overdue + progress.overdue,
      };
    },
    { doses: 0, expected: 0, overdue: 0 },
  );

  const percent =
    totals.expected === 0
      ? 0
      : Math.round((totals.doses / totals.expected) * 100);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Parent Portal"
        subtitle={`Welcome back, ${user?.profile?.firstName ?? "parent"}. Here is your family's progress.`}
        icon={Heart}
        tone="parent"
      />

      {error && (
        <div className="mb-6">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {/* ------------------------------------------------------- *
       * Family summary
       * ------------------------------------------------------- */}
      {!loading && children.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-3 sm:gap-6">
            <StatCard
              index={0}
              label="Children Linked"
              value={children.length}
              icon={Baby}
              tone="parent"
            />
            <StatCard
              index={1}
              label="Doses Recorded"
              value={`${totals.doses} / ${totals.expected}`}
              icon={Activity}
              tone="primary"
            />
            <StatCard
              index={2}
              label="Overdue Doses"
              value={totals.overdue}
              icon={AlertTriangle}
              tone="admin"
              hint={
                totals.overdue > 0
                  ? "Please book a visit"
                  : "Everything on schedule"
              }
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="card mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8"
          >
            <CoverageRing
              percent={percent}
              size={150}
              label="Overall coverage"
              sublabel={`${totals.doses} of ${totals.expected} doses`}
            />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="mb-1.5 text-xl font-bold text-slate-900">
                How your family is tracking
              </h2>
              <p className="mb-5 text-sm leading-relaxed text-muted">
                Each dose is added by a health worker at the clinic. Once a dose
                becomes due it appears below with its date, so you know when to
                visit.
              </p>
              <ProgressBar percent={percent} />
              {totals.overdue > 0 && (
                <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 sm:justify-start">
                  <AlertTriangle size={16} className="shrink-0" />
                  {totals.overdue}{" "}
                  {totals.overdue === 1 ? "dose is" : "doses are"} overdue.
                  Please contact your health centre.
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}

      {loading ? (
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="card">
              <div className="flex items-center gap-6">
                <Skeleton className="h-20 w-20 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-2 w-56 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:gap-6">
          {children.map((child, index) => {
            const progress = progressOf(child.schedule);
            const next = (child.schedule ?? [])
              .filter(
                (dose) =>
                  dose.status === "pending" || dose.status === "overdue",
              )
              .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

            return (
              <motion.article
                key={child._id}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.09,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="card glow-border group !p-0"
              >
                {/* Accent bar echoes the coverage ring colour. */}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100 max-sm:scale-x-100 ${
                    progress.percent >= 100
                      ? "bg-accent"
                      : progress.percent >= 50
                        ? "bg-primary"
                        : "bg-role-registrar"
                  }`}
                />

                <div className="flex flex-col gap-5 p-5 sm:gap-6 sm:p-7 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
                    <div className="shrink-0">
                      <CoverageRing
                        percent={progress.percent}
                        size={96}
                        thickness={8}
                        sublabel={`${progress.done}/${progress.total}`}
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="mb-1 truncate text-xl font-bold text-slate-900 sm:text-2xl">
                        {fullName(child)}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-muted sm:text-sm">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} /> Born{" "}
                          {formatDate(child.personalInfo?.birthDate)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone size={14} />{" "}
                          {child.contactInfo?.phoneNumber ??
                            "No contact on file"}
                        </span>
                        {child.address?.kebele && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} /> {child.address.kebele}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 w-full max-w-xs sm:mt-4">
                        <ProgressBar percent={progress.percent} />
                      </div>

                      {next && (
                        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                          <span className="font-semibold text-slate-700">
                            Next:
                          </span>
                          <span className="font-bold text-primary">
                            {next.vaccineName}
                          </span>
                          <span
                            className={`badge ${
                              next.status === "overdue"
                                ? "badge-danger"
                                : "badge-warning"
                            }`}
                          >
                            {next.status}
                          </span>
                          <span className="text-muted">
                            due {formatDate(next.dueDate)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/child/${child._id}`}
                    className="btn btn-primary w-full shrink-0 !px-6 !py-3 sm:w-auto"
                  >
                    View Health Card
                    <ArrowRight
                      size={18}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </motion.article>
            );
          })}

          {children.length === 0 && !error && (
            <EmptyState
              icon={Baby}
              title="No child records linked to your account"
              description="Please contact the clinic to link your children's profiles."
            />
          )}
        </div>
      )}

      {/* ------------------------------------------------------- *
       * Awareness panel
       * ------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="card group relative mt-8 overflow-hidden !border-0 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white"
      >
        {/* Sheen that sweeps across on hover. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-[400%]"
        />
        <div
          className="animate-float pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />
        <Activity
          className="pointer-events-none absolute -bottom-10 -right-6 text-white/[0.06]"
          size={200}
          aria-hidden="true"
        />

        <div className="relative z-10 space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
            <Sparkles size={13} /> Vaccination Awareness
          </p>
          <h3 className="text-2xl font-extrabold">
            Protecting your baby, dose by dose
          </h3>
          <p className="max-w-2xl text-emerald-100/85">
            Timely vaccination protects your baby from serious diseases in the
            first two years of life. Review the schedule above and visit your
            nearest health centre when a dose is due. Keep the health card up to
            date so any clinician can see the full history.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ParentDashboard;
