import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Printer,
  MapPin,
  CalendarDays,
  Ruler,
  Droplet,
  HeartHandshake,
  Syringe,
  Sparkles,
} from "lucide-react";
import api from "../api/axios";
import { fullName, formatDate, progressOf, ageInMonths } from "../utils/format";
import { apiErrorMessage } from "../utils/apiError";
import {
  DoseTimeline,
  DoseSummary,
  CoverageRing,
  Alert,
  Skeleton,
  Segmented,
} from "../components/ui";

const VIEWS = [
  { value: "timeline", label: "Timeline", icon: Sparkles },
  { value: "table", label: "Table", icon: Syringe },
];

/**
 * Printable health card for one child.
 *
 * The schedule is the reason this page exists, so it gets the timeline
 * as the default view with the raw table one click away — the table is
 * still what gets printed at a clinic, where batch numbers are read
 * aloud. The print stylesheet in `index.css` drops the navigation and
 * keeps the record.
 */
const ChildDetail = () => {
  const { id } = useParams();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("timeline");

  const load = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get(`/children/${id}`);
      setChild(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Record not found"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <Alert kind="error">{error || "Record not found"}</Alert>
        <Link to="/" className="btn btn-soft mt-6">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </div>
    );
  }

  const progress = progressOf(child.schedule);
  const mother =
    child.motherId && typeof child.motherId === "object"
      ? child.motherId
      : null;
  const schedule = child.schedule ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/registrar"
          className="group flex items-center gap-2 font-bold text-slate-500 transition hover:text-primary"
        >
          <ArrowLeft
            size={18}
            className="transition-transform duration-300 group-hover:-translate-x-1"
          />
          Back to Records
        </Link>

        <div className="flex items-center gap-3">
          <Segmented items={VIEWS} value={view} onChange={setView} />
          <button onClick={() => window.print()} className="btn btn-soft">
            <Printer size={17} /> Print Card
          </button>
        </div>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="card glow-border overflow-hidden !p-0"
      >
        {/* ---------------------------------------------------- *
         * Card header
         * ---------------------------------------------------- */}
        <header className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dark p-8 text-white">
          <div
            className="animate-breathe pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />
          <Syringe
            className="pointer-events-none absolute -bottom-8 -right-4 text-white/[0.07]"
            size={190}
            aria-hidden="true"
          />

          <div className="relative flex items-start justify-between gap-6">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur">
                <MapPin size={12} />
                {child.clinicId
                  ? "Registered Clinic"
                  : "Standard Medical Center"}
              </p>
              <h1 className="text-2xl font-black uppercase tracking-tight md:text-3xl">
                Digital Immunization Card
              </h1>
              <p className="mt-1.5 text-sm font-medium text-white/80">
                Full name, schedule and batch history
              </p>
            </div>
            <p className="hidden shrink-0 text-right font-mono text-3xl font-black opacity-30 md:block">
              {child._id.slice(-6).toUpperCase()}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 p-5 sm:gap-8 sm:p-8 md:grid-cols-3">
          {/* ------------------------------------------------ *
           * Identity
           * ------------------------------------------------ */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <CoverageRing
                percent={progress.percent}
                size={170}
                label={`${progress.done} of ${progress.total} doses`}
                sublabel={
                  progress.overdue > 0
                    ? `${progress.overdue} overdue`
                    : "On schedule"
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Detail label="Full Name" value={fullName(child)} wide />
              <Detail
                label="Birth Date"
                value={formatDate(child.personalInfo?.birthDate)}
                icon={CalendarDays}
              />
              <Detail
                label="Age"
                value={`${ageInMonths(child.personalInfo?.birthDate)} months`}
                icon={Ruler}
              />
              <Detail
                label="Blood Type"
                value={child.personalInfo?.bloodType ?? "Unknown"}
                icon={Droplet}
              />
              <Detail label="Child ID" value={child.childId} />
            </div>

            {mother && (
              <Detail
                label="Mother"
                value={`${fullName(mother)} (${mother.motherId})`}
                icon={HeartHandshake}
              />
            )}
          </div>

          {/* ------------------------------------------------ *
           * Schedule
           * ------------------------------------------------ */}
          <div className="md:col-span-2">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Syringe size={19} className="text-primary" />
                Vaccination History &amp; Schedule
              </h2>
            </div>

            <DoseSummary schedule={schedule} />

            <div className="mt-6">
              {view === "timeline" ? (
                <DoseTimeline schedule={schedule} />
              ) : schedule.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  No schedule generated for this child.
                </p>
              ) : (
                <div className="scroll-x">
                  <table className="w-full min-w-[32rem] text-left">
                    <thead className="table-head text-xs uppercase tracking-wider text-muted">
                      <tr>
                        <th className="pb-3 pr-4 font-bold">Vaccine</th>
                        <th className="pb-3 pr-4 font-bold">Due</th>
                        <th className="pb-3 pr-4 font-bold">Status</th>
                        <th className="pb-3 pr-4 font-bold">Given</th>
                        <th className="pb-3 font-bold">Batch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {schedule.map((dose) => (
                        <tr key={dose.vaccineName} className="row-hover">
                          <td className="py-3 pr-4 font-bold text-slate-700">
                            {dose.vaccineName}
                          </td>
                          <td className="py-3 pr-4 text-sm text-muted">
                            {formatDate(dose.dueDate)}
                          </td>
                          <td className="py-3 pr-4">
                            <StatusPill status={dose.status} />
                          </td>
                          <td className="py-3 pr-4 text-sm text-muted">
                            {dose.givenDate ? formatDate(dose.givenDate) : "—"}
                          </td>
                          <td className="py-3 font-mono text-xs text-slate-400">
                            {dose.batchNumber ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
};

const DOSE_STYLES = {
  completed: "badge-success",
  pending: "badge-warning",
  overdue: "badge-danger",
  missed: "bg-slate-100 text-slate-600",
};

const StatusPill = ({ status }) => (
  <span className={`badge ${DOSE_STYLES[status] ?? DOSE_STYLES.missed}`}>
    {status}
  </span>
);

const Detail = ({ label, value, icon: Icon, wide = false }) => (
  <div className={wide ? "col-span-2" : undefined}>
    <p className="flex items-center gap-1.5 text-[0.625rem] font-black uppercase tracking-widest text-muted">
      {Icon && <Icon size={11} />}
      {label}
    </p>
    <p className="font-bold break-words text-slate-900">{value ?? "—"}</p>
  </div>
);

export default ChildDetail;
