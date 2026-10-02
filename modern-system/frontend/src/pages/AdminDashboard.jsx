import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users,
  Baby,
  HeartHandshake,
  FileText,
  Search,
  UserPlus,
  ShieldCheck,
  UserX,
  UserCheck,
  Trash2,
  Megaphone,
  X,
  Mail,
  Phone,
  Lock,
  User,
} from "lucide-react";
import api from "../api/axios";
import { fullName } from "../utils/format";
import { apiErrorMessage } from "../utils/apiError";
import {
  StatCard,
  PageHeader,
  Alert,
  Collapse,
  Modal,
  ConfirmDialog,
  EmptyState,
  Skeleton,
  SearchInput,
  Field,
  Tooltip,
  Avatar,
  useToast,
} from "../components/ui";

const ROLES = ["admin", "registrar", "doctor", "parent"];

const ROLE_STYLES = {
  admin: "bg-role-admin/10 text-role-admin",
  registrar: "bg-role-registrar/10 text-role-registrar",
  doctor: "bg-role-doctor/10 text-role-doctor",
  parent: "bg-role-parent/10 text-role-parent",
};

const emptyForm = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  phoneNumber: "",
  role: "registrar",
  password: "",
};

/** Filter chips for the accounts table, with live counts per role. */
const ROLE_FILTERS = [
  { value: "all", label: "Everyone" },
  ...ROLES.map((role) => ({ value: role, label: role })),
];

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [pendingDeactivation, setPendingDeactivation] = useState(null);
  const { notify } = useToast();

  const load = useCallback(async () => {
    setError("");
    try {
      const [usersResponse, statsResponse] = await Promise.all([
        api.get("/users", { params: { activeOnly: false } }),
        api.get("/health/stats").catch(() => null),
      ]);
      setUsers(usersResponse.data);
      setStats(statsResponse?.data ?? null);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load users"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (!term) return true;
      return `${fullName(user)} ${user.email} ${user.username ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [users, search, roleFilter]);

  /** Role counts for the filter chips. */
  const roleCounts = useMemo(
    () =>
      ROLES.reduce(
        (acc, role) => ({
          ...acc,
          [role]: users.filter((u) => u.role === role).length,
        }),
        {},
      ),
    [users],
  );

  /**
   * Deactivation is signed in and stops the user reaching their own
   * account, so it goes through a confirmation. Reactivation is
   * harmless and fires immediately.
   */
  const setActivation = async (user, activate) => {
    setBusyId(user.id);
    setError("");
    try {
      if (activate) {
        // PATCH /users/:id accepts isActive, so re-enabling reuses that route.
        await api.patch(`/users/${user.id}`, { isActive: true });
      } else {
        await api.patch(`/users/${user.id}/deactivate`);
      }
      notify(
        `${fullName(user)} has been ${activate ? "reactivated" : "deactivated"}.`,
      );
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Action failed"));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDeactivation = async () => {
    const user = pendingDeactivation;
    if (!user) return;
    await setActivation(user, false);
  };

  const onToggleActivation = (user) => {
    if (user.isActive) setPendingDeactivation(user);
    else setActivation(user, true);
  };

  const changeRole = async (user, role) => {
    if (role === user.role) return;
    setBusyId(user.id);
    setError("");
    try {
      await api.patch(`/users/${user.id}`, { role });
      notify(`${fullName(user)} is now a ${role}.`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not change role"));
      // Re-render so the select snaps back to the stored role.
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const createUser = async (event) => {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api.post("/users", form);
      setShowCreate(false);
      setForm(emptyForm);
      notify("Account created.");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create user"));
    } finally {
      setCreating(false);
    }
  };

  const summaryCards = [
    {
      label: "Users",
      value: stats?.totalUsers ?? users.length,
      icon: Users,
      tone: "primary",
    },
    {
      label: "Mothers",
      value: stats?.totalMothers ?? "—",
      icon: HeartHandshake,
      tone: "registrar",
    },
    {
      label: "Children",
      value: stats?.totalChildren ?? "—",
      icon: Baby,
      tone: "parent",
    },
    {
      label: "Active accounts",
      value: users.filter((u) => u.isActive).length,
      icon: UserCheck,
      tone: "doctor",
      hint:
        users.filter((u) => !u.isActive).length > 0
          ? `${users.filter((u) => !u.isActive).length} disabled`
          : "All accounts active",
    },
  ];

  return (
    <div>
      <PageHeader
        title="System Administration"
        subtitle="Manage accounts, roles and access"
        icon={ShieldCheck}
        tone="admin"
        action={
          <button
            onClick={() => setShowCreate((open) => !open)}
            className="btn btn-primary"
          >
            {showCreate ? <X size={18} /> : <UserPlus size={18} />}
            {showCreate ? "Cancel" : "New Account"}
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <StatCard
            key={card.label}
            {...card}
            loading={loading}
            index={index}
          />
        ))}
      </div>

      <Collapse open={showCreate}>
        <form onSubmit={createUser} className="card space-y-5">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <UserPlus size={20} className="text-primary" /> Create Staff Account
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field
              label="First Name"
              icon={User}
              required
              value={form.firstName}
              onChange={(v) => setForm({ ...form, firstName: v })}
            />
            <Field
              label="Last Name"
              icon={User}
              required
              value={form.lastName}
              onChange={(v) => setForm({ ...form, lastName: v })}
            />
            <Field
              label="Username"
              hint="Optional, used to sign in"
              icon={User}
              value={form.username}
              onChange={(v) => setForm({ ...form, username: v })}
            />
            <Field
              label="Email"
              type="email"
              icon={Mail}
              required
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Field
              label="Phone Number"
              type="tel"
              icon={Phone}
              placeholder="+251911000000"
              required
              value={form.phoneNumber}
              onChange={(v) => setForm({ ...form, phoneNumber: v })}
            />
            <label className="space-y-2">
              <span className="mb-2 ml-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <ShieldCheck size={15} className="text-primary" /> Role
              </span>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Temporary Password"
              type="password"
              icon={Lock}
              className="md:col-span-3"
              hint="8+ characters with an uppercase letter, a lowercase letter, a number and a symbol."
              minLength={8}
              required
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
            />
          </div>

          <button type="submit" disabled={creating} className="btn btn-primary">
            {creating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Creating…
              </>
            ) : (
              <>
                <ShieldCheck size={18} /> Create Account
              </>
            )}
          </button>
        </form>
      </Collapse>

      <AnimatePresence>
        {error && (
          <div className="mt-6">
            <Alert kind="error">{error}</Alert>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------- *
       * Account table
       * ------------------------------------------------------- */}
      <section className="card mt-6 !p-0 anchor-offset" id="accounts">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Accounts</h2>
              <p className="text-sm text-muted">
                {loading
                  ? "Loading…"
                  : `${filtered.length} of ${users.length} shown`}
              </p>
            </div>
            <div className="w-full sm:w-80">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search name, email or username…"
                label="Search accounts"
              />
            </div>
          </div>

          {/* Role filter chips. Counts stay visible so an admin can see
              the whole shape of the system, not just the filtered slice. */}
          {!loading && (
            <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
              {ROLE_FILTERS.map((chip) => {
                const count =
                  chip.value === "all"
                    ? users.length
                    : (roleCounts[chip.value] ?? 0);
                const active = roleFilter === chip.value;

                return (
                  <button
                    key={chip.value}
                    onClick={() => setRoleFilter(chip.value)}
                    aria-pressed={active}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-bold capitalize transition-all duration-200 active:scale-95 ${
                      active
                        ? "border-primary bg-primary text-white shadow-md shadow-primary/25"
                        : "border-slate-200 bg-white/70 text-slate-600 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {chip.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[0.6875rem] ${
                        active ? "bg-white/25" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Search}
              title="No accounts match your search"
              description="Try a different name, email address or username."
            />
          </div>
        ) : (
          <div className="scroll-x max-h-[32rem] overflow-y-auto">
            <table className="w-full min-w-[52rem] text-left">
              <thead className="table-head text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr key={user.id} className="row-hover">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={fullName(user) || user.email} size={40} />
                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-900">
                            {fullName(user)}
                          </div>
                          <div className="truncate text-xs text-muted">
                            {user.username
                              ? `@${user.username}`
                              : user.id.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="truncate text-slate-600">
                        {user.email}
                      </div>
                      <div className="truncate text-muted">
                        {user.profile?.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Role for ${fullName(user)}`}
                        className={`input !w-auto !rounded-full !py-1 !pl-3 !pr-8 text-xs font-bold ${ROLE_STYLES[user.role] ?? ""}`}
                        value={user.role}
                        disabled={busyId === user.id}
                        onChange={(e) => changeRole(user, e.target.value)}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`badge ${user.isActive ? "badge-success" : "badge-danger"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.isActive ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          aria-hidden="true"
                        />
                        {user.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {user.security?.lastLogin
                        ? new Date(user.security.lastLogin).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Tooltip
                        label={
                          user.isActive
                            ? `Deactivate ${fullName(user)}`
                            : `Reactivate ${fullName(user)}`
                        }
                        side="left"
                      >
                        <button
                          onClick={() => onToggleActivation(user)}
                          disabled={busyId === user.id}
                          aria-label={
                            user.isActive
                              ? `Deactivate ${fullName(user)}`
                              : `Reactivate ${fullName(user)}`
                          }
                          className={`btn btn-touch !p-2.5 !rounded-lg transition disabled:opacity-50 ${
                            user.isActive
                              ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {user.isActive ? (
                            <UserX size={16} />
                          ) : (
                            <UserCheck size={16} />
                          )}
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-8 anchor-offset" id="announcements">
        <PostsPanel />
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeactivation)}
        onClose={() => setPendingDeactivation(null)}
        onConfirm={confirmDeactivation}
        title="Deactivate this account?"
        description={`${fullName(pendingDeactivation)} will be signed out and blocked from signing in again. Their records are kept and the account can be reactivated at any time.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
};

/** Create/remove public posts, mirroring the PHP admin post manager. */
const PostsPanel = () => {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Announcement");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const { notify } = useToast();

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/posts");
      setPosts(data);
    } catch {
      // Non-critical: the panel is supplementary.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addPost = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/posts", { title, category, description });
      setTitle("");
      setDescription("");
      setOpen(false);
      notify("Announcement published.");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not publish post"));
    }
  };

  const removePost = (post) => {
    // Destructive and not reversible from the UI, so confirm first.
    setPendingDelete(post);
  };

  const confirmDelete = async () => {
    const post = pendingDelete;
    if (!post) return;
    await api.delete(`/posts/${post._id}`).catch(() => undefined);
    notify("Announcement removed.");
    await load();
  };

  return (
    <section className="card !p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Megaphone size={19} className="text-primary" /> Announcements
        </h2>
        <button
          onClick={() => setOpen(true)}
          className="btn btn-primary !px-4 !py-2 text-sm"
        >
          <FileText size={16} /> New post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Publish a notice and it appears immediately on the public feed."
            action={
              <button onClick={() => setOpen(true)} className="btn btn-primary">
                <FileText size={16} /> Publish the first one
              </button>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {posts.map((post) => (
            <motion.li
              key={post._id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group row-hover flex items-start justify-between gap-4 p-6"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {post.title}
                </p>
                <p className="text-xs text-muted">
                  {post.category} ·{" "}
                  {new Date(post.dateOfPost).toLocaleDateString()}
                </p>
              </div>
              <Tooltip label={`Delete ${post.title}`} side="left">
                <button
                  onClick={() => removePost(post)}
                  aria-label={`Delete ${post.title}`}
                  className="btn-touch shrink-0 rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-90"
                >
                  <Trash2 size={16} />
                </button>
              </Tooltip>
            </motion.li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Publish an announcement"
        size="max-w-lg"
      >
        <form onSubmit={addPost} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Title"
              icon={FileText}
              required
              value={title}
              onChange={setTitle}
            />
            <Field
              label="Category"
              icon={Megaphone}
              required
              value={category}
              onChange={setCategory}
            />
          </div>
          <textarea
            className="input"
            rows={4}
            placeholder="Announcement text"
            aria-label="Announcement text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {error && <Alert kind="error">{error}</Alert>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-soft"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <FileText size={17} /> Publish
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this announcement?"
        description={`“${pendingDelete?.title}” will be removed from the public feed. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </section>
  );
};

export default AdminDashboard;
