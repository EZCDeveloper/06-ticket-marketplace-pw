# 🎫 MyTicket Marketplace — Playwright test suite

> **Quality Speed**: E2E, API, and smoke tests for the **MyTickets Marketplace** app (Next.js, Clerk, Convex, Stripe). This repo is the **Playwright harness** that pairs with the `06_ticket-marketplace` project.

Run the app on `localhost:3000`, add test credentials, and run projects in order: **setup → smoke → api → e2e**.

---

## ⚡ Quick Start

### 1. Prerequisites

- The app running locally (default **http://localhost:3000**), e.g. from `06_ticket-marketplace` with `npm run dev`.
- Node.js and npm installed.

### 2. Installation

```bash
cd 06-ticket-marketplace-pw

npm install

# Playwright browsers (Chromium, etc.)
npx playwright install --with-deps
```

### 3. Configuration

`playwright.config.ts` loads **`.env.local`** from the repo root via `dotenv`. Start from the tracked template:

```bash
cp .env.example .env.local
```

Edit **`.env.local`** with your real values (never commit secrets). **`.env.example`** documents every variable—at minimum set **`BASE_URL`**, **`TEST_USER_EMAIL`**, and **`TEST_USER_PASSWORD`** so `tests/auth.setup.ts` can sign in with Clerk. Set **`NEXT_PUBLIC_CONVEX_URL`** for API specs that use `ConvexClient` (no default URL is shipped). Use **`CLERK_SECRET_KEY`** only if tests create temporary users via the Clerk Backend API.

After a successful first login, the **setup** project saves the session to `playwright/.auth/user.json` for smoke, API, and E2E. That file is **gitignored** (it contains session cookies).

### GitHub Actions

Configure these **repository secrets** so CI can run: `BASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `NEXT_PUBLIC_CONVEX_URL`. Add `CLERK_SECRET_KEY` if your pipeline runs specs that need the Clerk Admin API.

### 4. Run tests

```bash
# Full pipeline (setup + smoke + api + e2e), headless
npm test

# UI mode (interactive)
npm run ui

# By project
npm run test:smoke   # health — depends on setup
npm run test:api     # specs under tests/api/
npm run test:e2e     # specs under tests/e2e/

# Utilities
npm run test:headed
npm run test:debug
npm run report       # open HTML report
```
---

## 📂 Project Structure

```
06-ticket-marketplace-pw/
├── tests/
│   ├── auth.setup.ts              # Clerk login → playwright/.auth/user.json
│   ├── api/                       # API specs
│   ├── e2e/                       # Browser E2E specs
│   ├── smoke/                     # Fast health checks
│   └── scripts/                   # Maintenance (e.g. db cleanup)
├── support/
│   ├── api/                       # ConvexClient, Clerk admin, etc.
│   ├── builders/                  # EventBuilder, test data
│   ├── cleanup/                   # ResourceTracker
│   ├── components/                # Page objects (ClerkLoginForm, EventForm, …)
│   ├── domain/                    # Buyer / Seller actors
│   └── config/
├── fixtures/
│   └── base.fixtures.ts           # Extended test fixtures
├── config/
│   ├── endpoints.ts
│   └── convex-functions.ts
├── playwright.config.ts
└── package.json
```

## 🚀 Built with: Playwright SaaS Turbo Template (by Emanuel Zini Casaro)

## 📄 License

MIT

---

**Built with ❤️ by Emanuel Zini Casaro, following the "Quality Speed" philosophy & Playwright SaaS Turbo Template**
