import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Baby,
  CheckCircle2,
  RefreshCw,
  Syringe,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import api from "../api/axios";
import { fullName, formatDate, ageInMonths, progressOf } from "../utils/format";
import { apiErrorMessage } from "../utils/apiError";
import { PageHeader, StatCard, SectionCard, Tooltip } from "../components/ui/SummaryCards";
import { DoseSummary, Segmented } from "../components/ui/Data";
import { Field, SearchInput, Modal, Alert, Skeleton } from "../components/ui/Primitives";
import { useToast } from "../components/ui/toastContext";

const FILTERS = [
  { value: "due", label: "Due now", icon: Syringe },
  { value: "flagged", label: "Safety flags", icon: ShieldAlert },
  { value: "all", label: "All patients", icon: Baby },
];

/**
 * Medical staff view: safety worklist plus dose administration.
 *
 * Recording a dose is the one action on this screen that changes a
 * clinical record, so it goes through the shared `Modal` (focus trap,
 * Escape, scroll lock) instead of the hand-rolled fixed overlay this
 * page used before. The contraindication gate lives on the server, and
 * its refusal message is surfaced verbatim in the dialog.
 */
const DoctorDashboard = () => {
  const [children, setChildren] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("due");

  const [draft, setDraft] = useState(null);
  const [batchNumber, setBatchNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const { notify } = useToast();

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setError("");

    try {
      const [childrenResponse, queueResponse] = await Promise.all([
        api.get("/children"),
        api.get("/doctors/review-queue").catch(() => ({ data: [] })),
      ]);
      setChildren(childrenResponse.data ?? []);
      setQueue(queueResponse.data ?? []);
      setError("");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load patient records"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeDialog = () => {
    setDraft(null);
    setBatchNumber("");
    setDialogError("");
  };

  const submitDose = async (event) => {
    event.preventDefault();
    if (!draft) return;

    setSaving(true);
    setDialogError("");
    try {
      await api.post(`/children/${draft.child._id}/vaccinations`, {
        doseIndex: draft.child.schedule.findIndex(
          (dose) => dose.vaccineName === draft.dose.vaccineName,
        ),
        batchNumber: batchNumber.trim(),
        clinicId: draft.child.clinicId,
      });

      notify(
        `${draft.dose.vaccineName} recorded for ${fullName(draft.child)}.`,
      );
      closeDialog();
      await load({ quiet: true });
    } catch (err) {
      // The safety gate returns a sentence naming the blocker; show it as-is
      // rather than a generic failure.
      setDialogError(apiErrorMessage(err, "Could not record dose"));
    } finally {
      setSaving(false);
    }
  };

  const flaggedIds = useMemo(
    () =>
      new Set(
        queue
          .filter(
            (item) =>
              item.activeContraindications > 0 ||
              item.severeAdverseReactions > 0,
          )
          .map((item) => item.childId),
      ),
    [queue],
  );

  /** Outstanding dose that is already past its due date. */
  const nextOutstanding = (child) =>
    (child.schedule ?? [])
      .filter((dose) => dose.status === "pending" || dose.status === "overdue")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  const patients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return children
      .filter((child) => {
        const next = nextOutstanding(child);
        if (filter === "due")
          return next && new Date(next.dueDate) <= new Date();
        if (filter === "flagged")
          return flaggedIds.has(child.childId ?? child._id);
        return true;
      })
      .filter((child) =>
        term
          ? `${fullName(child)} ${child.childId}`.toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => {
        // Anything due today sorts first, then by how overdue it is.
        const aDue = nextOutstanding(a)?.dueDate;
        const bDue = nextOutstanding(b)?.dueDate;
        if (!aDue) return 1;
        if (!bDue) return -1;
        return new Date(aDue) - new Date(bDue);
      });
  }, [children, filter, search, flaggedIds]);

  const stats = [
    {
      label: "Total Patients",
      value: children.length,
      icon: Baby,
      tone: "primary",
    },
    {
      label: "Doses Due Now",
      value: children.filter((child) => {
        const next = nextOutstanding(child);
        return next && new Date(next.dueDate) <= new Date();
      }).length,
      icon: Syringe,
      tone: "registrar",
    },
    {
      label: "Safety Flags",
      value: flaggedIds.size,
      icon: AlertTriangle,
      tone: "admin",
    },
    {
      label: "Fully Covered",
      value: children.filter(
        (child) => progressOf(child.schedule).percent === 100,
      ).length,
      icon: CheckCircle2,
      tone: "doctor",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Medical Centre"
        subtitle="Review cases and administer vaccinations"
        icon={Activity}
        tone="doctor"
        action={
          <button
            onClick={() => load({ quiet: true })}
            disabled={refreshing}
            className="btn btn-soft"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}

      <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
        {stats.map((card, index) => (
          <StatCard
            key={card.label}
            {...card}
            loading={loading}
            index={index}
          />
        ))}
      </div>

      {/* ------------------------------------------------------- *
       * Safety worklist
       * ------------------------------------------------------- */}
      {queue.length > 0 && (
        <div id="worklist" className="anchor-offset">
          <SectionCard
            title="Review Worklist"
            subtitle="Children carrying an active contraindication or a severe reaction"
            icon={ShieldAlert}
            tone="admin"
            bodyClassName="scroll-x"
          >
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="table-head text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="py-2.5 pr-4 font-bold">Patient</th>
                  <th className="py-2.5 pr-4 font-bold">Age</th>
                  <th className="py-2.5 pr-4 font-bold">Next dose</th>
                  <th className="py-2.5 pr-4 font-bold">Due</th>
                  <th className="py-2.5 font-bold">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((item) => (
                  <tr key={item.childId} className="row-hover">
                    <td className="py-3 pr-4 font-bold text-slate-900">
                      {item.childName}
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      {item.ageInMonths} mo
                    </td>
                    <td className="py-3 pr-4">{item.nextDueDose ?? "—"}</td>
                    <td className="py-3 pr-4 text-muted">
                      {formatDate(item.nextDueDate)}
                    </td>
                    <td className="py-3">
                      <span className="flex flex-wrap gap-1.5">
                        {item.activeContraindications > 0 && (
                          <span className="badge badge-danger">
                            {item.activeContraindications} contraindication
                          </span>
                        )}
                        {item.severeAdverseReactions > 0 && (
                          <span className="badge badge-danger">
                            {item.severeAdverseReactions} severe reaction
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>
      )}

      {/* ------------------------------------------------------- *
       * Patient list
       * ------------------------------------------------------- */}
      <SectionCard
        title="Patients"
        subtitle={`${patients.length} shown`}
        icon={Baby}
        tone="primary"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Segmented items={FILTERS} value={filter} onChange={setFilter} />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name or ID…"
              label="Search patients"
            />
          </div>
        }
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted">
              {search || filter !== "all"
                ? "No patients match this filter."
                : "No child records found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {patients.map((child, index) => {
              const next = nextOutstanding(child);
              const isFlagged = flaggedIds.has(child.childId ?? child._id);

              return (
                <motion.article
                  key={child._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.06,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`card group flex flex-col !p-0 ${
                    isFlagged ? "border-l-4 border-l-rose-400" : ""
                  }`}
                >
                  <div className="flex items-center gap-4 p-5 pb-4 sm:p-6 sm:pb-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary transition-transform duration-300 group-hover:scale-110">
                      <Activity size={23} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-slate-900">
                        {fullName(child)}
                      </h3>
                      <p className="text-xs text-muted">
                        {child.childId} ·{" "}
                        {ageInMonths(child.personalInfo?.birthDate)} months old
                      </p>
                    </div>
                    {isFlagged && (
                      <Tooltip label="Has an active safety flag" side="left">
                        <span className="ml-auto shrink-0 rounded-full bg-rose-50 p-2 text-rose-600">
                          <ShieldAlert size={16} />
                        </span>
                      </Tooltip>
                    )}
                  </div>

                  <div className="flex-1 px-5 sm:px-6">
                    <DoseSummary schedule={child.schedule} />
                  </div>

                  {next && (
                    <div className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 sm:mx-6">
                      <div className="min-w-0">
                        <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-muted">
                          Next due
                        </p>
                        <p className="truncate font-bold text-slate-900">
                          {next.vaccineName}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDate(next.dueDate)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDialogError("");
                          setDraft({ child, dose: next });
                        }}
                        className="btn btn-primary shrink-0 !px-4 !py-2 text-sm"
                      >
                        Record <ArrowRight size={14} />
                      </button>
                    </div>
                  )}

                  <div className="p-5 pt-4 sm:p-6 sm:pt-4">
                    <Link
                      to={`/child/${child._id}`}
                      className="btn btn-soft w-full justify-center !py-2.5 text-sm"
                    >
                      Full Health Record
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ------------------------------------------------------- *
       * Dose entry
       * ------------------------------------------------------- */}
      <Modal
        open={Boolean(draft)}
        onClose={closeDialog}
        title="Record vaccination"
        size="max-w-md"
      >
        {draft && (
          <form onSubmit={submitDose} className="space-y-5">
            <div className="flex items-center gap-3 rounded-2xl bg-primary/[0.06] p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-primary shadow-sm">
                <Syringe size={20} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900">
                  {draft.dose.vaccineName}
                </p>
                <p className="truncate text-sm text-muted">
                  {fullName(draft.child)} · due {formatDate(draft.dose.dueDate)}
                </p>
              </div>
            </div>

            {dialogError && <Alert kind="error">{dialogError}</Alert>}

            <Field
              label="Batch number"
              icon={Syringe}
              value={batchNumber}
              onChange={(value) => setBatchNumber(value.toUpperCase())}
              placeholder="BATCH123456"
              hint="6–20 letters, numbers or hyphens. Required for vaccine traceability."
              minLength={6}
              maxLength={20}
              required
              autoFocus
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDialog}
                className="btn btn-soft"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={17} /> Record dose
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
