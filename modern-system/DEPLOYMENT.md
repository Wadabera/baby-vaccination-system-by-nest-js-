# Deploying to Render (backend) and Vercel (frontend)

Both services deploy from the same repository, each from a different root
directory. Deploy the backend first — the frontend needs the backend's URL.

```
repository   https://github.com/Wadabera/baby-vaccination-system-by-nest-js-
backend root modern-system/backend   → Render
frontend root modern-system/frontend → Vercel
database    MongoDB Atlas (shared with your other apps)
```

**Your backend is already live at `https://baby-vaccination-system.onrender.com`.**
The frontend is pre-wired to it — `frontend/.env.production` is committed with
the full API URL, so the Vercel build needs no environment variable for it.

That leaves exactly one thing to do, and it is not optional:

> **Set `CORS_ORIGIN` on Render to your Vercel URL.**
>
> The deployed API currently allows only `http://localhost:3000`, so from
> Vercel the browser blocks every request. Verified: the API answers correctly,
> but returns no `Access-Control-Allow-Origin` header for a Vercel origin.

Deploy the frontend first, copy the URL Vercel gives you, then set `CORS_ORIGIN`
and redeploy the backend.

---

## Order of operations

1. Backend on Render
2. Note the Render URL. Yours is `https://baby-vaccination-system.onrender.com`
3. Frontend on Vercel, with that URL in `VITE_API_URL`
4. Copy the Vercel URL back into the backend's `CORS_ORIGIN` and redeploy

Step 4 is not optional. Without it the browser blocks every API call and the
login screen silently fails.

---

## 1. Backend on Render

### Using the blueprint

`render.yaml` is included, so Render can read the settings:

1. Render dashboard → **New** → **Blueprint**
2. Connect `Wadabera/baby-vaccination-system-by-nest-js-`
3. Render detects `render.yaml` and prefills the service
4. Set the two values marked `sync: false` (below)
5. **Apply**

### Or configure manually

| Setting | Value |
| --- | --- |
| Root directory | `modern-system/backend` |
| Runtime | Node |
| Build command | `npm ci && npm run build` |
| Start command | `npm run start:prod` |
| Health check path | `/api/health/check` |
| Region | Frankfurt (matches your Atlas cluster) |

> **Use the free plan only for a trial.** Free instances spin down after
> 15 minutes of inactivity and cold-start in about 50 seconds. The free tier
> also has a hard monthly limit on hours. For anything you demo repeatedly,
> use the Starter plan.

### Environment variables

Set these in the Render dashboard under **Environment**:

| Variable | Example | Notes |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/vaccination?retryWrites=true&w=majority` | Your Atlas connection string. |
| `JWT_SECRET` | *(let Render generate it)* | Any long random string. |
| `CORS_ORIGIN` | `https://your-app.vercel.app` | Add after the frontend exists. Multiple origins separated by commas. |
| `NODE_ENV` | `production` | Set by the blueprint. |
| `JWT_EXPIRES_IN` | `1h` | Access-token lifetime. |
| `MONGO_AUTO_INDEX` | `true` | Builds the unique indexes Atlas cannot create itself. |

`PORT` is injected by Render. Do not set it.

### Check the network access list in Atlas

Atlas only accepts connections from addresses on its network access list. Your
local machine is already allowed, so local development works, but Render
egresss from dynamic addresses that Atlas may reject.

**Atlas → Network Access → Add IP address → Render.** Render publishes its
outbound addresses at
<https://render.com/docs/static-outbound-ip-addresses>. Allow the whole
render.com range.

If the backend deploys but every request returns a timeout, this is why.

### Seed the database

Run the seed from your own machine, not on Render — it needs the same
`MONGODB_URI`:

```bash
cd modern-system/backend
npm install
npm run db:check     # confirms connectivity
npm run seed         # demo accounts and records
```

### Verify

```bash
curl https://baby-vaccination-system.onrender.com/api/health/check
```

Expect `{"status":"ok","database":"connected", ...}`.

The free tier sleeps, so the first request after an idle period can take ~50
seconds. That is normal, not a failure.

---

## 2. Frontend on Vercel

1. Vercel dashboard → **Add New** → **Project** → import the repository
2. Set **Root Directory** to `modern-system/frontend`
3. Framework preset **Vite** (detected automatically)
4. **Deploy**

`vercel.json` already supplies the build command, the `dist` output directory,
the SPA fallback rewrite and the cache headers, so nothing else is needed.

### Environment variables

**None.** `frontend/.env.production` is committed and already contains:

```
VITE_API_URL=https://baby-vaccination-system.onrender.com/api
```

It holds only the public URL of your API, not a secret, which is why it is safe
to commit and reviewable in a pull request. It exists because Vite inlines
`VITE_*` at build time — a dashboard variable set after the first deploy has no
effect until a redeploy, which is an easy way to ship a broken build.

If the backend address ever changes, edit that one file and commit.

---

## 3. Wire the two together

**This is the step that makes login work, and it cannot be skipped.**

Once Vercel gives you a URL such as `https://baby-vaccination-system.vercel.app`:

1. Render → `baby-vaccination-system` → **Environment**
2. Set `CORS_ORIGIN` to that URL
3. Save, then **redeploy** (Render applies env changes on redeploy, not on save)
4. Confirm with:

```bash
curl -s -i https://baby-vaccination-system.onrender.com/api/posts \
  -H 'Origin: https://baby-vaccination-system.vercel.app' \
  | grep -i access-control-allow-origin
```

That must print your Vercel URL. If it prints nothing, the browser is blocking
the app and login will fail with "Could not reach the server".

If you use preview deployments they get a different URL each time. Add the
production URL and, if you need previews, the preview URL too — CORS accepts a
comma-separated list:

```
CORS_ORIGIN=https://baby-vaccination-system.vercel.app,https://baby-vaccination-system-git-main-wadabera.vercel.app
```

### Optional: a custom domain

Add the domain in Vercel, then set `CORS_ORIGIN` to the custom origin. Edit
`frontend/.env.production` only if the backend domain also changes.

---

## Verification checklist

Run these once both services are up.

```bash
API=https://baby-vaccination-system.onrender.com

# 1. Backend is alive and connected to Atlas
curl -s $API/api/health/check
#    expect: status "ok", database "connected"

# 2. Login works (add -H 'Origin: <your vercel url>' to prove CORS too)
curl -s -X POST $API/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://baby-vaccination-system.vercel.app' \
  -d '{"username":"admin","password":"Vaccinate@2024"}'
#    expect: accessToken in the response

# 3. CORS is open to the frontend origin
curl -s -i $API/api/posts -H 'Origin: https://baby-vaccination-system.vercel.app' \
  | grep -i access-control-allow-origin
#    expect: Access-Control-Allow-Origin: https://baby-vaccination-system.vercel.app
```

Then, in a browser on the Vercel URL:

- [ ] The landing page loads and the sign-in buttons appear
- [ ] Signing in as `admin` reaches `/admin` and lists the accounts
- [ ] The doctor dashboard shows the safety worklist
- [ ] A parent sees two children with their coverage rings
- [ ] Browser console shows no CORS errors

A refresh on a deep route such as `/admin` or `/children/:id` must load the app,
not a 404. That is the SPA rewrite in `vercel.json` doing its job.

### Reading the error messages

The app distinguishes three kinds of failure, because telling them apart is
what makes a broken deploy debuggable:

| What you see | What it means |
| --- | --- |
| `Invalid credentials. N attempts remaining.` | The API answered. Wrong username or password. |
| `Could not reach the server...` | No response arrived. Check `CORS_ORIGIN` and the API URL. |
| `You appear to be offline.` | The browser reports no network connection. |
| `Something went wrong` with a `5xx` in the console | The API crashed. Read the Render logs. |

---

## How the two services talk

**Locally** the Vite dev server proxies `/api` to `localhost:5000`, so the
browser makes same-origin requests and CORS never applies.

**Deployed** the browser calls the Render origin directly. That is a
cross-origin request, which is why `CORS_ORIGIN` on the backend and
`VITE_API_URL` on the frontend must both be right. `VITE_API_URL` lives in the
committed `frontend/.env.production`, so only `CORS_ORIGIN` is left for you to
set in the dashboard.

Three production behaviours are configured specifically for this setup:

- **`trust proxy`** is enabled, so the rate limiter sees the real client IP
  from `x-forwarded-for`. Without it every visitor would share one rate-limit
  bucket and the whole site would lock out after 30 sign-ins.
- **Graceful shutdown** hooks are enabled, so Render's `SIGTERM` on redeploy
  closes connections instead of failing in-flight logins with a 502.
- **`0.0.0.0` binding**, because some hosts only forward to that address.

---

## Troubleshooting

**Frontend loads, login does nothing, console shows CORS errors**
`CORS_ORIGIN` on Render does not include the Vercel URL. Check for a trailing
slash and for `https://` vs `http://` — they must match exactly. Redeploy Render
after changing it.

**Every API call returns a timeout, and the backend log says
`MongooseServerSelectionError`**
Atlas is refusing Render's IP addresses. Add them to the Atlas network access
list.

**Frontend shows the landing page but every route 404s on refresh**
The SPA rewrite is missing. Confirm `modern-system/frontend` is the Vercel
root directory so `vercel.json` is picked up.

**Sign-in works, then the app calls the wrong URL**
`VITE_API_URL` is missing `/api`. It lives in the committed
`frontend/.env.production`; confirm it ends in `/api` and redeploy Vercel.

**Login shows "Could not reach the server" but the API is fine**
Almost always CORS. Confirm the header exists:

```bash
curl -s -i https://baby-vaccination-system.onrender.com/api/posts \
  -H 'Origin: https://your-app.vercel.app' | grep -i access-control-allow-origin
```

No header printed means `CORS_ORIGIN` on Render does not include that exact
origin — including its scheme and without a trailing slash.

**`Invalid MONGODB_URI` or the service will not start**
The connection string is missing, or the password contains characters that
need URL-encoding. Encode `!` as `%21`, and likewise `#`, `$`, `&`, `'`, `(`
and `)`.

**First request takes 30–60 seconds**
The free Render instance was asleep. It wakes on the first request.

**`405 Method Not Allowed` on an API route**
The backend is mounted with a global `/api` prefix. If the frontend calls
`/auth/login` rather than `/api/auth/login`, `VITE_API_URL` is missing the
suffix.

---

## Deploying an update

Push to `main` and both services redeploy automatically.

Run the seed again after a change that affects the schema. It is idempotent:
it creates what is missing, repairs the parent-to-child links, and never
overwrites a dose a clinician has already recorded.
