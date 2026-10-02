import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  Baby,
  Users,
  Search,
  Trash2,
  Plus,
  Syringe,
  AlertCircle,
  Phone,
  MapPin,
  HeartHandshake,
  Droplet,
  CalendarDays,
  Ruler,
} from "lucide-react";
import api from "../api/axios";
import { fullName, formatDate, BLOOD_TYPES } from "../utils/format";
import { apiErrorMessage } from "../utils/apiError";
import { PageHeader, StatCard } from "../components/ui/SummaryCards";
import { Field, SearchInput, Modal, Alert, Skeleton } from "../components/ui/Primitives";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { OnboardingHint } from "../components/ui/Data";
import { useToast } from "../components/ui/toastContext";

const emptyMother = {
  firstName: "",
  middleName: "",
  lastName: "",
  birthDate: "",
  bloodType: "",
  phoneNumber: "",
  zone: "",
  wereda: "",
  kebele: "",
};

const emptyChild = {
  firstName: "",
  middleName: "",
  lastName: "",
  birthDate: "",
  bloodType: "",
  birthWeight: "",
};

/** Colour for a single TT/Rh dose pill. */
const dosePill = (status) =>
  ({
    completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    overdue: "bg-rose-100 text-rose-700 border border-rose-200",
    pending: "bg-amber-100 text-amber-700 border border-amber-200",
  })[status] ?? "bg-slate-100 text-slate-600 border border-slate-200";

/**
 * Registrar view: register mothers and children, and issue TT doses.
 *
 * The two registration forms are modals rather than separate pages, so
 * the mother list stays in place and the transition is animated. The
 * previous version used `window.confirm` for deactivation; that is now
 * a `ConfirmDialog` that matches the rest of the app.
 */
const RegistrarDashboard = () => {
  const [mothers, setMothers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(null);
  const [motherForm, setMotherForm] = useState(emptyMother);
  const [childForm, setChildForm] = useState(emptyChild);
  const [saving, setSaving] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState(null);

  const { notify } = useToast();

  const loadMothers = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get("/mothers");
      setMothers(data ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load mothers"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMothers();
  }, [loadMothers]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return mothers;
    return mothers.filter((mother) =>
      `${fullName(mother)} ${mother.motherId} ${mother.contactInfo?.phoneNumber ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [mothers, search]);

  const openMotherForm = () => {
    setMotherForm(emptyMother);
    setForm("mother");
  };

  const openChildForm = (mother) => {
    setChildForm(emptyChild);
    setForm({ type: "child", mother });
  };

  const closeForm = () => {
    setForm(null);
    setError("");
  };

  const submitMother = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/mothers", {
        personalInfo: {
          firstName: motherForm.firstName,
          middleName: motherForm.middleName || undefined,
          lastName: motherForm.lastName,
          birthDate: motherForm.birthDate,
          bloodType: motherForm.bloodType || undefined,
        },
        contactInfo: { phoneNumber: motherForm.phoneNumber },
        address: {
          zone: motherForm.zone,
          wereda: motherForm.wereda,
          kebele: motherForm.kebele,
        },
      });
      notify(`${motherForm.firstName} registered. TT1 is now due for her.`);
      closeForm();
      await loadMothers();
    } catch (err) {
      setError(apiErrorMessage(err, "Registration failed"));
    } finally {
      setSaving(false);
    }
  };

  const submitChild = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/children", {
        motherId: form.mother._id,
        personalInfo: {
          firstName: childForm.firstName,
          middleName: childForm.middleName || undefined,
          lastName: childForm.lastName,
          birthDate: childForm.birthDate,
          bloodType: childForm.bloodType || undefined,
        },
        medicalInfo: childForm.birthWeight
          ? { birthWeight: Number(childForm.birthWeight) }
          : undefined,
      });
      notify(
        `${childForm.firstName} registered with a full R1-R5 schedule generated automatically.`,
      );
      closeForm();
      await loadMothers();
    } catch (err) {
      setError(apiErrorMessage(err, "Child registration failed"));
    } finally {
      setSaving(false);
    }
  };

  const confirmRemoval = async () => {
    const mother = pendingRemoval;
    if (!mother) return;
    setError("");
    try {
      await api.delete(`/mothers/${mother._id}`);
      notify(`${fullName(mother)} deactivated.`);
      await loadMothers();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not deactivate"));
    }
  };

  const stats = [
    {
      label: "Registered Mothers",
      value: mothers.length,
      icon: Users,
      tone: "registrar",
    },
    {
      label: "Children Recorded",
      value: mothers.reduce(
        (sum, mother) => sum + (mother.childrenIds?.length ?? 0),
        0,
      ),
      icon: Baby,
      tone: "parent",
    },
    {
      label: "Mothers Due TT",
      value: mothers.filter((mother) =>
        mother.schedule?.some((dose) => dose.status !== "completed"),
      ).length,
      icon: Syringe,
      tone: "primary",
    },
    {
      label: "Overdue TT",
      value: mothers.filter((mother) =>
        mother.schedule?.some((dose) => dose.status === "overdue"),
      ).length,
      icon: AlertCircle,
      tone: "admin",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Registrar Dashboard"
        subtitle="Register mothers and children, and issue TT doses"
        icon={HeartHandshake}
        tone="registrar"
        action={
          <button onClick={openMotherForm} className="btn btn-primary">
            <UserPlus size={18} /> Register Mother
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

      {!loading && !search && (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, ID or phone…"
          label="Search mothers"
        />
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <OnboardingHint
          icon={search ? Search : HeartHandshake}
          title={
            search
              ? "No mothers match that search"
              : "No mothers registered yet"
          }
          action={
            search ? (
              <button onClick={() => setSearch("")} className="btn btn-soft">
                Clear search
              </button>
            ) : (
              <button onClick={openMotherForm} className="btn btn-primary">
                <UserPlus size={17} /> Register the first mother
              </button>
            )
          }
        >
          {search
            ? "Try a different name, ID or phone number."
            : "Register a mother first. Her TT1–TT5 and Rh schedule is generated automatically, then you can add her children."}
        </OnboardingHint>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mother, index) => (
            <motion.article
              key={mother._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.06,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="card glow-border group flex flex-col !p-0"
            >
              <div className="flex items-start gap-4 p-5 pb-4 sm:p-6 sm:pb-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-role-registrar/25 to-role-registrar/5 text-lg font-extrabold text-role-registrar transition-transform duration-300 group-hover:scale-110">
                  {mother.personalInfo?.firstName?.[0]}
                  {mother.personalInfo?.lastName?.[0]}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xl font-bold text-slate-900">
                    {fullName(mother)}
                  </h3>
                  <p className="text-xs font-medium text-muted">
                    {mother.motherId}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => openChildForm(mother)}
                    aria-label={`Register a child for ${fullName(mother)}`}
                    title="Add child"
                    className="btn-touch rounded-lg text-primary transition hover:bg-primary/10 active:scale-90"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => setPendingRemoval(mother)}
                    aria-label={`Deactivate the record for ${fullName(mother)}`}
                    title="Deactivate record"
                    className="btn-touch rounded-lg text-rose-500 transition hover:bg-rose-50 active:scale-90"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2 px-5 text-sm text-muted sm:px-6">
                <p className="flex items-center gap-2">
                  <Phone size={14} className="shrink-0 text-slate-400" />
                  {mother.contactInfo?.phoneNumber ?? "—"}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="shrink-0 text-slate-400" />
                  <span className="truncate">
                    {mother.address?.kebele}, {mother.address?.wereda}
                  </span>
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 p-5 pt-4 sm:p-6 sm:pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted">
                    TT / Rh Status
                  </p>
                  <p className="flex items-center gap-1 text-xs font-bold text-primary">
                    <Baby size={13} /> {mother.childrenIds?.length ?? 0}
                  </p>
                </div>

                <div className="no-scrollbar mask-fade-x flex gap-1.5 overflow-x-auto pb-1">
                  {(mother.schedule ?? []).map((dose) => (
                    <span
                      key={dose.vaccineName}
                      title={`${dose.vaccineName}: ${dose.status} (due ${formatDate(dose.dueDate)})`}
                      className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${dosePill(dose.status)}`}
                    >
                      {dose.vaccineName}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------- *
       * Mother registration
       * ------------------------------------------------------- */}
      <Modal
        open={form === "mother"}
        onClose={closeForm}
        title="New Mother Registration"
        size="max-w-2xl"
      >
        <form onSubmit={submitMother} className="space-y-5">
          <p className="flex items-center gap-2 rounded-xl bg-primary/[0.06] p-3 text-sm text-slate-600">
            <Syringe size={16} className="shrink-0 text-primary" />A TT1–TT5 and
            Rh schedule is generated automatically from today.
          </p>

          {error && <Alert kind="error">{error}</Alert>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field
              label="First Name"
              required
              value={motherForm.firstName}
              onChange={(v) => setMotherForm({ ...motherForm, firstName: v })}
            />
            <Field
              label="Middle Name"
              value={motherForm.middleName}
              onChange={(v) => setMotherForm({ ...motherForm, middleName: v })}
            />
            <Field
              label="Last Name"
              required
              value={motherForm.lastName}
              onChange={(v) => setMotherForm({ ...motherForm, lastName: v })}
            />
            <Field
              label="Date of Birth"
              type="date"
              required
              value={motherForm.birthDate}
              onChange={(v) => setMotherForm({ ...motherForm, birthDate: v })}
            />
            <label className="space-y-2">
              <span className="mb-2 ml-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Droplet size={15} className="text-primary" /> Blood Type
              </span>
              <select
                className="input"
                value={motherForm.bloodType}
                onChange={(e) =>
                  setMotherForm({ ...motherForm, bloodType: e.target.value })
                }
              >
                <option value="">Unknown</option>
                {BLOOD_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <Field
              label="Phone Number"
              type="tel"
              required
              icon={Phone}
              placeholder="+251911000000"
              value={motherForm.phoneNumber}
              onChange={(v) => setMotherForm({ ...motherForm, phoneNumber: v })}
            />
            <Field
              label="Zone"
              required
              icon={MapPin}
              value={motherForm.zone}
              onChange={(v) => setMotherForm({ ...motherForm, zone: v })}
            />
            <Field
              label="Wereda"
              required
              value={motherForm.wereda}
              onChange={(v) => setMotherForm({ ...motherForm, wereda: v })}
            />
            <Field
              label="Kebele"
              required
              value={motherForm.kebele}
              onChange={(v) => setMotherForm({ ...motherForm, kebele: v })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeForm} className="btn btn-soft">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving…
                </>
              ) : (
                <>
                  <UserPlus size={17} /> Complete Registration
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------- *
       * Child registration
       * ------------------------------------------------------- */}
      <Modal
        open={form?.type === "child"}
        onClose={closeForm}
        title="Register Child"
        size="max-w-2xl"
      >
        {form?.type === "child" && (
          <form onSubmit={submitChild} className="space-y-5">
            <p className="flex items-center gap-2 rounded-xl bg-primary/[0.06] p-3 text-sm text-slate-600">
              <HeartHandshake size={16} className="shrink-0 text-primary" />
              Mother:{" "}
              <strong className="text-slate-900">
                {fullName(form.mother)}
              </strong>{" "}
              ({form.mother.motherId})
            </p>

            {error && <Alert kind="error">{error}</Alert>}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field
                label="First Name"
                required
                value={childForm.firstName}
                onChange={(v) => setChildForm({ ...childForm, firstName: v })}
              />
              <Field
                label="Middle Name"
                value={childForm.middleName}
                onChange={(v) => setChildForm({ ...childForm, middleName: v })}
              />
              <Field
                label="Last Name"
                required
                value={childForm.lastName}
                onChange={(v) => setChildForm({ ...childForm, lastName: v })}
              />
              <Field
                label="Date of Birth"
                type="date"
                required
                icon={CalendarDays}
                value={childForm.birthDate}
                onChange={(v) => setChildForm({ ...childForm, birthDate: v })}
              />
              <label className="space-y-2">
                <span className="mb-2 ml-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Droplet size={15} className="text-primary" /> Blood Type
                </span>
                <select
                  className="input"
                  value={childForm.bloodType}
                  onChange={(e) =>
                    setChildForm({ ...childForm, bloodType: e.target.value })
                  }
                >
                  <option value="">Unknown</option>
                  {BLOOD_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <Field
                label="Birth Weight"
                type="number"
                step="0.1"
                icon={Ruler}
                placeholder="kg"
                value={childForm.birthWeight}
                onChange={(v) => setChildForm({ ...childForm, birthWeight: v })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
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
                    <Baby size={17} /> Register &amp; Generate Schedule
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        onConfirm={confirmRemoval}
        title="Deactivate this record?"
        description={`“${fullName(pendingRemoval)}” will be deactivated and hidden from active lists. The record and its vaccination history are kept.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
};

export default RegistrarDashboard;
