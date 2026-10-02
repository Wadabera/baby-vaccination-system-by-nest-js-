/**
 * Small shared helpers for rendering API payloads.
 *
 * The API nests person data under `personalInfo`, which is easy to forget, so
 * these helpers read from both the nested and the flat shape.
 */

/** Full name for a mother, child or user record. */
export const fullName = (record) => {
  if (!record) return "";
  const info = record.personalInfo ?? record.profile ?? record;
  return [info.firstName, info.middleName, info.lastName]
    .filter(Boolean)
    .join(" ");
};

/** Birth date from whichever shape the record uses. */
export const birthDateOf = (record) => {
  const info = record?.personalInfo ?? record?.profile ?? record;
  return info?.birthDate ?? null;
};

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

/** Whole months elapsed since a birth date, used for the R1-R5 schedule. */
export const ageInMonths = (birthDate) => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (birth.getDate() > now.getDate()) months -= 1;
  return Math.max(months, 0);
};

const STATUS_STYLES = {
  completed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
  missed: "bg-gray-100 text-gray-600",
};

/** Badge class for a dose status. */
export const statusStyle = (status) =>
  STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";

/** Completed / total for a schedule array. */
export const progressOf = (schedule = []) => {
  const total = schedule.length;
  const done = schedule.filter((dose) => dose.status === "completed").length;
  const overdue = schedule.filter((dose) => dose.status === "overdue").length;
  return {
    total,
    done,
    overdue,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export { BLOOD_TYPES };
