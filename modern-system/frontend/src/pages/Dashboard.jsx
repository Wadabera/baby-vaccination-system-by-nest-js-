import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users,
  Baby,
  Activity,
  AlertCircle,
  ArrowRight,
  Database,
  Sparkles,
} from "lucide-react";
import api from "../api/axios";
import { fullName, formatDate, progressOf } from "../utils/format";
import { apiErrorMessage } from "../utils/apiError";
import {
  PageHeader,
  StatCard,
  SectionCard,
  StackedBars,
  Alert,
  Skeleton,
  useToast,
} from "../components/ui";

/**
 * Programme analytics.
 *
 * Replaces the inline percentage-width divs with `StackedBars`, which
 * animates each segment from zero. That matters here because the bars
 * are the main signal: a static bar that silently changes colour on
 * reload is easy to miss when a cohort crosses into overdue.
 */
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [recent, setRecent] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { notify } = useToast();

  const load = useCallback(async () => {
    setError("");
    try {
      const [statsResponse, cohortResponse, healthResponse, childrenResponse] =
        await Promise.all([
          api.get("/health/stats"),
          api.get("/health/due-cohorts").catch(() => ({ data: [] })),
          api.get("/health/check").catch(() => ({ data: null })),
          api.get("/children").catch(() => ({ data: [] })),
        ]);

      setStats(statsResponse.data);
      setCohorts(cohortResponse.data ?? []);
      setHealth(healthResponse.data);
      setRecent((childrenResponse.data ?? []).slice(0, 5));
    } catch (err) {
      const message = apiErrorMessage(err, "Could not load dashboard data");
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  // Overdue doses are still outstanding, so the total due figure is the
  // meaningful headline; `cohorts` has no `completed` counter.
  const dosesDue = cohorts.reduce((sum, cohort) => sum + cohort.total, 0);
  const dosesOverdue = cohorts.reduce((sum, cohort) => sum + cohort.overdue, 0);

  const statCards = [
    {
      label: "Total Infants",
      value: stats?.totalChildren,
      icon: Baby,
      tone: "parent",
    },
    {
      label: "Total Mothers",
      value: stats?.totalMothers,
      icon: Users,
      tone: "registrar",
    },
    { label: "Doses Due", value: dosesDue, icon: Activity, tone: "primary" },
    {
      label: "Overdue Doses",
      value: dosesOverdue,
      icon: AlertCircle,
      tone: "admin",
      hint: dosesOverdue > 0 ? "Needs follow-up" : "Nothing overdue",
    },
  ];

  const bars = cohorts.map((cohort) => ({
    label: cohort.vaccineName,
    value: cohort.total,
    hint: `${cohort.overdue} overdue / ${cohort.pending} upcoming`,
    segments: [
      { label: "Overdue", value: cohort.overdue, colour: "bg-rose-400" },
      { label: "Upcoming", value: cohort.pending, colour: "bg-amber-400" },
    ],
  }));

  const healthy = health?.status === "ok";

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Healthcare Overview"
        subtitle="Vaccination performance across the programme"
        icon={Activity}
        tone="primary"
        action={
          health && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
            >
              <span className="relative flex h-2.5 w-2.5">
                {healthy && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    healthy ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
              </span>
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted">
                  System
                </p>
                <p
                  className={`text-sm font-bold ${
                    healthy ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {healthy ? "All systems operational" : "Database unreachable"}
                </p>
              </div>
              <Database size={17} className="hidden text-slate-300 sm:block" />
            </motion.div>
          )
        }
      />

      {error && <Alert kind="error">{error}</Alert>}

      <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
        {statCards.map((card, index) => (
          <StatCard
            key={card.label}
            {...card}
            loading={loading}
            index={index}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 xl:grid-cols-2">
        <SectionCard
          title="Doses due in the next 14 days"
          subtitle={
            dosesDue > 0
              ? `${dosesDue} doses across ${cohorts.length} vaccines`
              : "Nothing falling due"
          }
          icon={Activity}
          tone="primary"
        >
          {loading ? (
            <div className="space-y-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : bars.length > 0 ? (
            <StackedBars rows={bars} />
          ) : (
            <div className="py-10 text-center">
              <Sparkles className="mx-auto mb-2 text-emerald-400" size={30} />
              <p className="font-semibold text-slate-700">
                No doses are due in the next two weeks.
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recently Registered Children"
          subtitle="Latest additions to the programme"
          icon={Baby}
          tone="parent"
        >
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              No children registered yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.map((child, index) => {
                const progress = progressOf(child.schedule);
                return (
                  <motion.li
                    key={child._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.07, duration: 0.4 }}
                  >
                    <Link
                      to={`/child/${child._id}`}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/70 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 font-bold text-primary">
                          {child.personalInfo?.firstName?.[0]}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900 transition-colors group-hover:text-primary">
                            {fullName(child)}
                          </p>
                          <p className="text-xs text-muted">
                            {child.childId} · born{" "}
                            {formatDate(child.personalInfo?.birthDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-xs font-semibold text-muted sm:block">
                          {progress.done}/{progress.total}
                        </span>
                        <ArrowRight
                          size={15}
                          className="text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary"
                        />
                      </div>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default Dashboard;
