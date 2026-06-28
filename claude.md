# Claude Agent Rules

**Purpose:** Guidelines for all Claude agents working on this project.

**Last Updated:** June 26, 2026

---

## 🚫 CRITICAL RULES

### **Rule 1: No Hallucinating or Guessing**

**Problem:** Guessing solutions leads to error loops and wasted time.

**Solution:**
- Use **Haiku agent** to research solutions before implementing
- Document research findings
- Verify against codebase reality

**Example:**
```
❌ BAD: "I think the event name is probably player_won"
✅ GOOD: "Launching Haiku agent to search codebase for event names..."
         [Agent finds: GA4 sends 'game_complete', not 'player_won']
```

**When to use Haiku agent:**
- Unclear about implementation approach
- Need to find existing code patterns
- Researching API or library usage
- Investigating bug root causes

---

### **Rule 2: No Error Loops**

**Problem:** Trying same failed solution repeatedly wastes tokens and time.

**Rule:**
- **1st attempt fails:** Try alternative approach
- **2nd attempt fails:** STOP, document, notify user

**Process:**
```
Attempt 1: Solution A fails
   ↓
Attempt 2: Solution B (different approach) fails
   ↓
STOP - Document both attempts in Issues_And_Bugs.md
   ↓
Launch Haiku agent for research on alternate solutions
   ↓
Present findings to user for decision
```

**User notification format:**
```markdown
⚠️ Solution Not Working After 2 Attempts

**Attempted Solutions:**
1. Solution A: [What was tried] → [Error/failure reason]
2. Solution B: [What was tried] → [Error/failure reason]

**Research Findings:** [Haiku agent results]

**Recommendation:** [Suggested path forward]

**User Input Needed:** Which approach should we take?
```

---

### **Rule 9: Follow Industry Standards and Best Practices — No Exceptions**

**Rule:** All coding, deployment, security, and configuration decisions must follow established industry standards and best practices. When a standard exists, follow it. Do not invent custom approaches or make opinionated deviations without explicit user approval.

**Problem:** Inconsistent research findings and conflicting agent recommendations waste time and create rework. The user should not need to re-research decisions that have an established answer.

**Standards hierarchy (in order of authority):**
1. **RFC / W3C / WHATWG spec** — binding for protocol-level behavior (HTTP status codes, CORS, headers)
2. **OWASP Cheat Sheets (current year)** — binding for security headers, input validation, auth
3. **AWS official documentation** — binding for Lambda, API Gateway, IAM, WAF
4. **MDN Web Docs** — binding for browser API behavior and compatibility
5. **npm / Node.js official docs** — binding for package management and runtime
6. **De facto ecosystem standard** (e.g., Express.js cors defaults, GitHub Actions official examples) — follow when no spec exists

**When two sources conflict:**
- Use the higher-authority source (RFC > MDN > Stack Overflow)
- Document the conflict in the audit plan with both sources cited
- State which source was chosen and why
- Do NOT present both options without a recommendation — always give a clear answer

**Examples:**

❌ **BAD (presenting conflict without resolution):**
```
"MDN says use 200, Express defaults to 204 — your call."
```

✅ **GOOD (citing authority and recommending):**
```
"RFC 9110 does not mandate a specific 2xx for OPTIONS preflight. Express.js cors
(the ecosystem standard) defaults to 204. Current implementation uses 204. No change needed."
```

**Applies to:**
- HTTP status codes
- Security header values and syntax
- npm commands and flags
- Lambda configuration (runtime, handler, timeout)
- Git workflow and branching
- AWS service configuration
- All HTML/JS/CSS patterns

---

### **Rule 11: Always Fill In AWS Deployment Descriptions**

**Rule:** Every API Gateway deployment, Lambda deploy, and AWS console change must include a meaningful description. Never leave description fields blank.

**Why:** Deployment history is the only audit trail for AWS console changes. Without descriptions, rollback decisions require guesswork. A good description enables instant identification of what changed and why.

**Format for API Gateway deployment descriptions:**
```
[Task/Phase] — [What changed] — [Why / security impact if applicable]
```

**Examples:**
```
P-5 Security Audit Phase C — Replace GET + mock OPTIONS with ANY Lambda proxy. Fixes CORS wildcard origin.
P-0 Concurrency Fix — Split 17 parallel fetches into 2 sub-waves of 8+9 to stay under account limit of 10.
```

**Applies to:**
- API Gateway Deploy API modal → Deployment description field
- Lambda function → Deploy button (add version description if prompted)
- CloudFormation stacks, WAF rule deployments, any AWS change with a notes/description field

---

### **Rule 10: Track All AWS Configurations in `docs/AWS_Config.md`**

**Rule:** Every AWS setting, configuration, and infrastructure change must be recorded in `docs/AWS_Config.md`. This file is the local source of truth for all AWS infrastructure. Never ask the user to check the AWS console for a setting that should already be documented.

**Why:** AWS console settings are not version-controlled, not searchable, and invisible to agents. Without this file, every session that needs a config value must either guess, ask the user, or launch a Haiku agent to search files that don't have the answer.

**What to record:**
- Lambda: function name, region, runtime, handler, architecture, timeout, memory, layers, environment variable names (never values)
- API Gateway: endpoint URL, throttle settings, burst limit, quota, CORS configuration
- WAF: rules, rate limits, status
- CloudFront: distributions, origins, cache behaviors (if added)
- GitHub Actions: deploy workflow triggers, branch targets
- Any account-level settings (concurrency limits, quotas)

**When to update `docs/AWS_Config.md`:**
- Any time a setting is created, changed, or verified in the AWS console
- Any time the user shares a screenshot of the AWS console
- Any time a Haiku agent or the user reports a setting value
- After every AWS console task (H-4 WAF, quota changes, etc.)

**What NOT to record:**
- Credential values (API keys, secrets, passwords)
- AWS account IDs (omit from ARNs)
- Environment variable values

**Format:** Update the relevant table and add a row to the Change Log at the bottom of the file.

---

### **Rule 3: Git Commands Provided, Not Executed**

**Rule:** Present git commands to user, do NOT execute unless explicitly permitted.

**Process:**
```
✅ ALLOWED:
"Here's the git command to commit these changes:
git add . && git commit -m 'fix: correct death rate formula'"

❌ FORBIDDEN (without permission):
<invoke Bash>git add . && git commit...</invoke>
```

**Exception:** User explicitly says "run git commit" or "commit these changes now"

**Branch + Deploy Workflow (REQUIRED):**
```
1. Create feature branch:
   git checkout -b feature/[task-name]

2. Commit changes to feature branch

3. Push to staging for testing:
   git push origin feature/[task-name]:staging

4. User tests on staging

5. Only after user confirms ✅ — merge to main:
   git checkout main
   git merge feature/[task-name]
   git push origin main

6. Clean up branch (optional):
   git branch -d feature/[task-name]
```

**FORBIDDEN:**
```
❌ Pushing directly to main without staging test
❌ Skipping branch creation
```

**Format for presenting git commands:**
```markdown
## Git Commands Ready

**Files to commit:**
- live.html
- index.html
- docs/HANDOFF_SUMMARY.md

**Suggested command:**
```bash
# Step 1: Create branch + commit
git checkout -b feature/[task-name]
git add live.html index.html docs/HANDOFF_SUMMARY.md && \
git commit -m "fix: correct powerup phase data

- Set Quad Shot to Purple phase only
- Updated mock data to reflect game design"

# Step 2: Push to staging for testing
git push origin feature/[task-name]:staging
```

**Test on staging, then reply 'merge to main' when confirmed.**
```

---

### **Rule 4: No Co-Author Attribution in Commits**

**Rule:** Do NOT add "Co-Authored-By: Claude" to commit messages.

**Reasoning:** AI assistance is understood in tech community, no need to state it.

**Examples:**

❌ **FORBIDDEN:**
```
git commit -m "fix: death rate formula

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

✅ **CORRECT:**
```
git commit -m "fix: death rate formula"
```

**Note:** User can add attribution if they choose, but agent must not suggest it.

---

### **Rule 5: Always Plan Before Implementation**

**Rule:** Every implementation must have a documented plan first.

**Required Plan Elements:**
1. Task list (step-by-step)
2. Exact lines of code to change (file:line)
3. Inline comments to add
4. Possible errors and solutions
5. Testing validation steps

**Plan Template:**
```markdown
## Implementation Plan: [Task Name]

**Files to Modify:**
- file.js:123-145

**Task Breakdown:**
1. [Step 1] (2 min)
2. [Step 2] (5 min)
3. [Step 3] (3 min)

**Code Changes:**

**Before (lines 123-125):**
```javascript
const oldCode = something;
```

**After:**
```javascript
// Inline comment explaining change
const newCode = somethingElse;
```

**Possible Errors:**
- Error 1: [Description] → Solution: [How to fix]
- Error 2: [Description] → Solution: [How to fix]

**Testing:**
- [ ] Test 1: Expected result
- [ ] Test 2: Expected result

**User Approval Required Before Implementation**
```

**Get user approval before implementing.**

---

### **Rule 6: Concise Responses**

**Rule:** Minimal text overhead, get to the point.

**Guidelines:**
- No unnecessary pleasantries
- No over-explaining obvious things
- Use bullet points, not paragraphs
- Code examples over lengthy descriptions
- Maximum 3 sentences per explanation

**Examples:**

❌ **TOO VERBOSE:**
```
I've carefully analyzed your request and I think we should
probably consider updating the death rate formula because
it seems like it might be including abandoned games which
could potentially lead to some inaccurate metrics that
might mislead users about the actual player death rate...
```

✅ **CONCISE:**
```
Death rate formula includes abandoned games.

Fix:
- Change denominator from `gameStarts` to `completedGames`
- File: live.html:1803

Ready to implement?
```

**Exception:** Complex bugs or investigations may need detail - use HANDOFF_SUMMARY.md or Issues_And_Bugs.md for documentation.

---

### **Rule 7: No Code Implementation Without Permission**

**Rule:** Do NOT write code unless user explicitly requests it.

**Allowed:**
- Reading code
- Analyzing code
- Planning implementations
- Presenting solutions
- Documenting issues

**Forbidden (without explicit permission):**
- Writing new code
- Modifying existing code
- Running implementation commands
- Making file changes

**Permission Phrases (user must say):**
- "implement this"
- "apply the fix"
- "make the change"
- "write the code"
- "do it"

**Ambiguous (ASK FOR CLARIFICATION):**
- "what do you think?" → Present plan, ask if should implement
- "can you fix this?" → Present plan, ask permission to proceed
- "handle it" → Unclear - ask "Should I implement the solution?"

**Process:**
```
User: "The death rate is wrong"
   ↓
Agent: [Investigates, finds issue, creates plan]
   ↓
Agent: "Here's the fix: [plan]. Should I implement?"
   ↓
User: "yes" or "apply the fix"
   ↓
Agent: [Implements]
```

---

### **Rule 8: Always Update api/index.js Before Lambda Deploy Instructions**

**Rule:** Any time a new Lambda handler is added or changed, `api/index.js` must be updated in the repo FIRST, before presenting deploy instructions to the user.

**Problem:** If Lambda deploy instructions are given before the file is saved, the user may paste stale code from their clipboard or a previous session.

**Process:**
```
Write new handler code
   ↓
Edit api/index.js (repo file updated) ✅
   ↓
Confirm file is correct (diff or read)
   ↓
THEN present deploy instructions with the message:
"api/index.js is up to date. Paste the contents into Lambda."
```

**Forbidden:**
```
❌ "Here's the Lambda code to paste: [code block]"
   (without first updating api/index.js)
```

**Correct:**
```
✅ Edit api/index.js → verify → "api/index.js is updated. Use that file for Lambda."
```

**Note:** User copies `api/index.js` directly into the AWS Lambda console. The repo file IS the Lambda source of truth.

---

## 📋 STANDARD WORKFLOW

### **1. Task Received**

```
User request
   ↓
Clarify if ambiguous
   ↓
Confirm understanding
```

### **2. Research (if needed)**

```
Launch Haiku agent for research
   ↓
Document findings
   ↓
Present to user
```

### **3. Planning**

```
Create implementation plan
   ↓
List: files, code changes, tests
   ↓
Identify possible errors
   ↓
Present plan to user
```

### **4. Approval**

```
Wait for explicit permission
   ↓
"implement", "apply", "do it", etc.
```

### **5. Implementation**

```
Apply changes
   ↓
Update HANDOFF_SUMMARY.md
   ↓
Present results
   ↓
Provide git commands (don't execute)
```

### **6. Testing**

```
User tests
   ↓
If fails: Go to error loop prevention (Rule 2)
   ↓
If succeeds: Document completion
```

---

## 📝 DOCUMENTATION REQUIREMENTS

**During Session:**
- Update `HANDOFF_SUMMARY.md` in real-time
- Document all actions, fixes, investigations
- Mark completed tasks with ✅
- Add to `PRIORITIES.md` when tasks complete

**When User Says "Document This":**
- Add entry to appropriate document:
  - `HANDOFF_SUMMARY.md`: Session actions
  - `PRIORITIES.md`: Task planning
  - `Issues_And_Bugs.md`: Bugs/technical issues
  - `BLOG_NOTES.md`: Blog-worthy content

---

## 🔧 ERROR HANDLING

### **When Error Occurs:**

1. **Analyze error** (don't guess)
2. **Try alternative approach** (1 attempt)
3. **If fails again → STOP**
4. **Document in Issues_And_Bugs.md:**
   - Error description
   - Attempted solutions
   - Research findings
5. **Notify user** with recommendation

### **Error Documentation Template:**

```markdown
### ISSUE-XXX: [Error Description]

**Status:** 🔴 OPEN - Needs user assistance
**Severity:** [CRITICAL/MEDIUM/LOW]
**Found:** [Date]

**Error:** [What happened]

**Attempted Solutions:**
1. Solution A: [What was tried] → [Result]
2. Solution B: [What was tried] → [Result]

**Research:** [Haiku agent findings]

**Recommendation:** [Suggested path forward]

**User Decision Needed:** [What user should decide]
```

---

## 🎯 SESSION START CHECKLIST

**Every session, agent should:**

1. Read last 4 entries from `HANDOFF_SUMMARY.md`
2. Read pending tasks from `PRIORITIES.md`
3. Check critical issues in `Issues_And_Bugs.md`
4. Confirm understanding of current priorities
5. Ask user: "What should we work on?"

**Total context load: ~5 minutes**

---

## 🚀 QUICK REFERENCE

| Scenario | Action |
|----------|--------|
| Unclear implementation | Launch Haiku agent for research |
| Solution fails twice | STOP, document, notify user |
| User says "commit" | Present git command, don't execute |
| Planning task | Create detailed plan with code |
| User says "fix it" | Present plan, ask permission |
| Error occurs | Try once, if fails again → STOP |
| User says "document this" | Update appropriate doc file |

---

## ⚠️ VIOLATION CONSEQUENCES

**If agent violates rules:**
1. User will correct behavior
2. Agent should acknowledge mistake
3. Document in session notes
4. Adjust approach going forward

**Example:**
```
User: "Why did you execute git commit without asking?"
Agent: "You're right, I violated Rule 3. I should have presented
        the command for approval. Documenting this in session notes."
```

---

**Rule Version:** 1.0
**Effective:** June 8, 2026
**Review:** After 10 sessions or when rules prove insufficient