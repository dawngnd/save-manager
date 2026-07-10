# Phase 5: Charts & Rollover Mechanics - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 delivers the Rollover interaction (allowing users to renew a matured deposit with new parameters, updating the old status to rolled_over and appending a new deposit) and a timeseries growth chart showing expected assets growth (principal + interest) over time based on the active deposits.

</domain>

<decisions>
## Implementation Decisions

### Rollover Mechanics & UX
- **D-01:** The "Tái tục" (Rollover) button is displayed only on matured or overdue deposit cards where `diffDays <= 0`.
- **D-02:** The Rollover form will be prefilled with:
  - New principal (`new_amount`) = Old principal.
  - New interest rate (`new_interest_rate`) = Old interest rate.
  - New created date (`created_at`) = Old maturity date.
  - New maturity date (`maturity_at`) = Old maturity date but with the year incremented by 1 (e.g., `10/07/2026` becomes `10/07/2027`).

### Asset Growth Chart & Calculation
- **D-03:** The timeseries chart shows total assets (principal + expected interest) using a **step-wise** calculation method. The asset total increases abruptly on the exact maturity date of each deposit, reflecting when the money and interest are actually realized.
- **D-04:** The chart's time horizon is dynamic, extending from today to the furthest maturity date among all active deposits.
- **D-05:** The chart is rendered at the top of the screen as a collapsible card, but is only displayed when the Mini App is launched with the query parameter `view=chart` or `tgWebAppStartParam=chart`.
- **D-06:** The Telegram bot responds to the `/chart` command by sending a message with a "Xem biểu đồ" button pointing to the Web App URL with `?view=chart`.

### the agent's Discretion
- The style of the line chart (colors, grid layout, dot styles) is left to the agent's discretion, ensuring a premium, dark-themed appearance consistent with the rest of the application.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specifications
- [.planning/PROJECT.md](file:///.planning/PROJECT.md) — Core values and data models.
- [.planning/REQUIREMENTS.md](file:///.planning/REQUIREMENTS.md) — Specifically STAT-01 and DEP-02.
- [backend/Code.js](file:///backend/Code.js#L443-L520) — The `executeRolloverDeposit` implementation details and parameter expectations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `executeRolloverDeposit` in `backend/Code.js`: Handles database-level rollover updates and validation.
- `BottomSheet` in `frontend/src/components/BottomSheet.tsx`: Renders bottom sheets with slide-up transitions.
- `formatMaskDate` in `frontend/src/utils/dateMask.ts`: Standardizes input string formatting.
- `calculateExpectedInterest` in `frontend/src/utils/interest.ts`: Computes expected interest based on amount, rate, and duration.

### Established Patterns
- Inline form validation on blur before submitting.
- Real-time client-side calculation preview for interactive feedback.
- Telegram-themed color styling.

### Integration Points
- `backend/Code.js` (`handleTelegramWebhook`): Needs to process the `/chart` command.
- `frontend/src/components/App.tsx`: Reads query parameters to toggle chart view visibility.

</code_context>

<specifics>
## Specific Ideas
- The rollover form will look identical to `DepositForm` but with different default prefilled values and a target backend endpoint (`rollover_deposit` action instead of `add_deposit`).

</specifics>

<deferred>
## Deferred Ideas
None — discussion stayed within phase scope.

</deferred>

---

*Phase: 5-Charts & Rollover Mechanics*
*Context gathered: 2026-07-10*
