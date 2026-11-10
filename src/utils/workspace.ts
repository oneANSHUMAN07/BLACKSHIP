import type { AuditResult, BrandProfile, Violation } from './governance';

export type ReviewDecision = 'approved' | 'changes_requested' | 'rejected';

export interface WorkspaceAuditRecord {
  id: string;
  title: string;
  brandName: string;
  draft: string;
  score: number;
  status: AuditResult['status'];
  violations: Violation[];
  suggestedCopy: string;
  auditedAt: string;
  decision?: ReviewDecision;
  reviewerNote?: string;
  decidedAt?: string;
  relatedDecisionId?: string;
  appliedCorrection?: string;
  correctionStatus?: 'applied' | 'edited' | 'ignored';
  originalDraft?: string;
  originalScore?: number;
  originalStatus?: AuditResult['status'];
  originalViolations?: AuditResult['violations'];
  originalSuggestedCopy?: string;
}

export function getHistoricalViolations(
  audit: WorkspaceAuditRecord
): Violation[] {
  return [...(audit.originalViolations ?? []), ...audit.violations];
}

export const WORKSPACE_AUDITS_KEY = 'blackship.workspace-audits.v1';

const storageKey = (accountId?: string) =>
  accountId ? `${WORKSPACE_AUDITS_KEY}.${accountId}` : WORKSPACE_AUDITS_KEY;

export function loadWorkspaceAudits(
  accountId?: string
): WorkspaceAuditRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(storageKey(accountId));
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as WorkspaceAuditRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveWorkspaceAudits(
  records: WorkspaceAuditRecord[],
  accountId?: string
): boolean {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(storageKey(accountId), JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

export function normalizeAuditText(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function textSimilarity(left: string, right: string): number {
  const leftWords = new Set(normalizeAuditText(left).split(' ').filter(Boolean));
  const rightWords = new Set(normalizeAuditText(right).split(' ').filter(Boolean));

  if (!leftWords.size || !rightWords.size) return 0;

  let intersection = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) intersection += 1;
  }

  return intersection / Math.max(1, Math.min(leftWords.size, rightWords.size));
}

export function findRelevantDecision(
  draft: string,
  audits: WorkspaceAuditRecord[]
): WorkspaceAuditRecord | undefined {
  return audits
    .filter((audit) => audit.decision && audit.draft !== draft)
    .map((audit) => ({
      audit,
      similarity: textSimilarity(draft, audit.draft),
    }))
    .filter(({ similarity }) => similarity >= 0.6)
    .sort(
      (left, right) =>
        right.similarity - left.similarity ||
        (right.audit.decidedAt ?? '').localeCompare(left.audit.decidedAt ?? '')
    )[0]?.audit;
}

export function applyDecisionMemory(
  result: AuditResult,
  prior?: WorkspaceAuditRecord
): AuditResult {
  if (!prior) return result;

  const note = prior.reviewerNote?.trim();
  const decisionText =
    prior.decision === 'approved'
      ? 'A reviewer approved similar content.'
      : prior.decision === 'rejected'
        ? 'A reviewer rejected similar content.'
        : 'A reviewer requested changes to similar content.';

  const memoryViolation: Violation = {
    ruleId: `review-memory-${prior.id}`,
    matchedKeyword: 'Similar previously reviewed content',
    severity: prior.decision === 'rejected' ? 'critical' : 'advisory',
    recommendation:
      prior.decision === 'approved'
        ? 'Retain the reviewer-approved approach.'
        : note || 'Review the similar prior decision before approval.',
    category: 'review-memory',
    explanation: `${decisionText}${note ? ` Reviewer note: ${note}` : ''}`,
  };

  return {
    ...result,
    score: Math.max(0, result.score - (prior.decision === 'rejected' ? 25 : 5)),
    status:
      prior.decision === 'rejected'
        ? 'failed'
        : result.status === 'passed' && prior.decision === 'changes_requested'
          ? 'warning'
          : result.status,
    violations: [...result.violations, memoryViolation],
    suggestedCopy:
      prior.decision === 'approved'
        ? result.suggestedCopy
        : prior.appliedCorrection?.trim() || result.suggestedCopy,
  };
}

export function createWorkspaceAudit(
  draft: string,
  profile: BrandProfile,
  result: AuditResult
): WorkspaceAuditRecord {
  const now = new Date();
  const title =
    draft.trim().replace(/\s+/g, ' ').slice(0, 54) || 'Untitled draft';

  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    brandName: profile.brandName || 'Untitled brand',
    draft,
    score: result.score,
    status: result.status,
    violations: result.violations,
    suggestedCopy: result.suggestedCopy,
    auditedAt: now.toISOString(),
  };
}
