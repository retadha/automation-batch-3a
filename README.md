# 🧪 Emra Chat Signup — QA & Test Automation

An end-to-end **Playwright + TypeScript** test automation project for Emra's user registration flow, built as part of a QA bootcamp by directing and verifying AI tooling (**Claude Code**, **Playwright MCP**) as part of the workflow. Covers the full pipeline: **project conventions**, **scripted manual testing**, a **Page Object Model (POM)** automation framework with **data-driven testing**, a parallel **API test layer** for backend-level validation coverage, **AgentQ reporting integration**, and a **CI/CD** pipeline via GitHub Actions and Docker.

**Tech stack:** Playwright, TypeScript, GitHub Actions, Docker

## 🛤️ QA & Automation Workflow

### 📐 1. Framework Conventions

- Wrote a project **convention** doc ([`.claude/CONVENTIONS.md`](.claude/CONVENTIONS.md)) before writing any test
- Defined folder structure, naming, and file organization
- Defined test data structure
- Set a consistent style for writing tests, so the suite stays maintainable as it grows

### 🔍 2. Scripted Manual Testing with Playwright MCP

- Walked through each scenario manually on the live application first, instead of assuming how it should work
- Used **Playwright MCP** to drive a real browser and observe exact behavior — messages shown, fields required, fields optional
- Used the same MCP tooling to inspect **network traffic** directly, capturing the exact request/response contract of each endpoint before writing any API test
- Surfaced real defects in the product this way (see below) 🐛

### 🏗️ 3. POM & Data-Driven Automation

- Built using the **Page Object Model (POM)** pattern — locators and actions separated from test logic
- Wrote automated tests to match confirmed behavior, including cases where the product doesn't behave correctly
- Applied **data-driven testing**: combined test cases that followed the same pattern into a single reusable test instead of duplicating code

### 🌐 4. API Test Automation

- Extended coverage below the UI with a dedicated **API test layer**, using Playwright's built-in `request` fixture — no browser required, faster feedback than end-to-end runs
- Introduced an **API client abstraction** (`clients/`) — the API equivalent of a page object, isolating endpoint calls (URL, headers, payload) from test assertions
- Reused the same data-driven fixtures and generators as the UI suite, so one source of truth drives both layers
- Tagged (`@ui` / `@api`) to keep each layer independently filterable and separately reported
- **Layered testing paid off**: hitting the API directly, bypassing the browser's client-side validation, uncovered backend validation gaps that UI-only testing had missed entirely — confirming some defects exist at the contract level, not just in the frontend form

### 📡 5. Test Reporting Integration

- Test results report automatically to the team's test management tool (AgentQ) after every run
- Set up once at the framework level, not repeated in every test file
- Reduces maintenance and the risk of reporting being forgotten

### 🚀 6. CI/CD Pipeline

- Tests run automatically via GitHub Actions on every code change
- Uses a preconfigured Docker environment so runs stay fast and consistent
- Saves a report after every run, whether it passes or fails

## 📂 Project Structure

```
tests/ui/    → UI test cases, grouped by feature (Page Object Model)
tests/api/   → API test cases, grouped by feature (request fixture)
pages/       → reusable page objects for each screen
clients/     → API client abstraction — one per feature, for API tests
data/        → test data, generators, and reference values (shared by both layers)
exploration/ → manual exploration notes, written before automating
helper/      → shared utilities (e.g. test reporting, API-call attachments)
```

## 🛠️ Getting Started

**1. Install dependencies**

```bash
npm install
npx playwright install --with-deps chromium
```

**2. Configure environment**

Copy `.env.example` to `.env` and fill in the values you need:

```bash
cp .env.example .env
```

At minimum:

```
BASE_URL=https://www.emra.chat
```

AgentQ reporting is optional — without `AGENTQ_TESTRUN_ID` set, tests still run normally and reporting is simply skipped.

**3. Run the signup tests**

```bash
# UI + API together
npx playwright test --grep "@signup"

# UI only
npx playwright test --grep "@ui.*@signup"

# API only
npx playwright test --grep "@api.*@signup"
```

**4. Open the HTML report**

```bash
npx playwright show-report
```

## 📋 Skills Covered

- **Requirements analysis** — reviewing product requirements and specifications to identify gaps and inconsistencies
- **Scripted manual testing** — using Playwright MCP to verify real product behavior against planned test cases before writing automation
- **Test design** — risk-based prioritization, data-driven testing, reducing redundant test cases
- **Test automation** — Playwright, TypeScript, Page Object Model (POM)
- **API testing** — direct backend validation via Playwright's `request` fixture, an API client abstraction layer, and network-traffic inspection through Playwright MCP to reverse-engineer request/response contracts
- **Defect identification** — finding and documenting real product issues across both the UI and API layers, including gaps invisible from the frontend alone
- **Test reporting integration** — automated result reporting to a test management tool (AgentQ)
- **CI/CD** — GitHub Actions, Docker
- **Documentation** — establishing clear project conventions before implementation
- **AI-augmented workflow** — directing AI tooling (Claude Code, Playwright MCP) and critically verifying its output against real application behavior

## 🐛 Bugs Found

| Issue                         | Layer | Expected                                        | Actual                    |
| ----------------------------- | ----- | ----------------------------------------------- | ------------------------- |
| Password length limit         | UI    | Passwords over 50 characters should be rejected | Accepted without warning  |
| Password strength requirement | UI    | Weak passwords should be rejected               | Accepted without warning  |
| Email format validation       | API   | Malformed email should be rejected server-side  | Accepted, account created |
| Password minimum length       | API   | Passwords under 8 characters should be rejected | Accepted, account created |

The two API-layer findings go a step further than the UI bugs above: hitting the endpoint directly, bypassing the frontend's client-side checks, showed the backend performs little to no password/email validation of its own — a gap invisible to UI-only testing.

## 🤖 AI-Assisted, Human-Driven

AI tooling assisted with writing code and running manual checks on the live application. Decisions on how the project was organized, what to test, which issues mattered enough to flag, and where to correct the tool's output remained with the person leading the project.
