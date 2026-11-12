# BLACKSHIP

BLACKSHIP is a brand governance workspace designed to help teams audit marketing content against defined brand and compliance rules, review detected issues, apply safer corrections, and maintain an auditable record of content decisions.

Live Product Link : https://www.oneblackship.xyz/

## How to Use

### 1. Open BLACKSHIP
Visit the live BLACKSHIP application:

**https://www.oneblackship.xyz/**

### 2. Sign In or Use Demo Account
Sign in with your account to access the workspace. If demo mode is available, use the demo option to explore the product without setting up a separate account.

### 3. Set Up Brand DNA
Open **Brand DNA** and add your brand information, including:
- Brand guidelines
- Approved facts
- Brand preferences and assets

This information is used as context during content review.

### 4. Audit Content
Open **Content Auditor** and enter the marketing/content copy you want to check.

BLACKSHIP analyzes the content against the configured brand rules and identifies potential issues such as:
- Brand guideline violations
- Unsupported or problematic claims
- Inconsistent messaging

### 5. Review AI Findings
Check the audit score, detected violations, explanations, and suggested correction.

### 6. Use Smart Corrections
When a correction is available, you can:
- **Apply** the suggested correction
- **Edit & Apply** the correction before using it
- **Ignore** the suggestion

After applying or editing a correction, BLACKSHIP re-audits the updated content.

### 7. Make a Human Review Decision
Reviewers can record a final decision:
- **Approved**
- **Rejected**
- **Changes Requested**

For non-approved decisions, a reviewer note can be added to explain the decision.

### 8. Use Brand Memory
Open **Brand Memory** to view previous human review decisions and similar past audits.

Previous decisions are shown as review context when similar content is encountered again, helping maintain consistency without automatically deciding the new audit.

### 9. View Audit History
Open **Audit History** to review saved audits, including:
- Original content
- Audit score and violations
- Suggested corrections
- Applied/edited corrections
- Review decisions
- Reviewer notes
- Decision timestamps

### 10. Reports & Export
Use the **Reports** section to review saved audit and review activity and export audit information when required.

### Typical Workflow

**Brand DNA → Content Audit → AI Analysis → Smart Corrections → Human Review → Brand Memory / Audit History**

BLACKSHIP is designed so that a reviewer can complete the full content-governance workflow without requiring a separate walkthrough.

## Core Product Capabilities

### Brand DNA
Define the active brand profile and the rules used during content review.

### Content Auditor
Run marketing copy through BLACKSHIP's deterministic rule engine. The auditor evaluates the draft, calculates a Rule Engine Score, identifies policy violations, and generates correction suggestions where applicable.

### Reviewer Workflow
Audited content can be reviewed by a human reviewer. Reviewers can approve content, request changes, or reject content. Review notes are retained with the audit record where required.

### Smart Corrections
BLACKSHIP does more than identify problematic content. When a violation can be safely corrected, the system generates a conservative replacement suggestion.

Available correction actions include:
- Apply
- Edit & Apply
- Ignore

When a correction is applied or edited, the corrected content is audited again so the updated score and violations reflect the new content. A previous reviewer decision is reset when the underlying content changes.

### Better Brand Memory
BLACKSHIP retains previous human review decisions as reusable review context.

For previous audits, the workspace stores:
- reviewer decision
- reviewer note
- decision timestamp
- reviewed content
- audit findings
- correction information

When a new audit has similar content, BLACKSHIP uses deterministic text similarity to identify relevant previous decisions. Similar prior decisions are displayed as context for the reviewer.

Previous human decisions do **not** automatically decide a new audit.

### Complete Audit History
Every saved audit can retain the content review trail, including:
- original draft
- Rule Engine Score
- detected violations
- AI-suggested correction
- applied or edited correction
- correction status
- human reviewer decision
- reviewer note
- decision timestamp

This provides a traceable record of how content was reviewed and changed over time.

### Reports
BLACKSHIP provides workspace reporting based on saved audit and reviewer data, including review outcomes, violation information, and recent activity.

Individual audit reports can also be exported as JSON.

## Round 3 Improvements

### 1. Better Brand Memory
Previous human decisions are now retained and surfaced as context when similar content is reviewed again.

The system uses deterministic text similarity to identify similar prior audits. This makes previous review knowledge reusable without automatically forcing an old decision onto new content.

### 2. Smarter AI Corrections
Smart Corrections now provide actionable replacement copy instead of only identifying a problem.

Users can review the proposed correction, apply it directly, edit it before applying, or ignore it. Applied corrections are re-audited to verify the resulting content.

### 3. Complete Audit History
Audit records now preserve the content review journey, including the original draft, detected problems, suggested correction, applied correction, correction status, reviewer decision, reviewer note, and timestamps.

This allows reviewers to understand what was checked, what changed, and what final decision was made.

## Technical Architecture

BLACKSHIP uses a React/TypeScript/Vite frontend.

### Frontend
- React
- TypeScript
- Vite
- Component-based workspace UI
- React-based routing/workspace navigation

### Governance Engine
The content audit is performed by a local deterministic rule engine.

The engine:
1. receives the marketing draft
2. evaluates configured brand/governance rules
3. identifies violations
4. calculates a Rule Engine Score
5. generates correction suggestions where appropriate
6. returns the audit result to the workspace

### Data Layer
BLACKSHIP uses local persistence for workspace continuity and Firebase for authenticated cloud workspace storage.

### Authentication
Firebase Authentication is used for account sign-in and authenticated workspace access.

### Cloud Storage
Firestore is used for cloud workspace data, including brand and audit information.

### Demo / Local Mode
The project also supports local/demo operation so the core governance workflow can be tested without depending entirely on cloud storage.

## Testing & Reliability

Round 3 testing covered the main product journeys and repeated actions.

### Audit Flow
Tested:
- valid marketing copy
- problematic claims
- failed audit results
- passed audit results
- repeated audit actions
- empty/cleared content states

### Smart Corrections
Tested:
- detection of problematic claims
- generated replacement copy
- Apply
- corrected-content re-audit
- score improvement after correction
- removal of detected violations
- reviewer decision reset after content changes

### Audit History
Tested:
- creation of audit records
- preservation of original content
- preservation of detected violations
- suggested corrections
- applied corrections
- reviewer status and decisions
- timestamps
- opening previously saved audits

### Brand Memory
Tested:
- retention of previous human decisions
- display of previous decision context
- similarity-based prior audit matching
- reviewer context without automatic decision inheritance

### Account / Workspace
Tested:
- authenticated workspace access
- saved audit visibility
- account-level workspace information
- Firebase-backed workspace integration

## Local Development

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The project requires the Firebase environment variables used by the application. Refer to `FIREBASE_SETUP.md` for Firebase configuration and Firestore setup.

## Project Structure

```text
src/
├── components/
│   ├── BrandDnaPanel.tsx
│   ├── LiveAuditor.tsx
│   ├── LoginPage.tsx
│   └── WorkspaceApp.tsx
│
├── utils/
│   ├── firebase.ts
│   ├── cloudWorkspace.ts
│   ├── governance.ts
│   ├── workspace.ts
│   └── *.test.ts
│
└── ...
```

Supporting project files include:
- `README.md`
- `FIREBASE_SETUP.md`
- `BLACKSHIP_FIXES.md`
- `firestore.rules`
- `package.json`
- `vite.config.ts`

## Future Roadmap

Future development can extend BLACKSHIP beyond the current deterministic governance workflow.

Potential roadmap areas include:

1. More advanced brand-memory retrieval and ranking.
2. More configurable governance and compliance rule sets.
3. Expanded correction intelligence for different content categories.
4. More detailed analytics and review reporting.
5. Stronger multi-user workspace and collaboration workflows.
6. Additional integrations with content and marketing workflows.
7. Improved cloud reliability and operational monitoring.
8. More extensive automated regression and end-to-end test coverage.

## Current Product Position

BLACKSHIP has progressed from a basic content-auditing prototype toward a complete brand-governance workflow.

The current product combines:

**Audit → Diagnose → Correct → Re-audit → Human Review → Decision → Historical Context**

The Round 3 improvements strengthen this workflow by making previous decisions reusable, corrections actionable, and the complete review journey traceable.
