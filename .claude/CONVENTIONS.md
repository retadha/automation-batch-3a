# Project Conventions — automation-batch-3a

Playwright + TypeScript E2E suite for the Emra signup/login flows.

## Folder structure — feature folder always comes first

Every feature gets its own folder, mirrored identically across `pages/`, `data/`, and `exploration/`. `tests/` adds one extra layer first — the **test type** (`ui`, and future types like `api`) — since a feature can eventually be covered by more than one kind of test:

```
tests/<type>/<feature>/<feature>.spec.ts
pages/<feature>/<PageName>Page.ts
clients/<feature>/<Feature>Client.ts   (API tests only — see API tests section)
data/<feature>/<name>.json
data/<feature>/generateData.ts
exploration/<feature>/<feature>.txt
```

Example (current features: `signup`, `login`; current test type: `ui`):

```
tests/
  ui/
    signup/
      signup.spec.ts
    login/
      login.spec.ts
pages/
  signup/
    SignupPage.ts
  login/
    LoginPage.ts
data/
  signup/
    users.json
  login/
    user.json
```

- Never put a spec, page object, or data file directly under `tests/`, `pages/`, or `data/` without their required subfolders.
- A feature folder name should be short, lowercase, and match the user story it covers (e.g. `signup` for US-01 Registration, `login` for US-02 Login).
- One-off/example scaffolding (e.g. Playwright's default boilerplate) still gets its own folder (`tests/example/`) rather than living loose at the top level.

## Manual/MCP exploration scripts

- A manual exploration plan (e.g. a plain-text step list driven through Playwright MCP before automating it) doesn't belong in `tests/`, `pages/`, or `data/` — it's neither a spec, a page object, nor a data fixture.
- Put it in `exploration/<feature>/<feature>.txt`, following the same feature-first folder pattern as the rest of the repo (e.g. `exploration/signup/signup.txt`).

## Page Object Model (POM)

- One class per page/flow, named `<Feature>Page` (e.g. `SignupPage`, `LoginPage`), in `pages/<feature>/`.
- Constructor takes `page: Page` and defines all `Locator`s as `readonly` fields.
- Locators use accessible queries (`getByRole`, `getByLabel`) over CSS/XPath selectors.
- Action methods are named after user intent, not implementation (`login()`, `fillProfileInfo()`), and return `Promise<void>` unless a value is genuinely needed.
- Multi-step flows (e.g. signup) expose both per-step methods (`fillEmailAndPassword`, `fillProfileInfo`, `fillCompanyInfo`) and one convenience method that chains them (`signup(...)`), so tests can exercise a single step or the full flow.
- Page objects hold no assertions (`expect`) — assertions live in the spec file.
- **Prefer a single object (JSON-shaped) parameter over multiple positional parameters** for any method taking more than 1–2 values. `fillCompanyInfo({ companyName, industry, companySize })`, not `fillCompanyInfo(companyName, industry, companySize)` — call sites stay readable, arguments can't be silently swapped, and it's trivial to spread a data-object case straight in (e.g. `signup({ ...validUser })`).

## API tests

- Live in `tests/api/<feature>/<feature>.spec.ts`, using Playwright's built-in `request` fixture — no extra HTTP library needed for tests themselves (axios stays reserved for the AgentQ reporter, which isn't a test).
- Each feature gets an **API client** in `clients/<feature>/<Feature>Client.ts` — the API equivalent of a page object: wraps endpoint calls (base path, headers, body), returns the raw response, and holds no assertions. Same intent-named-methods and object-parameter rules as POM apply here.
- Reuses the same `data/<feature>/` fixtures and `generateData.ts` helper as UI tests, so valid/invalid payloads have one source of truth regardless of which layer is testing them.
- Assert on status code and response body shape — not on incidental details like header order or internal fields outside the documented contract.
- Add an `@api` tag alongside the usual `@<feature> @positive|@negative @p0|@p1|@p2` tags, so a plain `--grep @signup` doesn't silently run both the UI and API suites together when only one was intended. UI tests carry the matching `@ui` tag for the same reason (e.g. `--grep="@ui.*@signup"` vs `--grep="@api.*@signup"`).
- API test results are **not** pushed to AgentQ (`agentq-reporter.ts` skips any test tagged `@api`) — AgentQ tracks the QA test-case suite, which the API layer re-verifies rather than owns; only the UI run reports status.

## Test data (JSON)

- Reusable fixtures go in `data/<feature>/*.json`, imported directly (`import users from '../../data/signup/users.json'`).
- Keys are named by role/scenario, not by literal value (`valid_user`, `existing_user`, `admin_user`), so specs read as intent, not data dumps.
- Inline literals in a spec are fine for one-off/negative-path values that don't need reuse (e.g. a single mismatched-password test); once a value is reused across 2+ tests, promote it to the feature's JSON file.

## Dropdown / fixed-choice fields — record every option

- For any dropdown, select, radio group, or other field with a fixed set of choices (e.g. Country, Industry, Company Size), record the **full list of acceptable options** discovered during exploration — not just the one value currently used in a test.
- Store the list next to the feature's other test data (e.g. `data/<feature>/options.json`, or an exported const near the page object's locator for that field) so it's reusable, not just noted in passing.
- This is what makes future randomization possible: a test can pick a random valid option from the recorded list (via the faker helper or a simple random-pick util) instead of always exercising the same hardcoded choice (e.g. always "Indonesia", always "Technology").

## Randomized test data (faker)

- For **accepted/valid (positive) test data only**, always generate values through a shared helper function using `@faker-js/faker` — never hardcode a literal valid email/name/etc. that's meant to represent "any valid input."
- **Negative/invalid test data stays hardcoded, never randomized** — boundary and format-violation values (e.g. a 51-character password, a 101-character name, an email missing `@`) must stay deterministic and exact, since the whole point is hitting a specific validation rule precisely.
- The helper lives in `data/<feature>/generateData.ts`, next to that feature's static JSON fixtures, and is reused across specs rather than each spec rolling its own faker calls inline (see `data/signup/generateData.ts`).

## Minimize test count — prefer data-driven tests

- When several TCs exercise the same flow/assertions and differ only by input data (e.g. multiple password-format violations, multiple boundary-length checks on the same field), write **one parameterized test driven by a data array**, not one `test()` block per TC.
- Use a `for (const case of cases) { test(...) }` loop (or `test.describe` + `.each`-style iteration) with each case carrying its own input, expected message, and a short case name for the test title.
- Only keep separate `test()` blocks when the flow itself genuinely differs (different tab, different navigation outcome, different preconditions) — not just because the TC list treats them as separate rows.
- The QA test case (Excel/CSV) stays 1:1 with documented scenarios; the automation layer is free to collapse multiple TCs into one data-driven test as long as every scenario's input/expected pair is still represented and traceable back to its TC ID (e.g. in the case name or a comment).

## Code style — beautiful, readable formatting

- Consistent 2-space indentation, single quotes, semicolons — match the existing style already in `pages/` and `tests/`.
- Blank line between logical sections of a test (Precondition / Steps / Expected) rather than a wall of unbroken statements.
- Descriptive variable names over short/cryptic ones (`invalidPassword`, not `p1`); no single-letter variables outside trivial loop counters.
- Group related locators/methods together in page objects (e.g. all Step 1 fields, then all Step 2 fields) with a blank line between groups — don't alphabetize or dump them in one block.
- Keep test titles and case names human-readable sentences, not codes (`"Password shorter than 8 characters is rejected"`, not `"pwd_min_len_fail"`).
- No commented-out dead code left in committed files (e.g. stray disabled `projects` entries) unless it documents a real future option worth keeping visible.

## Spec files

- One file per feature: `tests/<type>/<feature>/<feature>.spec.ts`.
- Test titles start with the TC ID, then the description, then tags for filtering: `TC-REG-<n>: <description> @<feature> @positive|@negative @p0|@p1|@p2 @smoke` (smoke optional) — see Priority convention below. The leading TC ID is also what `agentq-helper.ts` reads to match the test to its AgentQ test case.
- Structure each test with `// Precondition`, `// Steps`, `// Expected` comments in that order.

## Priority tagging

Matches the QA test case suite (`Rumi TC Bootcamp`):

| Tag   | Meaning                                                       |
| ----- | ------------------------------------------------------------- |
| `@p0` | Critical — core user journey (e.g. full signup/login success) |
| `@p1` | High — required field/format validation                       |
| `@p2` | Medium — boundary/optional-field checks                       |

## Running tests

- `npx playwright test` — run everything
- `npx playwright test tests/ui/signup` — run one feature
- `npx playwright test --grep @p0` — run by priority tag
