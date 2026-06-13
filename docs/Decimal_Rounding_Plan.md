# Implementation Plan: Round All Dashboard Decimals

**Date:** June 13, 2026
**Status:** 📋 PLAN — awaiting implementation
**File:** `live.html` only — 25 targeted changes

---

## Summary

Change all `toFixed(1)` → `toFixed(0)` on user-visible values across the dashboard.
Also fix fallback strings `'0.0'` → `'0'` on boss rate lines.

## Keep As-Is (do NOT change)

| Line | Value | Reason |
|------|-------|--------|
| 3279 | `attemptsPerDefeat.toFixed(1)` | Ratio — 1 decimal meaningful |
| 3744 | `parseFloat((...).toFixed(1))` | Internal calc, not displayed directly |
| 3850 | `.toFixed(1)` in console.warn | Dev-only, not user-visible |
| 4644 | `parseFloat((...).toFixed(1))` | Internal calc |
| 4645 | `parseFloat((...).toFixed(1))` | Internal calc |
| 5794 | `m.speed.toFixed(1)` | Speed tier — kept per user decision |
| 5795 | `m.mult.toFixed(2)×` | Game score multiplier — always keep decimals |

---

## Changes (25 total)

### Boss Defeat Rates (lines 3266, 3271, 3276)
Also fix fallback `'0.0'` → `'0'` on these lines.

| Line | Before | After |
|------|--------|-------|
| 3266 | `(... * 100).toFixed(1) : '0.0'` | `(... * 100).toFixed(0) : '0'` |
| 3271 | `(... * 100).toFixed(1) : '0.0'` | `(... * 100).toFixed(0) : '0'` |
| 3276 | `(... * 100).toFixed(1) : '0.0'` | `(... * 100).toFixed(0) : '0'` |

### Survival Time Format (line 3375)
| Line | Before | After |
|------|--------|-------|
| 3375 | `(seconds / 60).toFixed(1) + 'm'` | `(seconds / 60).toFixed(0) + 'm'` |

### Avg Level — overview + platform (lines 3522–3524)
| Line | Before | After |
|------|--------|-------|
| 3522 | `(sumAll / countAll).toFixed(1)` | `(sumAll / countAll).toFixed(0)` |
| 3523 | `(sumDesk / countDesk).toFixed(1)` | `(sumDesk / countDesk).toFixed(0)` |
| 3524 | `(sumMob / countMob).toFixed(1)` | `(sumMob / countMob).toFixed(0)` |

### Speed Lock Rate (line 3586)
| Line | Before | After |
|------|--------|-------|
| 3586 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |

### Win Rate + Death Rate (lines 3834, 3842)
| Line | Before | After |
|------|--------|-------|
| 3834 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |
| 3842 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |

### Platform Win Rates (lines 4483, 4500)
| Line | Before | After |
|------|--------|-------|
| 4483 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |
| 4500 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |

### Player Behavior KPIs (lines 4800–4803, 4811)
| Line | Before | After |
|------|--------|-------|
| 4800 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |
| 4801 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |
| 4802 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |
| 4803 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |
| 4811 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |

### Completeness Banner (line 4961)
| Line | Before | After |
|------|--------|-------|
| 4961 | `k.completeness.toFixed(1)` | `k.completeness.toFixed(0)` |

### Funnel Rates + Delta (lines 5114, 5119, 5124, 5130)
| Line | Before | After |
|------|--------|-------|
| 5114 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |
| 5119 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |
| 5124 | `(... * 100).toFixed(1) + '%'` | `(... * 100).toFixed(0) + '%'` |
| 5130 | `(onNum - offNum).toFixed(1) + 'pp'` | `(onNum - offNum).toFixed(0) + 'pp'` |

### Boss Platform Rates (line 5230)
| Line | Before | After |
|------|--------|-------|
| 5230 | `(raw / att * 100).toFixed(1)` | `(raw / att * 100).toFixed(0)` |

### Platform Table Delta (line 5622)
| Line | Before | After |
|------|--------|-------|
| 5622 | `Math.abs(deskVal - mobVal).toFixed(1)` | `Math.abs(deskVal - mobVal).toFixed(0)` |

### Score Mult Table — Avg Level (line 5797)
| Line | Before | After |
|------|--------|-------|
| 5797 | `m.avgLevel.toFixed(1)` | `m.avgLevel.toFixed(0)` |

---

## Testing

- [ ] Overview KPIs: win rate, death rate show whole % (e.g. `44%` not `44.4%`)
- [ ] Boss Analysis: defeat rates whole % (e.g. `75%` not `75.0%`)
- [ ] AI Agent: speed lock rate whole %
- [ ] Player Behavior: all 5 KPIs whole %
- [ ] Platform tab: win rates whole %, avg level whole number
- [ ] Funnel tab: conversion rates + Music ON/OFF delta whole numbers
- [ ] Survival time: `4m` not `3.5m`
- [ ] Score multiplier table: `m.mult` still shows 2 decimals (e.g. `1.25×`) ✅
- [ ] No console errors

---

**User Approval:** ✅ Granted June 13, 2026
