import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Tag,
  Search,
  Syringe,
  Users,
  ShieldCheck,
  ArrowRight,
  Activity,
  HeartHandshake,
  CheckCircle2,
  Baby,
  Building2,
  Bell,
  FileText,
} from "lucide-react";
import api from "../api/axios";
import { Reveal, EmptyState, Skeleton } from "../components/ui";

/* ------------------------------------------------------------------ *
 * Content
 *
 * These mirror the protocol in `children/utils/schedule-generator.ts`
 * on the backend. Kept as data here so the marketing page can show the
 * real schedule rather than a placeholder.
 * ------------------------------------------------------------------ */
const SCHEDULE = [
  { age: "At birth", doses: ["BCG", "OPV 0"] },
  { age: "6 weeks", doses: ["OPV 1", "Pentavalent 1", "PCV 1", "Rota 1"] },
  { age: "10 weeks", doses: ["OPV 2", "Pentavalent 2", "PCV 2", "Rota 2"] },
  { age: "14 weeks", doses: ["OPV 3", "Pentavalent 3", "PCV 3", "IPV"] },
  { age: "9 months", doses: ["Measles 1"] },
  { age: "15 months", doses: ["Measles 2"] },
];

const MATERNAL = ["TT1", "TT2", "TT3", "TT4", "TT5", "Rh"];

const FEATURES = [
  {
    Icon: Bell,
    title: "Doses surface before they are missed",
    body: "The schedule is generated from the birth date, so every visit is due on time rather than reconstructed afterwards.",
  },
  {
    Icon: ShieldCheck,
    title: "A contraindication blocks the dose",
    body: "A doctor can flag a contraindication or a severe reaction, and the system refuses to record a vaccine until it is cleared.",
  },
  {
    Icon: FileText,
    title: "Batch numbers on every dose",
    body: "Each administration records its batch, the clinician and the clinic, so any dose can be traced later.",
  },
  {
    Icon: Building2,
    title: "One record per family",
    body: "Children link to their mother, and each mother carries her own TT and Rh schedule alongside her children’s.",
  },
];

const ROLES = [
  {
    Icon: ShieldCheck,
    role: "Administrator",
    body: "Accounts, roles and programme-wide analytics.",
  },
  {
    Icon: Users,
    role: "Registrar",
    body: "Register mothers and children; the schedule builds itself.",
  },
  {
    Icon: Activity,
    role: "Medical staff",
    body: "Review the worklist and administer doses.",
  },
  {
    Icon: HeartHandshake,
    role: "Parent",
    body: "See what is due, what is done and what is next.",
  },
];

const STEPS = [
  {
    title: "Register the mother",
    body: "Her TT1–TT5 and Rh schedule is generated on save.",
  },
  {
    title: "Register the children",
    body: "Each child gets the full 16-dose schedule from their birth date.",
  },
  {
    title: "Record each visit",
    body: "Batch, clinician and clinic are captured as the dose is given.",
  },
];

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get("/posts", { params });
      setPosts(data);
    } catch {
      // The landing page stays usable if the feed cannot be loaded.
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    api
      .get("/posts/categories")
      .then(({ data }) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  // Debounced so each keystroke does not hit the API.
  useEffect(() => {
    const timer = setTimeout(fetchPosts, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchPosts, search]);

  const heading = useMemo(
    () => (category ? `${category} news` : "Immunization news"),
    [category],
  );

  return (
    <>
      {/* ---------------------------------------------------------- *
       * Hero
       * ---------------------------------------------------------- */}
      <section className="relative -mt-8 overflow-hidden pb-4 pt-8 sm:pt-10 md:pt-16">
        <div
          className="animate-breathe pointer-events-none absolute -left-32 -top-24 h-[26rem] w-[26rem] rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="animate-breathe pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-primary-light/10 blur-3xl"
          style={{ animationDelay: "1.8s" }}
          aria-hidden="true"
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-3.5 py-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-primary shadow-sm backdrop-blur sm:text-xs"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Infant immunization system
            </motion.p>

            <h1 className="mb-5 text-[2.125rem] font-extrabold leading-[1.08] tracking-tight text-balance text-slate-900 sm:mb-6 sm:text-5xl lg:text-6xl">
              Every dose your child needs,{" "}
              <span className="text-gradient-animated">
                tracked and on time.
              </span>
            </h1>

            <p className="mb-7 max-w-xl text-base leading-relaxed text-balance text-muted sm:mb-8 sm:text-lg">
              A shared record for health centres and families. Register infants
              and mothers once, follow the national schedule, and log every
              vaccination as it is given — with the batch number attached.
            </p>

            <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:flex-wrap">
              <Link
                to="/register"
                className="btn btn-primary !px-6 !py-3.5 text-sm sm:text-base"
              >
                Create a parent account <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="btn btn-soft !px-6 !py-3.5 text-base"
              >
                Staff sign in
              </Link>
            </div>

            <dl className="grid max-w-lg grid-cols-3 gap-3 border-t border-slate-200 pt-6 sm:gap-6 sm:pt-7">
              {[
                { value: "16", label: "Dose schedule" },
                { value: "6", label: "Maternal TT/Rh" },
                { value: "4", label: "Access roles" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <dt className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                    {value}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-muted">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Schedule preview. Doubles as the hero visual and as real
              information about what the system tracks. */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="card !p-0"
          >
            <header className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/25">
                <Syringe size={19} />
              </span>
              <div>
                <p className="font-bold text-slate-900">Infant schedule</p>
                <p className="text-xs text-muted">
                  Generated from the birth date
                </p>
              </div>
            </header>

            <ol className="divide-y divide-slate-100">
              {SCHEDULE.map((row, index) => (
                <motion.li
                  key={row.age}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.07, duration: 0.4 }}
                  className="flex items-start gap-4 px-6 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <span className="w-20 shrink-0 pt-0.5 text-xs font-bold uppercase tracking-wide text-primary">
                    {row.age}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {row.doses.map((dose) => (
                      <span
                        key={dose}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
                      >
                        {dose}
                      </span>
                    ))}
                  </span>
                </motion.li>
              ))}
            </ol>

            <footer className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">
                Maternal
              </span>
              {MATERNAL.map((dose) => (
                <span
                  key={dose}
                  className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-role-registrar ring-1 ring-role-registrar/20"
                >
                  {dose}
                </span>
              ))}
            </footer>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- *
       * How it works
       * ---------------------------------------------------------- */}
      <section className="py-16">
        <Reveal>
          <p className="nav-section-label !px-0">How it works</p>
          <h2 className="mb-6 max-w-2xl text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:mb-10 sm:text-3xl">
            Three steps from registration to a complete record
          </h2>
        </Reveal>

        <ol className="grid gap-5 sm:gap-6 md:grid-cols-3">
          {STEPS.map(({ title, body }, index) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="card relative"
            >
              <span className="absolute -top-4 left-6 grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-sm font-extrabold text-white shadow-lg">
                {index + 1}
              </span>
              <h3 className="mb-2 mt-3 text-lg font-bold text-slate-900">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{body}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------------- *
       * Features
       * ---------------------------------------------------------- */}
      <section className="pb-16">
        <Reveal>
          <p className="nav-section-label !px-0">Why it matters</p>
          <h2 className="mb-6 max-w-2xl text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:mb-10 sm:text-3xl">
            Built around the decisions a clinic actually has to make
          </h2>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
          {FEATURES.map(({ Icon, title, body }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                delay: index * 0.08,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="card group"
            >
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-transform duration-300 group-hover:scale-110">
                <Icon size={22} />
              </span>
              <h3 className="mb-1.5 text-lg font-bold text-slate-900">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- *
       * Roles
       * ---------------------------------------------------------- */}
      <section className="pb-16">
        <Reveal>
          <p className="nav-section-label !px-0">Who uses it</p>
          <h2 className="mb-6 max-w-2xl text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:mb-10 sm:text-3xl">
            Four roles, each with a different view
          </h2>
        </Reveal>

        <div className="card !p-0">
          <ul className="divide-y divide-slate-100">
            {ROLES.map(({ Icon, role, body }, index) => (
              <motion.li
                key={role}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="row-hover flex items-center gap-4 px-5 py-4 sm:gap-5 sm:px-6 sm:py-5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{role}</p>
                  <p className="text-sm text-muted">{body}</p>
                </div>
                <CheckCircle2
                  size={18}
                  className="hidden shrink-0 text-primary sm:block"
                />
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------- *
       * Feed
       * ---------------------------------------------------------- */}
      <section aria-label="Announcements">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="nav-section-label !px-0">From the clinic</p>
            <h2 className="text-2xl font-extrabold capitalize tracking-tight text-balance text-slate-900 sm:text-3xl">
              {heading}
            </h2>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <div className="relative min-w-[14rem] flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
                aria-hidden="true"
              />
              <input
                aria-label="Search announcements"
                className="input pl-11"
                placeholder="Search announcements…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              aria-label="Filter by category"
              className="input w-auto min-w-[10rem]"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card !p-0">
                <Skeleton className="h-44 rounded-t-[16px]" />
                <div className="space-y-3 p-7">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={search || category ? Tag : Baby}
            title={
              search || category
                ? "Nothing matches that filter"
                : "No announcements yet"
            }
            description={
              search || category
                ? "Try a different search or category."
                : "Notices published by the clinic will appear here."
            }
            action={
              (search || category) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                  }}
                  className="btn btn-soft"
                >
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <motion.article
                key={post._id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.07,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="card group flex h-full flex-col !p-0"
              >
                <div className="relative h-40 overflow-hidden sm:h-44">
                  {post.images && post.images.length > 0 ? (
                    <img
                      src={post.images[0]}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-gradient-to-br from-primary/10 to-primary/[0.03]">
                      <Tag
                        className="text-primary/25 transition-transform duration-500 group-hover:scale-110"
                        size={42}
                      />
                    </div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary shadow-sm backdrop-blur">
                    {post.category}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
                    <Calendar size={13} />{" "}
                    {new Date(post.dateOfPost).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <h3 className="mb-2.5 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="line-clamp-4 flex-1 text-sm leading-relaxed whitespace-pre-line text-muted">
                    {post.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------- *
       * Closing call to action
       * ---------------------------------------------------------- */}
      <section className="mt-16">
        <div className="surface-glow card relative overflow-hidden !border-0 bg-slate-900 px-5 py-10 text-center text-white sm:px-8 sm:py-12 md:px-16">
          <div
            className="animate-breathe pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
            aria-hidden="true"
          />
          <Syringe
            className="pointer-events-none absolute -bottom-10 -right-6 text-white/[0.04]"
            size={220}
            aria-hidden="true"
          />

          <div className="relative">
            <h2 className="mx-auto mb-4 max-w-2xl text-2xl font-extrabold tracking-tight text-balance sm:text-3xl md:text-4xl">
              Start with your family’s record
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-slate-300">
              Creating a parent account takes a minute. Staff accounts are
              created by an administrator.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/register"
                className="btn btn-primary !px-6 !py-3.5 text-sm sm:text-base"
              >
                Create an account <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="btn !border-white/25 !bg-white/5 !px-6 !py-3.5 text-base !text-white hover:!bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-12 border-t border-slate-200 py-8">
        <div className="flex flex-col items-start gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="flex items-center gap-2">
            <Activity size={15} className="text-primary" />
            Infant Immunization Management System
          </p>
          <p>
            Schedule data follows the national immunisation programme. Always
            confirm against your clinic’s current protocol.
          </p>
        </div>
      </footer>
    </>
  );
};

export default Home;
