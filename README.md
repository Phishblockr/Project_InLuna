# InLuna Backend (Backend-node)

This repository contains the InLuna Node.js backend server. This README documents how to run the server and provides an API overview for the routes mounted in `server.js`.

- You can test API at http://localhost:5000/api/docs

**Quick Links**

- **Repo root**: `server.js`
- **Routes directory**: `routes/`

**Requirements**

- Node.js 16+ (or as required by your environment)
- MongoDB instance (connection via `MONGO_URI`)

**Environment Variables**

- `PORT` : Server port (default `5000`)
- `MONGO_URI` : MongoDB connection string
- `NODE_ENV` : `development` or `production` (affects CORS allowed origins)
- Any other secrets/config referenced in the code (e.g., payment provider keys, OIDC settings).

Getting Started

- Install dependencies:

```
npm install
```

- Start server (development):

```
npm run dev
```

- Start server (production):

```
npm start
```

Notes

- The project uses `Socket.IO` (server attached in `server.js`) and several cron job modules (disabled by default in `server.js`).
- Razorpay webhook is mounted before body parsers and requires raw body handling. See the `server.js` comment about mounting `/api/rzp` webhook before JSON body parsers.

API Overview
Below are the base API mounts and a short description of what they represent (mounted in `server.js`). For endpoint-level details, look inside the matching file in `routes/` (e.g., `routes/urlRoutes.js`).

- **Organization**: `POST/GET/PUT/DELETE` managing tenant organizations

  - Base: `/api/org`
  - File: `routes/organizationRoutes.js`

- **Authentication**: Auth endpoints (login, register, token flows)

  - Base: `/api/auth`
  - File: `routes/authenticationRoutes.js`

- **Individual Authentication**: APIs for individual users

  - Base: `/api/indAuth`
  - File: `routes/IndividualRoutes/indAuthRoutes.js`

- **Individual Registration**: Individual registration endpoints

  - Base: `/api/indRegister`
  - File: `routes/IndividualRoutes/indRegistrationRoutes.js`

- **Users**: User management endpoints

  - Base: `/api/user`
  - File: `routes/userRoutes.js`

- **URLs (shortener / management)**: Create, update, lookup, delete URLs

  - Base: `/api/url`
  - Middleware: `authenticateToken` is applied
  - File: `routes/urlRoutes.js`

- **Individual URLs**: Public/individual URL routes

  - Base: `/api/indUrl`
  - File: `routes/IndividualRoutes/indUrlRoutes.js`

- **Whitelist Requests**: Requests to whitelist URLs

  - Base: `/api/Request`
  - Middleware: `authenticateToken` is applied
  - File: `routes/RequestRoutes.js`

- **Feedback**: Submit and manage feedback

  - Base: `/api/feedback`
  - Middleware: `authenticateToken` is applied
  - File: `routes/feedbackRoutes.js`

- **Overview / Dashboard**: Admin dashboard overview endpoints

  - Base: `/api/overview`
  - Middleware: `dashboardAdminMiddleware` is applied
  - File: `routes/overviewRoutes.js`

- **Logs**: Application logs / admin logs

  - Base: `/api/logs/`
  - Middleware: `dashboardAdminMiddleware` is applied
  - File: `routes/logsRoute.js`

- **Forgot Details**: Password / credential recovery

  - Base: `/api/forgot` (org) and `/api/forgotInd` (individual)
  - Files: `routes/forgotDetailsRoutes.js`, `routes/IndividualRoutes/indForgotDetailsRoutes.js`

- **HeartBeat**: Heartbeat/health check endpoints

  - Base: `/api/heartBeat`
  - Middleware: `authenticateToken` is applied
  - File: `routes/heartBeatRoutes.js`

- **Campaigns**: Campaign management (admin)

  - Base: `/api/campaign`
  - Middleware: `dashboardAdminMiddleware` is applied
  - File: `routes/campaignRoutes.js`

- **Phishtank**: PhishTank integration endpoints

  - Base: `/api/phishtank`
  - File: `routes/phishtankRoutes.js`

- **Urlhaus**: URL abuse checks (urlhaus)

  - Base: `/api/urlhaus`
  - File: `routes/urlhausRoutes.js`

- **Training Platform**:

  - Email templates: `/api/emailTemplate` — `routes/trainingPlatform/emailTemplateRoutes.js`
  - Courses: `/api/course` — `routes/trainingPlatform/courseRoutes.js`
  - User Courses: `/api/userCourse` — `routes/trainingPlatform/userCourseRoutes.js`
  - User Emails: `/api/userEmail` — `routes/trainingPlatform/userEmailRoutes.js`
  - Quizzes: `/api/quiz` — `routes/trainingPlatform/quizRoutes.js`
  - Gamification: `/api/gamification` — `routes/trainingPlatform/gamificationRoutes.js`

- **Tenant Management**: Tenant-specific admin routes

  - Base: `/api/tenant`
  - File: `routes/tenantRoutes.js`

- **Super Admin**: Super-admin routes & overview

  - Base: `/api/superadmin`
  - File: `routes/superAdmin/superAdminRoutes.js`
  - Super metrics/overview: `/api/supermetrics` — `routes/superAdmin/overview.js`
  - Book a demo: `/api/bookADemo` — `routes/superAdmin/bookADemoRoutes.js`

- **Contact Us**: `routes/contactUsRoutes.js`

  - Base: `/api/contactUs`

- **Payments / Billing**:

  - CCAvenue: `/api/ccavenue` — `routes/paymentRoutes/ccaRoutes.js`
  - Razorpay (integration): `/api/razorpay` — `routes/paymentRoutes/razorpayRoutes.js`
  - Transactions: `/api/transactions` — `routes/paymentRoutes/transactionRoutes.js`
  - RZP webhook (raw body): `/api/rzp` — mounted twice in `server.js`:
    - Early mount: `routes/rzp-webhook.js` (webhook endpoint mounted BEFORE JSON body parsers and requires raw body)
    - Later mount: `routes/rzp.js` (JSON-parsed subscription & sync routes)

- **reCAPTCHA**: `/api/recaptcha` — `routes/recaptchaRoutes.js`

- **Meta (roles & departments / select options)**: `/api/meta` — `routes/rolesDepartmentsRoutes.js`

- **Billing**: `/api/billing` — `routes/billingRoutes.js`

Middleware Summary

- `authenticateToken` : Protects many routes (applied to `/api/url`, `/api/Request`, `/api/feedback`, `/api/heartBeat`, etc.). See `middlewares/authenticateToken.js`.
- `dashboardAdminMiddleware` : Applied for admin/dashboard routes (overview, logs, campaign). See `middlewares/dashboardAdminMiddleware.js`.
- Razorpay webhook route (`/api/rzp` via `rzp-webhook.js`) is intentionally mounted before body parsers to access raw request body.

Cron Jobs

- There are cron job modules available under `cronJobs/`:
  - `phishtankJob.js` — PhishTank fetch/save
  - `urlhausService.js` — Urlhaus fetch/save
  - `userCleanupJob.js` — Monthly user purge
  - `createSubscriptionJob.js` — Create pending subscriptions
- They are referenced in `server.js` but not started by default (commented out).

Where to find endpoint specifics

- For each base path above, open the corresponding file in `routes/` to see detailed endpoints, request/response shapes, and validation. Example: `routes/urlRoutes.js` for all `/api/url` endpoints.

Contributing / Next steps

- If you want, I can:
  - Generate a detailed endpoint list by scanning each file in `routes/` and extracting route paths + methods.
  - Produce an OpenAPI (Swagger) spec for the project.

Contact

- If anything should be added/changed in this documentation (examples, request/response bodies, authentication flow), tell me which area to expand and I will update `README.md`.

---

Example

Below is a quick example showing how to authenticate and call a protected endpoint using `curl`.

1. Obtain an access token (example login)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'
```

Sample successful response (JSON):

```json
{
  "token": "<JWT_TOKEN>",
  "user": {
    "id": "607c191e810c19729de860ea",
    "email": "user@example.com",
    "name": "Example User"
  }
}
```

2. Use the token to call a protected endpoint (list URLs)

```bash
curl -X GET http://localhost:5000/api/url \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Sample response (JSON array):

```json
[
  {
    "shortId": "abc123",
    "originalUrl": "https://example.com",
    "createdBy": "607c191e810c19729de860ea",
    "createdAt": "2025-12-02T12:34:56.789Z"
  }
]
```

Replace `http://localhost:5000` and paths with your deployment host/port. For webhook endpoints (e.g. `/api/rzp`), follow provider docs to send raw payloads to the webhook URL.

Generated from mounted routes in `server.js` on project workspace.

API Documentation (Swagger)

- Once the server is running, interactive API docs are available at: `/api/docs` (e.g. `http://localhost:5000/api/docs`).
- The docs are generated from JSDoc comments inside `routes/` files using `swagger-jsdoc` and served with `swagger-ui-express`.
