# Powerup Collection Data Issue - Investigation Index

Complete investigation documentation for the Quad Shot powerup data discrepancy.

**Investigation Date:** June 8, 2026
**Issue:** Quad Shot showing in Green/Red phases when should be Purple-only
**Status:** Investigation Complete - Ready for Fix

---

## Quick Start

**For Decision Makers:**
- Read: `POWERUP_ISSUE_SUMMARY.txt` (5 min)
- Decide: Quick fix vs. proper fix
- Contact: Engineering team with decision

**For Engineers (Quick Fix):**
- Read: `Powerup_Data_Fix_Instructions.md` → "Quick Fix (5 minutes)"
- Apply: Changes to both files
- Test: Validation checklist
- Commit: Changes with PR

**For Engineers (Proper Fix):**
- Read: `Powerup_Data_Investigation_Report.md` (full analysis)
- Read: `Powerup_Data_Fix_Instructions.md` → "Proper Fix (2-4 hours)"
- Plan: 4-step implementation
- Execute: Code changes and testing

---

## Document Guide

### 1. Executive Summary (START HERE)
**File:** `POWERUP_ISSUE_SUMMARY.txt`
**Length:** 3 pages (easily readable)
**Best For:** Quick overview, decision making

**Contains:**
- Problem statement (what's wrong)
- Root causes (3 identified)
- Immediate action required (exact code changes)
- Next steps (4-phase plan)
- Validation checklist

**Read Time:** 5-10 minutes

---

### 2. Technical Investigation Report
**File:** `Powerup_Data_Investigation_Report.md`
**Length:** 12 pages (comprehensive)
**Best For:** Full technical understanding

**Contains:**
- Executive summary
- Problem statement with data comparison
- Investigation findings (4 detailed sections)
- Root cause analysis
- Data pattern analysis
- Powerup availability rules
- Issues found (3 sub-issues)
- Recommended fixes (2 options)
- Code locations summary
- Questions for clarification
- Conclusion and next steps

**Read Time:** 20-30 minutes
**Sections to Focus On:**
- "Problem Statement" (understand what's wrong)
- "Root Cause Analysis" (understand why)
- "Code Locations Summary" (know what to change)
- "Recommended Fixes" (two implementation paths)

---

### 3. Implementation Instructions
**File:** `Powerup_Data_Fix_Instructions.md`
**Length:** 8 pages (actionable)
**Best For:** Actually fixing the issue

**Contains:**
- Quick fix (5 minutes) - step by step
- Alternative fix (remove column entirely)
- Proper fix (2-4 hours) - detailed steps
- Implementation checklist
- Validation procedures
- Rollback plan
- Pre-implementation questions

**Read Time:** 15-20 minutes
**Most Important Sections:**
- "Quick Fix (5 minutes)" - exact code changes
- "Implementation Checklist" - what to do
- "Validation" - how to verify it works

---

### 4. Code Reference Guide
**File:** `Powerup_Issue_Code_Reference.md`
**Length:** 8 pages (code focused)
**Best For:** Understanding the code

**Contains:**
- Exact line numbers for all issues
- Complete code snippets
- Full function listings
- Before/after comparisons
- Supporting documentation excerpts
- Data quality analysis
- Impact summary
- File change summary table

**Read Time:** 15-20 minutes
**Use When:**
- You need to see the exact code
- You're making the code changes
- You want to understand function flow
- You need line numbers for navigation

---

## Investigation Findings Overview

### Issues Identified

**ISSUE-005: Quad Shot Appearing in Wrong Phases**

Sub-Issue 1: Hardcoded Mock Data
- Location: `live.html:1640-1644`, `index.html:1634-1638`
- Problem: Sample data shows Quad Shot in all phases (fabricated)
- Fix: Change 4 numbers (2 per file)
- Time: 5 minutes

Sub-Issue 2: GA4 Schema vs. Game Implementation Mismatch
- Game: 3-type cycle (Health, Shield, Laser variant)
- GA4: 4 distinct types (health, shield, double_laser, quad_shot)
- Impact: Ambiguity about how Quad Shot fits in cycling system
- Resolution: Requires game code audit

Sub-Issue 3: Dashboard Not Using Live GA4 Data
- Chart renders: Hardcoded DATA.powerups object
- Missing: Powerup data extraction in mapGA4ResponseToDATA()
- Impact: Static sample data shown regardless of actual events
- Proper fix: Implement live GA4 data extraction (2-4 hours)

---

## Code Locations Quick Reference

| Issue | File | Lines | What's Wrong |
|-------|------|-------|--------------|
| Mock Data | live.html | 1640-1644 | Quad Shot in all phases |
| Mock Data | index.html | 1634-1638 | Quad Shot in all phases |
| Chart Render | live.html | 2141-2156 | Uses hardcoded data |
| Chart Render | index.html | 1814-1829 | Uses hardcoded data |
| API Mapping | live.html | 1736-1839 | Doesn't extract powerup data |
| GA4 Schema | live.html | 1371 | Defines 4 types, game has 3 |
| GA4 Schema | index.html | 1399 | Defines 4 types, game has 3 |

---

## Powerup Rules (From Game Design)

**Correct Powerup Availability:**

```
Green Phase (L1-4):   Shield → Laser → Health
Red Phase (L5-8):     Laser → Health → Shield
Purple Phase (L9-12): Health → Shield → Laser

Laser Variants:
  Green:  Double Laser
  Red:    Triple Laser (likely)
  Purple: Quad Shot (Purple-only confirmed by user)
```

**Current Incorrect Data:**

```
                Health    Double Laser    Shield    Quad Shot
Green Phase:    420         310           280        190  ❌ Should be 0
Red Phase:      510         390           340        220  ❌ Should be 0
Purple Phase:   280         210           430        310  ✅ Correct
```

---

## Fix Options

### Option 1: Quick Fix (Recommended First Step)
- Change 4 numbers in 2 files
- Time: 5 minutes
- Risk: Very low
- Result: Corrected mock data
- Code: See `Powerup_Data_Fix_Instructions.md` → "Quick Fix"

### Option 2: Remove Quad Shot Column
- Simplify chart to 3 powerups
- Time: 5 minutes
- Risk: Low (but requires chart change)
- Result: Simpler, cleaner chart
- Code: See `Powerup_Data_Fix_Instructions.md` → "Fix B"

### Option 3: Proper Fix (Long-term Solution)
- Implement live GA4 data
- Time: 2-4 hours
- Risk: Medium (but most correct)
- Result: Chart displays actual events
- Code: See `Powerup_Data_Fix_Instructions.md` → "Proper Fix"

**Recommended Approach:**
1. Apply Quick Fix immediately (5 min)
2. Schedule Proper Fix for later (2-4 hours)

---

## Related Issues

These are separate but related data problems in the same dashboard:

- **ISSUE-001:** Death Rate formula incorrectly includes abandoned games
  - Location: `live.html:1803-1809`
  - Status: Fix already applied, awaiting validation

- **ISSUE-002:** 52.6% of games missing outcome events
  - Location: Game source code (event tracking)
  - Status: Requires GA4 investigation

- **ISSUE-004:** Event name mismatch (player_won vs game_complete)
  - Location: `live.html:1795`
  - Status: Identified, awaiting fix

---

## Navigation

**By Role:**

- **Product Manager/Decision Maker:**
  1. POWERUP_ISSUE_SUMMARY.txt (understand the issue)
  2. Powerup_Data_Fix_Instructions.md → "Implementation Checklist" (plan)

- **Frontend Engineer:**
  1. Powerup_Data_Fix_Instructions.md → "Quick Fix" (implement)
  2. Powerup_Issue_Code_Reference.md (understand code)

- **Backend Engineer:**
  1. Powerup_Data_Investigation_Report.md → "Proper Fix" section
  2. Powerup_Data_Fix_Instructions.md → "Proper Fix" (implement)

- **QA/Testing:**
  1. Powerup_Data_Fix_Instructions.md → "Validation" (test)
  2. POWERUP_ISSUE_SUMMARY.txt → "Validation Checklist" (verify)

**By Task:**

- **I need to understand the problem:** Read POWERUP_ISSUE_SUMMARY.txt
- **I need to fix it now:** Read Powerup_Data_Fix_Instructions.md
- **I need to understand the code:** Read Powerup_Issue_Code_Reference.md
- **I need comprehensive analysis:** Read Powerup_Data_Investigation_Report.md

---

## Implementation Timeline

### Immediate (Today)
- Review investigation documents
- Make decision: Quick fix vs. Proper fix
- Communicate decision to team
- Apply Quick Fix if approved

**Estimated Time:** 30 minutes decision + 5 minutes implementation

### Short Term (This Week)
- Apply proper fix if going that route
- Audit game source code for powerup events
- Verify all GA4 event parameters
- Test with live data

**Estimated Time:** 4-6 hours

### Medium Term (This Month)
- Expand GA4 API to include powerup dimensions
- Implement live data in chart
- Move off hardcoded mock data
- Validate other phase/powerup combinations

**Estimated Time:** 8-12 hours

### Long Term
- Audit all mock data for accuracy
- Implement data validation framework
- Create automated tests
- Document event standards

**Estimated Time:** Ongoing

---

## Key Takeaways

1. **Root Cause:** Hardcoded incorrect sample data (not live GA4 data)

2. **Immediate Impact:** Users cannot trust powerup distribution metrics

3. **Quick Fix:** Change 4 numbers in 2 files (5 minutes)

4. **Proper Fix:** Connect chart to live GA4 data (2-4 hours)

5. **Questions Needing Answers:**
   - Confirm Quad Shot is Purple-only? (Yes/No)
   - Quick fix or proper fix? (Now/Later)
   - Check other powerup combinations? (Yes/No)

---

## Document Version
- **Version:** 1.0
- **Created:** June 8, 2026
- **Updated:** June 8, 2026
- **Status:** Complete
- **Next Review:** After fix implementation

---

## Contact & Questions

For questions about this investigation:
1. Review the appropriate document above
2. Check "Questions for Clarification" sections
3. Refer to code locations for context

All documents include specific file:line references for easy code navigation.
