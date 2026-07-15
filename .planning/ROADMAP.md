# Roadmap: Save Manager

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-07-14)
- 🚧 **v2.0 Extension** — Phases 6-8 (planned)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-07-14</summary>

- [x] **Phase 1: DB & clasp Project Setup** - Setup Google Sheets database schema and local clasp synchronization. (completed 2026-07-10)
- [x] **Phase 2: Backend DB Operations & Calculations** - Build backend CRUD functions, LockService guards, and expected interest calculations. (completed 2026-07-10)
- [x] **Phase 3: Telegram Bot Webhook Integration** - Connect Telegram Bot API webhooks and set up daily maturity alerts cron job. (completed 2026-07-10)
- [x] **Phase 4: Frontend UI (TWA) & Auth** - Create the single-file Vite/TS/Tailwind SPA with Telegram Apps SDK integration and deposit forms. (completed 2026-07-10)
- [x] **Phase 5: Charts & Rollover Mechanics** - Build growth projection timeseries chart and execute rollover transaction workflow. (completed 2026-07-10)

</details>

### 🚧 v2.0 Extension (Planned)

- [ ] **Phase 6: Hotfixes & Integration Gaps** - Resolve UserSelector integration, username-bankcode API mapping, and custom text inputs in DepositForm.
- [ ] **Phase 7: WebApp Security & Rollover History** - Add full HMAC signatures validation on backend, and visual lineage tree for deposit history.
- [ ] **Phase 8: Savings Distribution Analyser** - Visual graphs to show savings distribution by interest rate, bank, and duration.

## Progress

Execution Order:
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. DB & clasp Project Setup | v1.0 | 2/2 | Complete | 2026-07-10 |
| 2. Backend DB Operations & Calculations | v1.0 | 2/2 | Complete | 2026-07-10 |
| 3. Telegram Bot Webhook Integration | v1.0 | 2/2 | Complete | 2026-07-10 |
| 4. Frontend UI (TWA) & Auth | v1.0 | 3/3 | Complete | 2026-07-10 |
| 5. Charts & Rollover Mechanics | v1.0 | 2/2 | Complete | 2026-07-10 |
| 6. Hotfixes & Integration Gaps | v2.0 | 0/2 | Not started | — |
| 7. WebApp Security & Rollover History | v2.0 | 0/2 | Not started | — |
| 8. Savings Distribution Analyser | v2.0 | 0/1 | Not started | — |
