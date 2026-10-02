# Infant Vaccination Management System — User Manual

Complete operating guide for every role in the system, written for clinic staff
and administrators rather than developers.

- **For installation and API reference:** see [`README.md`](README.md)
- **For database internals:** see [`backend/src/children/README.md`](backend/src/children/README.md)

---

## Table of contents

1. [What this system is for](#1-what-this-system-is-for)
2. [The two kinds of person in the system](#2-the-two-kinds-of-person-in-the-system)
3. [Roles at a glance](#3-roles-at-a-glance)
4. [Before you start: installation](#4-before-you-start-installation)
5. [Common concepts](#5-common-concepts)
6. [Parent — step by step](#6-parent--step-by-step)
7. [Registrar — step by step](#7-registrar--step-by-step)
8. [Doctor — step by step](#8-doctor--step-by-step)
9. [Administrator — step by step](#9-administrator--step-by-step)
10. [Printing and reports](#10-printing-and-reports)
11. [Reminders and notifications](#11-reminders-and-notifications)
12. [Security behaviour you will notice](#12-security-behaviour-you-will-notice)
13. [Known gaps and limitations](#13-known-gaps-and-limitations)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. What this system is for

The system records a child's vaccinations from birth to fifteen months, and a
mother's tetanus doses, so that:

- Nobody misses a dose because nobody noticed it was due.
- Any dose can be traced to the batch it came from.
- A parent can see their own family's progress without phoning the clinic.
- A clinician cannot accidentally vaccinate a child who has a contraindication.

The schedule is **generated**, not typed. When a child's date of birth is
recorded, the system builds the full 16-dose schedule with correct due dates.
There is no way to forget to schedule a dose, because scheduling is a
consequence of registering the child.

### The infant schedule

| Age | Doses given |
| --- | --- |
| At birth | BCG, OPV 0 |
| 6 weeks | OPV 1, Pentavalent 1, PCV 1, Rota 1 |
| 10 weeks | OPV 2, Pentavalent 2, PCV 2, Rota 2 |
| 14 weeks | OPV 3, Pentavalent 3, PCV 3, IPV |
| 9 months | Measles 1 |
| 15 months | Measles 2 |

**16 doses in total.**

### The maternal schedule

Mothers receive **TT1, TT2, TT3, TT4, TT5 and Rh** — six doses. Like the infant
schedule, these are dated automatically when the mother is registered. TT1
becomes due immediately.

---

## 2. The two kinds of person in the system

This is the single most important thing to understand, and the two words sound
similar enough to be confused.

**A parent is an account. A mother is a patient record.**

| | Parent | Mother |
| --- | --- | --- |
| What it is | A login that grants access | A person being cared for |
| Stored in | `users` collection | `mothers` collection |
| Has | Email, password, role | Blood type, address, medical history, TT schedule |
| Signs in? | Yes | **No** — not a login |
| Can be four roles | admin / registrar / doctor / parent | n/a |

They do not have to correspond. A system may hold three mother records and one
parent account. A parent account is only a key that opens certain records.

The connection is made by an array of child IDs stored on the user's record,
called `childrenIds`. **When a parent account is not linked to any child, the
parent portal is empty.** See [section 13](#13-known-gaps-and-limitations) — this
is currently a real limitation, and it affects you if you self-register.

---

## 3. Roles at a glance

| Capability | Admin | Registrar | Doctor | Parent |
| --- | :---: | :---: | :---: | :---: |
| See every child in the programme | ✅ | ✅ | ✅ | ❌ |
| See only your own children | ✅ | ✅ | ✅ | ✅ |
| Register a mother | ✅ | ✅ | ❌ | ❌ |
| Register a child | ✅ | ✅ | ❌ | ❌ |
| Record a vaccination | ✅ | ❌ | ✅ | ❌ |
| Flag / clear a contraindication | ✅ | ❌ | ✅ | ❌ |
| Issue a TT dose | ✅ | ✅ | ✅ | ❌ |
| Create staff accounts | ✅ | ❌ | ❌ | ❌ |
| Change someone's role | ✅ | ❌ | ❌ | ❌ |
| Manage clinics and their staff | ✅ | ❌ | ❌ | ❌ |
| Publish / delete announcements | ✅ | ✅ (create) | ❌ | ❌ |
| Programme-wide analytics | ✅ | ✅ | ✅ | ❌ |
| Register a new account | ❌ | ❌ | ❌ | ✅ |

These are enforced **on the server**, not merely hidden in the interface.
Changing a role by hand-editing a request will not work.

---

## 4. Before you start: installation

### One-time setup

```bash
cd modern-system
```

**Backend**

```bash
cd backend
npm install
cp .env.example .env      # edit MONGODB_URI if you are not using Atlas
npm run db:check          # confirms the database is reachable
npm run seed              # creates demo accounts and demo records
npm run start:dev         # http://localhost:5000/api
```

**Frontend** — in a second terminal

```bash
cd frontend
npm install
npm run dev               # http://localhost:3000
```

Open <http://localhost:3000>.

### Checking it works

`npm run seed` prints a summary. You should see four accounts created, plus a
clinic, a mother and children. If a line says `exists:` instead of `created:`,
that record was already there — this is normal and the seed is safe to re-run.

### Demo accounts

`npm run seed` creates one account per role. The password is the same for all
of them: **`Vaccinate@2024`**

| Role | Username | What you can see |
| --- | --- | --- |
| admin | `admin` | Everything, including accounts |
| registrar | `registrar` | Mothers and children |
| doctor | `doctor` | All children, dose administration |
| parent | `parent` | Two children with real progress |

**The sign-in page has one-click buttons for these four roles.** Click a role to
fill the username and password, then press Sign In. This is the fastest way to
demonstrate the system to someone else.

You can also sign in with an email address instead of a username.

### Demo records

The seed creates, and can repair, the following:

- Clinic `CL000001`
- Mother `M00000001` — Selam Gebremariam
- Child `C00000001` — Dawit, 4 months old
- Child `C00090002` — Selam, 11 months old

Both children are linked to the demo parent account **and** to the mother, and
carry partially completed dose histories with batch numbers. This is deliberate:
a schedule where nothing has been given looks broken, and tells you nothing
about how the interface behaves with real data.

---

## 5. Common concepts

### Dose status

Every dose on a schedule is one of four states:

| Status | Meaning |
| --- | --- |
| `pending` | Scheduled, not yet due or not yet given |
| `completed` | Given. Has a date, a batch number, and who gave it |
| `overdue` | Past its due date and still not given |
| `missed` | Marked as missed |

### Coverage percentage

Completed doses ÷ total doses on the schedule. The parent portal and the
health card show this as a ring and a number.

### Contraindication

A clinical reason a child must **not** be vaccinated right now — for example a
high fever, or a prior severe reaction. A doctor can flag one at any time.

**While an active contraindication exists, the system refuses to record a dose
for that child.** The error message names the blocker. This is a hard rule, not
a warning; see [section 8](#8-doctor--step-by-step).

### Adverse reaction

A bad reaction to a previous dose. Like a contraindication, it blocks further
doses until a doctor resolves it.

---

## 6. Parent — step by step

### 6.1 Create your account

1. Go to <http://localhost:3000> and click **Sign Up**.
2. Fill in first name, last name, phone number, email and a password.
3. Middle name and username are optional — leave them blank if you prefer.
4. Press **Register Account**.

The password must have at least 8 characters including an uppercase letter, a
lowercase letter, a number and a symbol. `Vaccinate@2024` satisfies this.

You are signed in immediately and taken to the parent portal.

### 6.2 What you see

The portal shows, for each of your children:

- A **coverage ring** — how many of the 16 doses are done
- Name, date of birth, age
- The **next dose due**, marked *pending* or *overdue*
- A button to open the full health card

If any dose is overdue it is highlighted in red and summarised at the top.

### 6.3 Open a health card

Press **View Health Card**. You get:

- A coverage ring and summary counts
- The child's details and their mother's name
- Every dose on the schedule, on a timeline
- Batch number for each dose already given

Switch between **Timeline** (visual) and **Table** (the format a clinic reads
aloud) using the switch at the top.

### 6.4 Print

Press **Print Card**. The navigation and controls are removed from the print,
leaving the record only. Use **Table** view before printing.

### 6.5 Update your details

Use the account menu at the top right → **Go to dashboard**, or contact the
clinic to correct a name or phone number.

### 6.6 If your portal is empty

> "No child records linked to your account"

A newly registered parent has no children attached yet. A member of clinic staff
must link them. **There is currently no self-service way to do this** — see
[section 13](#13-known-gaps-and-limitations). Until then, contact the clinic and
give them your email address and your child's ID.

---

## 7. Registrar — step by step

Sign in as `registrar`.

### 7.1 Register a mother

1. Press **Register Mother**.
2. Fill in first name, last name, date of birth, phone number.
3. Blood type is optional.
4. Zone, Wereda and Kebele are required.
5. Press **Complete Registration**.

Her **TT1–TT5 and Rh schedule is created automatically**, dated from today. TT1
is due immediately. There is a confirmation message confirming this.

### 7.2 Register a child

On a mother's card, press the **+** button, or **Register Mother** →
select the mother.

1. Confirm the mother's name is shown at the top.
2. Fill in the child's first name, last name and date of birth.
3. Blood type and birth weight are optional.
4. Press **Register & Generate Schedule**.

The child's **full 16-dose schedule is generated from the birth date**, with
correct intervals. A confirmation message confirms the R1–R5 schedule.

> The birth date is the most important field you enter. Every due date is
> calculated from it. Please double-check it.

### 7.3 Review your caseload

The main screen shows, for each mother:

- Name, ID, phone number, address
- A **TT / Rh status** row of pills — green if completed, amber if pending, red
  if overdue
- Number of children

Press the **+** on a card to register another child for that mother.

### 7.4 Find someone

Use the search box to filter by name, ID or phone number. The count updates
live.

---

## 8. Doctor — step by step

Sign in as `doctor`.

### 8.1 Read the safety worklist

If any child carries an active contraindication or severe reaction, they appear
at the top of your screen in a highlighted table, with the number and type of
each flag. Review these first.

### 8.2 Find a child

Use the patient list, or switch the filter:

- **Due now** — children with a dose already past its due date
- **Safety flags** — only children carrying a contraindication
- **All patients**

The search box filters by name or child ID. Due children are ordered by how
overdue they are.

### 8.3 Record a vaccination

1. On the patient's card, press **Record** next to the due dose.
2. Enter the **batch number** from the vaccine vial — 6 to 20 letters, numbers or
   hyphens, e.g. `BATCH123456`. This is required for traceability.
3. Press **Record dose**.

The dose becomes completed with today's date, the batch number, and your name.

**If the child has an active contraindication, the dose is refused** and the
dialog tells you exactly what is blocking it. This is deliberate. Clear the
contraindication first, then record the dose.

**If you see `clinicId should not be empty`**, that child was registered without
a clinic. Re-assign the child to a clinic before recording doses.

### 8.4 Flag a contraindication

Open the child's record and add a contraindication with a reason. From that
moment:

- The child appears in your worklist
- The parent portal shows them as unsafe to vaccinate
- **Any attempt to record a dose is refused**, naming your contraindication

### 8.5 Clear a contraindication

Once the child is well, clear the contraindication. The dose can then be
recorded normally. **This is the only way to unblock a child** — there is no
override.

### 8.6 Open the full record

Press **Full Health Record** on a patient card for the health card view with the
complete dose history and batch numbers.

---

## 9. Administrator — step by step

Sign in as `admin`.

### 9.1 Create a staff account

1. Press **New Account**.
2. Fill in first name, last name, email, phone number.
3. Username is optional.
4. Choose the role: **admin**, **registrar**, **doctor** or **parent**.
5. Set a temporary password (8+ characters, mixed case, a number, a symbol).
6. Press **Create Account**.

Tell the new member of staff their username and password, and ask them to change
it. This is the **only** way a staff account is created — nobody can self-register
as staff.

### 9.2 Change a role or deactivate

In the accounts table:

- Use the **role dropdown** on a row to change someone's role immediately.
- Press the **red/green button** in the last column to deactivate or reactivate.
  Deactivation is confirmed first, because it immediately signs the person out.

Deactivated accounts keep all their records. They simply cannot sign in.

### 9.3 Find an account

The search box filters by name, email or username. The role chips above the table
filter by role and show a live count for each, so you can see the shape of the
system at a glance.

### 9.4 Announcements

The **Announcements** panel publishes notices to the public home page. Press
**New post**, give it a title and category, write the text, and publish.
Deleting is confirmed first.

### 9.5 Programme analytics

Via **Programme analytics** in the sidebar you get:

- Totals: infants, mothers, doses due, doses overdue
- A bar per vaccine showing overdue versus upcoming
- Recently registered children

Use **Refresh** on any dashboard to pull the latest data.

### 9.6 Link a parent to their children

This is currently an API-only operation, not exposed in the interface. To do it,
send:

```
PATCH /api/users/:id
{ "childrenIds": ["<childId1>", "<childId2>"] }
```

where `:id` is the parent user's ID and the values are the children's
`_id`s (not their `childId` codes like `C00000001`). See
[section 13](#13-known-gaps-and-limitations) — this is the main gap in the
system and the recommended fix.

---

## 10. Printing and reports

**Health card.** From any child's card, press **Print Card**. Choose **Table**
view first — it is the layout designed to be printed and read aloud. The
navigation, buttons and colour washes are removed automatically.

**Digital card file.** `POST /api/children/:id/digital-card` generates a
machine-readable card for a child.

**Programme report.** `GET /api/reports/immunization-card/:childId` returns the
card data as JSON for a specific child.

---

## 11. Reminders and notifications

`POST /api/notifications/queue-due` scans for children and mothers with pending
or overdue doses and writes reminder records for them.

**No messages are actually sent.** No SMS or email provider is connected.
Records are created with status `pending` (a reminder is warranted) or `skipped`.
This is intentional: the system does not claim a message was delivered when it
was not. `GET /api/notifications/due` lists what is waiting.

---

## 12. Security behaviour you will notice

**Five failed sign-ins locks an account for 15 minutes.** This is the main
protection against guessing passwords. It cannot be shortened from the interface.

**Rate limiting.** Credential endpoints allow 30 attempts per 15 minutes per IP
address. The cap is deliberately loose because a health centre shares one network
address across all its staff. `GET /auth/me` has a much larger budget (600/hour)
because it runs on every page load to restore your session.

**Sign-out is immediate.** Logging out invalidates the session server-side, not
just in the browser.

**You see only your own data as a parent.** The parent list is scoped on the
server, not filtered in the browser — you cannot reach another family's records
by changing the request.

**Passwords are never stored in readable form.** They are hashed with argon2id.
The old system's MD5 hashes are converted automatically the first time a
migrated account signs in.

---

## 13. Known gaps and limitations

These are real and current. None is a surprise to the developers; they are listed
so nobody is caught out during a demonstration.

### A new parent cannot see their children without staff help

**This is the most significant gap.** Registering at `/register` creates an
account with no children attached. Nothing in the interface lets a parent claim
a child, and nothing lets a registrar attach a child to a *parent account* —
the existing "link child" action attaches to the *mother record*, which is a
different thing (see [section 2](#2-the-two-kinds-of-person-in-the-system)).

Only an administrator can set it, and only through the API (section 9.6).

**Effect:** a genuinely self-registered parent sees an empty portal and must
phone the clinic.

**Workaround today:** use the seeded `parent` account, which is already linked.
**Recommended fix:** let a parent claim a child by entering the child's ID plus
the mother's phone number, creating a pending link for staff approval — plus an
admin interface field for immediate linking.

### Reminders are not delivered

See [section 11](#11-reminders-and-notifications).

### The database is shared

The Atlas cluster in `.env` also hosts other applications. The `vaccination`
database is separate and nothing outside it is touched, but the credentials have
read/write access to the whole cluster. Create a dedicated cluster if that
unwanted.

### A few API routes rely only on being signed in

Most routes name the roles allowed to call them. Some read-only routes do not,
and permit any authenticated user. The data is scoped correctly inside the
service layer, so this is not a data leak, but a deployment that requires strict
per-endpoint authorisation should tighten it.

### Test fixtures can appear in the data

The automated test suite creates records named "Test Child" and similar. If you
want a clean demonstration, drop the `vaccination` database and re-run
`npm run seed` to rebuild the demo records from scratch.

---

## 14. Troubleshooting

**"No child records linked to your account"**
Your account is not linked to any child. See [section 13](#13-known-gaps-and-limitations).

**"Account is temporarily locked"**
Five failed attempts. Wait 15 minutes, or ask an administrator to reactivate the
account.

**"Vaccination cannot be administered: …"**
The child has an active contraindication or severe reaction. Clear it from the
doctor screen, then record the dose.

**"clinicId should not be empty"**
The child was registered without a clinic, so doses cannot be recorded against a
valid clinic. Re-assign the child.

**"Rate limit exceeded"**
Too many sign-in attempts from your network. Wait for the countdown shown.

**"User with this email already exists"**
That address is already registered. Use **Sign In** instead.

**The dashboard shows no data / "Restoring your session"**
The API is not reachable. Confirm the backend is running on port 5000 and that
`npm run db:check` succeeds.

**Changes are not appearing**
Press **Refresh** on the dashboard. Data is fetched when the screen loads.

---

*This manual describes the system as built. Where behaviour is incomplete it says
so rather than implying otherwise.*
