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

## 2. Architecture & Tech Stack

- **Frontend**: React 19, TypeScript (strict mode), Tailwind CSS, Lucide React icons, Recharts.
- **Backend / API**: Node.js & Express full-stack server mounted with Vite middleware.
- **Relational Database**: **MySQL 8.0+** with **Prisma ORM** schemas (`prisma/schema.prisma`) and raw DDL (`prisma/schema.sql`) enforcing `DECIMAL(12,2)` precision and foreign-key integrity.
- **AI Integration Core**: `@google/genai` SDK using **Google Gemini 3.8 Flash** (`gemini-3.8-flash`) with telemetry headers and an extensible multi-provider abstraction (`IAIProvider`).

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
│   └── analytics/
│       ├── portfolio-analytics.ts   # Authoritative portfolio calculations
│       ├── repayment-analytics.ts   # Period collections & client rankings
│       └── risk-analysis.ts         # Transparent, explainable risk rules
│
├── components/
│   ├── ai/
│   │   ├── ai-chat-assistant.tsx    # Natural language Q&A assistant
│   │   ├── ai-report-generator.tsx  # Executive reporting suite & PDF exporter
│   │   └── risk-monitoring-dashboard.tsx # Rule-based early warning system
│   └── database/
│       └── database-schema-view.tsx # MySQL & Prisma schema inspector
│
└── server.ts                        # Full-stack Express API endpoints
```

---

## 3. Financial Data Integrity & Security Safeguards

- **Authoritative Calculations**: All balances, totals, and collection rates are calculated deterministically by server-side analytics. The AI **never** calculates authoritative balances.
- **Strict Read-Only Role**: The AI is prohibited from modifying financial records, executing arbitrary SQL statements, or altering loan schedules.
- **Zero Hallucination Policy**: If requested data is absent, the AI explicitly states that rather than fabricating figures.
- **Server-Side API Keys**: Provider API keys (`GEMINI_API_KEY`) remain strictly on the server and are never exposed to browser bundles.
- **Input Sanitization**: User questions are treated as untrusted input and wrapped in strict prompt boundaries.

---

## 4. How the AI Features Work

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

## 5. How to Run the Application & Tests

### Prerequisites
- Node.js 20+ (v22 installed)
- npm or bun

### Environment Configuration (`.env`)
```bash
# Gemini API Key (automatically injected in AI Studio)
GEMINI_API_KEY="your_gemini_api_key_here"

# AI Provider Selection (default: gemini, supports: openai)
AI_PROVIDER="gemini"

# Database Connection URL (for production MySQL instance)
DATABASE_URL="mysql://inuka_user:password@localhost:3306/inuka_microfinance"
```

### Running the Development Server
```bash
npm run dev
# Starts full-stack Express server at http://localhost:3000 with Vite middleware
```

### Running Automated Tests
```bash
npm test
# Executes comprehensive automated test suite (22 tests covering financial analytics, risk rules, and AI grounding)
```

### Running Database Migrations
To inspect the relational database schema, navigate to **MySQL & Prisma Schema** in the application sidebar, or inspect:
- `prisma/schema.sql`: Production MySQL DDL script with InnoDB tables, decimal types, indexes, and materialized views.
- `prisma/schema.prisma`: Type-safe Prisma ORM model definitions.

---

## 6. AI Usage Disclosure

- **Primary Model**: Google Gemini 3.8 Flash (`gemini-3.8-flash`) via the modern `@google/genai` TypeScript SDK.
- **Purpose**: Financial natural-language interpretation, structured management report synthesis, and field operational explanations.
- **Scope**: Supplementary analytical layer over deterministic database calculations.
