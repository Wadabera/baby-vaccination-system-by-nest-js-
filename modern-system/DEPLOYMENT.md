# Deploying to Render (backend) and Vercel (frontend)

Both services deploy from the same repository, each from a different root
directory. Deploy the backend first — the frontend needs the backend's URL.

```
repository   https://github.com/Wadabera/baby-vaccination-system-by-nest-js-
backend root modern-system/backend   → Render
frontend root modern-system/frontend → Vercel
database    MongoDB Atlas (shared with your other apps)
```

---

## Order of operations

1. Backend on Render
2. Note the Render URL, e.g. `https://vaccination-api.onrender.com`
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
curl https://vaccination-api.onrender.com/api/health/check
```

Expect `{"status":"ok","database":"connected", ...}`.

The free tier sleeps, so the first request after an idle period can take ~50
seconds. That is normal, not a failure.

---

## 2. Frontend on Vercel

1. Vercel dashboard → **Add New** → **Project** → import the repository
2. Set **Root Directory** to `modern-system/frontend`
3. Framework preset **Vite** (detected automatically)
4. Add the environment variable below
5. **Deploy**

`vercel.json` already supplies the build command, the `dist` output directory,
the SPA fallback rewrite and the cache headers, so nothing else is needed.

### Environment variables

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |

> The trailing `/api` is required. The backend serves everything under
> `/api`, and the frontend appends paths like `/auth/login`.

### Why this variable cannot be set later

Vite inlines `VITE_*` variables **into the JavaScript bundle at build time**.
There is no runtime configuration file in a static deployment. Setting the
variable after the first deploy has no effect until you redeploy. Verified:
with the variable set the host appears in the bundle, and without it the
frontend falls back to the relative `/api` and cannot reach a different domain.

---

## 3. Wire the two together

Once Vercel gives you a URL such as `https://baby-vaccination.vercel.app`:

1. Render → your service → **Environment**
2. Set `CORS_ORIGIN` to that URL
3. Save and redeploy

If you use preview deployments they get a different URL each time. Add the
production URL and, if you need previews, the Vercel pattern too:

```
CORS_ORIGIN=https://your-app.vercel.app,https://your-app-git-main-wadabera.vercel.app
```

CORS accepts a comma-separated list.

### Optional: a custom domain

Add the domain in Vercel, then set `CORS_ORIGIN` to the custom origin. Update
`VITE_API_URL` only if the backend domain also changes.

---

## Verification checklist

Run these once both services are up.

```bash
API=https://your-backend.onrender.com

# 1. Backend is alive and connected to Atlas
curl -s $API/api/health/check

# 2. Login works
curl -s -X POST $API/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Vaccinate@2024"}'

# 3. CORS is open to the frontend origin
curl -s -i $API/api/posts -H 'Origin: https://your-app.vercel.app' \
  | grep -i access-control-allow-origin
#    expect: Access-Control-Allow-Origin: https://your-app.vercel.app
```

Then, in a browser on the Vercel URL:

- [ ] The landing page loads and the sign-in buttons appear
- [ ] Signing in as `admin` reaches `/admin` and lists six accounts
- [ ] The doctor dashboard shows the safety worklist
- [ ] A parent sees two children with their coverage rings
- [ ] Browser console shows no CORS errors

---

## How the two services talk

**Locally** the Vite dev server proxies `/api` to `localhost:5000`, so the
browser makes same-origin requests and CORS never applies.

**Deployed** the browser calls the Render origin directly. That is a
cross-origin request, which is why `CORS_ORIGIN` on the backend and
`VITE_API_URL` on the frontend must both be right.

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
`VITE_API_URL` is missing `/api`, or was set after the deploy. Vite inlines it
at build time, so redeploy after any change.

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
