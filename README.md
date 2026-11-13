# Inuka Africa — Microfinance Loan Repayment Tracker with AI Integration

> **Brand Tagline:** *Making Growth Possible.*  
> **Target Audience:** Internal Operations Staff, Branch Credit Officers, Financial Analysts, and Executive Management.

---

## 1. Overview & Capabilities

The **Inuka Africa Loan Repayment Tracker** is a modern, responsive, full-stack microfinance administration platform. In addition to core borrower management, loan registration, and repayment tracking, the application integrates **three practical AI capabilities** engineered to improve portfolio oversight, executive reporting, and operational efficiency without compromising financial integrity:

1. **AI Financial Insights Assistant**: A natural-language financial data analyst that answers complex portfolio and repayment inquiries grounded strictly in verified institutional database records.
2. **AI Management Report Generator**: Compiles four categories of formal executive reports (*Portfolio Performance*, *Monthly Collections*, *Outstanding Loans*, and *Executive Summary*) with observations, cashflow velocity, and actionable management recommendations.
3. **AI-Assisted Repayment Risk Analysis**: Transparent, explainable rule-based monitoring (*30-day collection lapse, >75% outstanding balance ratio, zero payment history, and maturity overdue*) paired with contextual AI operational explanations for branch loan officers.

---

## 2. Repository Structure

```
Inuka-Africa-Loan-app/
├── database/
│   ├── schema.sql      # Creates the database, tables, relationships, constraints and views
│   └── seed.sql        # Inserts fictional clients, loans and repayment records for testing
├── prisma/
│   └── schema.prisma   # Prisma model definitions (reference only)
├── scripts/
│   ├── init-db.ts      # Applies database/schema.sql (+ optional seed) from .env credentials
│   ├── seed.ts         # Demo data seeder (TypeScript variant of database/seed.sql)
│   └── backup-db.ts    # Non-destructive logical database backup
├── src/                # React frontend + shared libraries (see Architecture below)
├── tests/              # Unit tests and API integration tests
├── server.ts           # Express API + Vite dev middleware
├── .env.example        # Required environment variables (no real credentials)
├── package.json        # Scripts: dev, build, test, db:init, db:seed, db:backup, lint
└── README.md
```

---

## 3. Architecture & Tech Stack

- **Frontend**: React 19, TypeScript (strict mode), Tailwind CSS, Lucide React icons, Recharts.
- **Backend / API**: Node.js & Express full-stack server mounted with Vite middleware, with stateless token authentication, per-IP rate limiting, and security headers.
- **Authentication**: `scrypt` password hashing (Node.js `crypto`) and HMAC-SHA256 signed session tokens (`src/lib/server-auth.ts`). First registered user becomes administrator; registration closes afterwards.
- **Relational Database**: **MySQL 8.0+** with raw DDL (`database/schema.sql`) enforcing `DECIMAL(12,2)` precision and foreign-key integrity, accessed through a `mysql2` connection pool configured exclusively via environment variables.
- **AI Integration Core**: `@google/genai` SDK using **Google Gemini 3.8 Flash** (`gemini-3.8-flash`) with telemetry headers and an extensible multi-provider abstraction (`IAIProvider`). AI financial context is built **server-side** from verified database queries (`src/lib/ai-context.ts`); client-supplied figures are never trusted. Deterministic verified fallbacks guarantee correct answers when the provider is unavailable.

```
src/
├── lib/
│   ├── ai/
│   │   ├── providers/
│   │   │   ├── gemini-provider.ts   # Google Gemini 3.8 Flash implementation
│   │   │   └── openai-provider.ts   # Multi-provider extensible adapter
│   │   ├── ai-provider.ts           # Core IAIProvider interface
│   │   ├── ai-service.ts            # Centralized service coordinator & fallback
│   │   ├── prompts.ts               # Responsible AI domain system instructions
│   │   └── types.ts                 # Strongly typed AI payloads
│   │
│   ├── analytics/
│   │   ├── portfolio-analytics.ts   # Portfolio-level calculations
│   │   ├── repayment-analytics.ts   # Period collections & client rankings
│   │   └── risk-analysis.ts         # Rule-based risk rules
│   │
│   ├── auth.tsx                     # React AuthProvider (login/signup/session)
│   ├── api.ts                       # Authenticated fetch client (bearer token, 401 handling)
│   ├── store.tsx                    # Global store backed by the REST API
│   ├── server-auth.ts               # Password hashing, token signing, user management
│   ├── ai-context.ts                # Server-side verified financial context builder
│   ├── mappers.ts                   # MySQL row -> domain type mapping
│   └── db.ts                        # MySQL connection pool (env-driven)
│
├── components/
│   ├── ai/
│   │   ├── ai-chat-assistant.tsx    # Natural language Q&A assistant
│   │   ├── ai-report-generator.tsx  # Executive reporting suite
│   │   └── risk-monitoring-dashboard.tsx # Rule-based early warning system
│   ├── auth/                        # Login, signup, forgot-password pages
│   ├── clients/                     # Client list, details & forms
│   ├── loans/                       # Loan list, details & forms
│   ├── repayments/                  # Repayment tracking, receipts & PDF export
│   └── shared/                      # Reusable UI (stat cards, badges, toasts)
│
├── tests/
│   ├── run-tests.ts                 # Unit tests (analytics, risk rules, AI grounding)
│   └── api-tests.ts                 # API integration tests (isolated test database)
│
├── scripts/
│   ├── init-db.ts                   # Applies database/schema.sql (+ optional seed.sql)
│   ├── seed.ts                      # Optional demo data seeder
│   └── backup-db.ts                 # Non-destructive logical database backup
│
└── server.ts                        # Express API + Vite dev middleware
```

---

## 4. Financial Data Integrity & Security Safeguards

- **Authoritative Calculations**: All balances, totals, and collection rates are calculated deterministically by server-side analytics and SQL (`DECIMAL(12,2)`, `GREATEST(0, ...)`). The AI **never** calculates authoritative balances.
- **Server-Side AI Context**: AI endpoints rebuild financial context from verified database queries on every request; client-supplied `contextData` is ignored for financial figures.
- **Strict Read-Only Role**: The AI is prohibited from modifying financial records, executing arbitrary SQL statements, or altering loan schedules.
- **Zero Hallucination Policy**: If requested data is absent, the AI explicitly states that rather than fabricating figures. Deterministic verified fallbacks answer financial questions correctly even when the AI provider is unavailable.
- **Hashed Credentials**: Passwords are hashed with `scrypt` (per-user salt); plaintext passwords are never stored or logged.
- **Signed Sessions**: Session tokens are HMAC-SHA256 signed with `AUTH_SECRET` and expire after 12 hours; all `/api/*` routes (except auth and health) require a valid token.
- **Rate Limiting**: Sliding-window per-IP limits protect authentication (20/15min), AI endpoints (30/min), and general API traffic (300/min).
- **Security Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` are applied to every response.
- **Error Sanitization**: Internal error details are logged server-side only; clients receive generic messages.
- **Server-Side API Keys**: Provider API keys (`GEMINI_API_KEY`) remain strictly on the server and are never exposed to browser bundles.
- **Input Sanitization**: User questions are treated as untrusted input and wrapped in strict prompt boundaries; all API inputs are validated server-side.
- **Transaction Safety**: Repayment recording locks the loan row (`SELECT ... FOR UPDATE`) inside a transaction, re-validates the outstanding balance, and rejects overpayments atomically.

---

## 5. How the AI Features Work

### Feature 1: AI Financial Insights Assistant (`/ai-chat`)
- **Workflow**: Staff asks a question in plain English (e.g. *"How much money has been collected this month?"* or *"Which loans have the highest outstanding balances?"*).
- **Grounding**: The backend queries verified application metrics, builds a structured factual envelope, and passes it to `gemini-3.8-flash` alongside the domain system instruction.
- **Output**: The assistant provides a concise, professional answer clearly marked with a *"Verified with Institutional Ledger"* badge.

### Feature 2: AI Management Report Generator (`/ai-reports`)
- **Workflow**: Staff selects a report category (*Executive Summary*, *Portfolio Performance*, *Monthly Collections*, or *Outstanding Loans*) and reporting period.
- **Compilation**: The analytics engine computes key metrics (disbursed, due, repaid, outstanding, collection rate, month-over-month trajectory).
- **Synthesis**: The AI compiles formal observations and strategic management recommendations for field branch managers. Reports can be copied or printed as official PDFs.

### Feature 3: Repayment Risk Analysis (`/risk-monitor`)
- **Explainable Business Rules**:
  - `NO_RECENT_PAYMENT`: Active loans with no repayment recorded in over 30 days.
  - `HIGH_OUTSTANDING_RATIO`: Remaining balance constitutes $\ge 75\%$ of the total facility due.
  - `NO_PAYMENT_HISTORY`: Disbursed over 21 days ago with zero repayments received.
  - `OVERDUE_MATURITY`: Maturity date passed with an active balance.
- **Classification**: Partitioned into **High Attention**, **Medium Attention**, and **Low Attention**.
- **AI Operational Explanations**: Contextual summaries providing field credit officers with actionable next steps (e.g. branch visit, business check-in, or payment rescheduling).

---

## 6. How to Run the Application & Tests

### Prerequisites
- Node.js 20+ (v22 installed)
- pnpm (project uses `pnpm-lock.yaml`; npm also works for the documented scripts)

### Environment Configuration (`.env`)
Copy `.env.example` to `.env` and fill in real values. **Never commit `.env`.**

```bash
# Database (required) - either DATABASE_URL or the discrete DB_* variables
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/inukaloanapp"
# DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME (alternative)

# Authentication (required for stable sessions across restarts)
AUTH_SECRET="long_random_string"

# AI Provider (optional - deterministic verified fallback works without it)
GEMINI_API_KEY="your_gemini_api_key_here"
AI_PROVIDER="gemini"   # or "openai" with OPENAI_API_KEY

# Optional: seed the first administrator on first startup
# ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME

# PORT="3002"
```

### Initialize the Database (required once)
The full schema (`database/schema.sql`) and demo seed data (`database/seed.sql`) are included in the repository. After configuring `.env`:

```bash
pnpm install
pnpm db:init          # creates the database, tables, and portfolio view
pnpm db:init --seed   # optional: also load demo clients/loans/repayments
```

`db:init` is idempotent (`CREATE ... IF NOT EXISTS`) and safe to re-run. You can also import the SQL files manually with any MySQL client:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql   # optional demo data
```

### First Run & Authentication
1. Start the server (`pnpm dev`). The `users` table is created automatically if missing.
2. Open the app and **sign up** — the first registered user becomes the administrator and registration closes automatically afterwards.
3. All subsequent logins use email + password. Sessions last 12 hours.

### Running the Development Server
```bash
npm run dev
# Starts full-stack Express server at http://localhost:3002 with Vite middleware
```

### Running Automated Tests
```bash
npm test          # unit tests + API integration tests
npm run test:unit # analytics / risk / AI grounding unit tests (22 tests)
npm run test:api  # API integration tests against an isolated test database (45 tests)
```
The API suite creates and drops a dedicated `inukaloanapp_test` database; it never touches the assessment database.

### Database Utilities
```bash
pnpm db:init     # apply database/schema.sql (idempotent)
pnpm db:seed     # load demo data via scripts/seed.ts (DELETES existing clients/loans/repayments first)
pnpm db:backup   # logical backup to backups/inukaloanapp-backup-<timestamp>.sql
```

### Database Schema
The relational schema lives in `database/schema.sql` (MySQL DDL — run it via `pnpm db:init` or import it directly) and `prisma/schema.prisma` (Prisma model definitions for reference). Demo seed data lives in `database/seed.sql` (generated from `src/lib/mock-data.ts`). The app itself queries MySQL through a `mysql2` connection pool in `src/lib/db.ts`, configured exclusively from environment variables.

---

## 7. AI Usage Disclosure

- **Primary Model**: Google Gemini 3.8 Flash (`gemini-3.8-flash`) via the modern `@google/genai` TypeScript SDK.
- **Purpose**: Financial natural-language interpretation, structured management report synthesis, and field operational explanations.
- **Scope**: Supplementary analytical layer over deterministic database calculations.
