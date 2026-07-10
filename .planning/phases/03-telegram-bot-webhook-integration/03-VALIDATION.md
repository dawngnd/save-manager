---
phase: 03
slug: telegram-bot-webhook-integration
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-10
---

# Phase 03 — Validation Strategy

Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js Test Harness (Custom) |
| **Config file** | none |
| **Quick run command** | `node -e "const fs = require('fs'); global.Logger = { log: console.log }; eval(fs.readFileSync('backend/Code.js', 'utf8')); eval(fs.readFileSync('backend/Tests.js', 'utf8')); runTests();"` |
| **Full suite command** | `node -e "const fs = require('fs'); global.Logger = { log: console.log }; eval(fs.readFileSync('backend/Code.js', 'utf8')); eval(fs.readFileSync('backend/Tests.js', 'utf8')); runTests();"` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | BOT-01 | T-03-01 | Webhook Token Auth | integration | `grep "e.parameter.token" backend/Code.js` | ✅ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | BOT-01 | — | Webhook Command Routing | unit | `grep "testDoPostWebhook" backend/Tests.js` | ✅ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | NOTF-01 | T-03-02 | Daily trigger configuration & batching alert | integration | `grep "checkMaturityAndSendAlerts" backend/Code.js` | ✅ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | NOTF-01 | — | Daily trigger logic validation | unit | `grep "testDailyTriggerBehavior" backend/Tests.js` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Webhook URL Live registration | BOT-01 | Cần endpoint công khai từ Google Apps Script | Chạy hàm `setupWebhook()` trong GAS editor và kiểm tra log phản hồi từ Telegram. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
