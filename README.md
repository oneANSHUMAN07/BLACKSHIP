# BLACKSHIP

### AI-Powered Brand Governance Platform

**Your Brand. Never Off-Brand.**

BLACKSHIP helps teams keep their content aligned with their brand guidelines by auditing content, identifying potential brand violations, suggesting corrections, and learning from human review decisions.

---

## 🚀 Overview

As teams create more content across different channels, maintaining a consistent brand voice becomes difficult.

BLACKSHIP acts as a brand governance layer between content creation and publishing.

It allows a team to:

- Define their Brand DNA
- Submit content for auditing
- Detect brand and language violations
- Understand why content was flagged
- Get AI-powered correction suggestions
- Review and approve/reject corrections
- Build reusable Brand Memory from previous decisions

The goal is simple:

> **Create faster without losing brand consistency.**

---

## ✨ Core Workflow

```text
Brand Setup
     ↓
Brand DNA
     ↓
Content Auditor
     ↓
Violation Detection
     ↓
Smart Corrections
     ↓
Human Review
     ↓
Brand Memory
🧠 Key Features
1. Brand DNA
Define the rules that describe your brand:
- Brand name and description
- Industry
- Brand voice
- Approved language
- Restricted language
- Approved facts
- Brand identity information
- Brand guidelines
This information becomes the foundation for content auditing.
2. Content Auditor
Users can submit content for analysis through the Content Auditor.

BLACKSHIP evaluates the submitted content against the available brand rules and identifies potential issues.

The system can detect issues such as:
- Unsupported claims
- Risky language
- Restricted wording
- Tone inconsistencies
- Other brand-rule violations
3. AI-Powered Violation Detection
BLACKSHIP uses an AI backend to analyze submitted content.

The current implementation integrates Adaption Labs with the qwen3.5-397b model for AI-powered analysis.

The backend returns structured audit results containing:
- Pass/fail status
- Detected findings
- Severity
- Recommendations
- Summary
4. Smart Corrections
Instead of simply showing an error, BLACKSHIP provides a suggested way to improve the content.

The user can review the original content alongside the suggested correction and decide whether to apply it.

This keeps the human in control of the final decision.
5. Human Review
AI suggestions are not automatically treated as final decisions.

Users can review the result and:
- Approve
- Edit
- Reject
- Apply a suggested correction
This creates a human-in-the-loop governance process.

6. Brand Memory
Approved and rejected decisions can be used as reusable knowledge for future content decisions.

The long-term goal is to make BLACKSHIP increasingly aligned with how an individual organization actually applies its brand rules.
                    ┌─────────────────────┐
                    │     BLACKSHIP UI    │
                    │   React + Vite      │
                    └──────────┬──────────┘
                               │
                               │ Content / Audit Request
                               ▼
                    ┌─────────────────────┐
                    │   Flask Backend     │
                    │      API Layer      │
                    └──────────┬──────────┘
                               │
                               │ API Request
                               ▼
                    ┌─────────────────────┐
                    │    Adaption Labs    │
                    │  qwen3.5-397b Model │
                    └──────────┬──────────┘
                               │
                               │ Structured Result
                               ▼
                    ┌─────────────────────┐
                    │  Audit Result +     │
                    │  Recommendations    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Human Review /      │
                    │ Smart Correction    │
                    └─────────────────────┘
🛠️ Technology Stack
Frontend
- React
- TypeScript
- Vite
- CSS / Tailwind-based UI components
Backend
- Python
- Flask
- Adaption Labs API / SDK
AI
- Adaption Labs
- qwen3.5-397b
Deployment
- Vercel for the web application
- Custom domain: oneblackship.xyz
