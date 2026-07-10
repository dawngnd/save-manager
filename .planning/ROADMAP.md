# Roadmap: Save Manager

## Overview

Save Manager is a lightweight personal savings tracking system built on top of Google Apps Script, Google Sheets, and Telegram Mini Apps. The development journey proceeds from the foundation of setting up the Google Sheet database and the clasp development environment, building out the backend REST APIs and calculations, setting up the Telegram Bot webhook and maturity alerts, implementing the responsive frontend user interface with user authentication, and finally integrating the growth charts and savings rollover operations.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: DB & clasp Project Setup** - Setup Google Sheets database schema and local clasp synchronization.
- [ ] **Phase 2: Backend DB Operations & Calculations** - Build backend CRUD functions, LockService guards, and expected interest calculations.
- [ ] **Phase 3: Telegram Bot Webhook Integration** - Connect Telegram Bot API webhooks and set up daily maturity alerts cron job.
- [ ] **Phase 4: Frontend UI (TWA) & Auth** - Create the single-file Vite/TS/Tailwind SPA with Telegram Apps SDK integration and deposit forms.
- [ ] **Phase 5: Charts & Rollover Mechanics** - Build growth projection timeseries chart and execute rollover transaction workflow.

## Phase Details

### Phase 1: DB & clasp Project Setup

**Goal**: Setup Google Sheets database schema and configure local clasp development synchronization.
**Depends on**: Nothing (first phase)
**Requirements**: DB-01, API-03
**Success Criteria** (what must be TRUE):

  1. Google Sheet database exists with correct columns on both `Users` and `Deposits` sheets.
  2. Local code changes can be pushed to the GAS project via `clasp push` and run in GAS execution environment.
  3. Timezone settings in `appsscript.json` and the Google Sheet are set to `Asia/Ho_Chi_Minh`.

**Plans**: 2 plans

Plans:

- [x] 01-01: Setup Google Sheet database schema and timezone configurations
- [x] 01-02: Configure clasp development environment and basic doGet test script

### Phase 2: Backend DB Operations & Calculations

**Goal**: Develop server-side GAS operations for adding deposits and reading user data with concurrency guards and interest calculation.
**Depends on**: Phase 1
**Requirements**: DB-02, API-01, API-02
**Success Criteria** (what must be TRUE):

  1. REST call to Web App `doPost` returns correct JSON list of savings when queried for a user.
  2. Adding a deposit via `doPost` creates a row in the `Deposits` sheet with auto-calculated expected interest based on the formulas.
  3. Concurrency test with simulated simultaneous writes executes sequentially without row overwrite errors using `LockService`.

**Plans**: 1/2 plans executed

Plans:

- [x] 02-01-PLAN.md — Implement database operations (read/write deposits) and calculations in Apps Script
- [ ] 02-02-PLAN.md — Build doPost endpoint controller with LockService concurrency guards

### Phase 3: Telegram Bot Webhook Integration

**Goal**: Integrate Telegram Bot webhook to handle bot commands and daily trigger for deposit maturity alerts.
**Depends on**: Phase 2
**Requirements**: BOT-01, NOTF-01
**Success Criteria** (what must be TRUE):

  1. Sending `/start` to the Telegram Bot returns a message with a custom keyboard button that opens the Web App URL.
  2. A daily cron job trigger in GAS runs, scans for deposits maturing in <= 3 days, and successfully sends alert messages to the user via Telegram Bot API.

**Plans**: 2 plans

Plans:

- [ ] 03-01: Establish Telegram Bot webhook connection and `/start` command response
- [ ] 03-02: Implement daily cron job trigger in GAS for deposit maturity checks and alerts

### Phase 4: Frontend UI (TWA) & Auth

**Goal**: Build Vite SPA inlined into a single file, integrated with the Telegram Apps SDK, featuring user authentication and the deposit list / creation form.
**Depends on**: Phase 3
**Requirements**: UI-01, UI-02, UI-03, DEP-01
**Success Criteria** (what must be TRUE):

  1. Compiled Web App displays correctly inside the Telegram Web App container, matching the dark/light theme of Telegram automatically.
  2. User can view their list of active deposits on the screen after typing in their `username_bankcode` to authenticate.
  3. User can fill in the "New Deposit" form and see the newly created deposit immediately added to their list.

**Plans**: 3 plans

Plans:

- [ ] 04-01: Scaffold Vite + TS + Tailwind SPA and configure vite-plugin-singlefile bundler
- [ ] 04-02: Integrate @telegram-apps/sdk and implement basic login/configuration screen
- [ ] 04-03: Create active deposit list view and add deposit interactive form

### Phase 5: Charts & Rollover Mechanics

**Goal**: Build rollover interaction and projection chart to show timeseries asset growth.
**Depends on**: Phase 4
**Requirements**: STAT-01, DEP-02
**Success Criteria** (what must be TRUE):

  1. User can click a "Rollover" button on a matured deposit, input a new principal amount, and verify that the old deposit status changes to `rolled_over` while a new deposit is created.
  2. User can see a timeseries growth chart on their dashboard showing expected assets growth (principal + interest) over time based on the active deposits.

**Plans**: 2 plans

Plans:

- [ ] 05-01: Implement rollover transaction logic in both backend and frontend UI
- [ ] 05-02: Integrate Chart.js and build asset growth timeseries projection dashboard

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. DB & clasp Project Setup | 2/2 | Complete    | 2026-07-10 |
| 2. Backend DB Operations & Calculations | 1/2 | In Progress|  |
| 3. Telegram Bot Webhook Integration | 0/2 | Not started | - |
| 4. Frontend UI (TWA) & Auth | 0/3 | Not started | - |
| 5. Charts & Rollover Mechanics | 0/2 | Not started | - |
