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
  appliedCorrection?: string;
  correctionStatus?: 'applied' | 'edited' | 'ignored';
  originalDraft?: string;
  originalScore?: number;
  originalStatus?: AuditResult['status'];
  originalViolations?: AuditResult['violations'];
}

export function getHistoricalViolations(audit: WorkspaceAuditRecord): Violation[] {
  return [...(audit.originalViolations ?? []), ...audit.violations];
}

export const WORKSPACE_AUDITS_KEY = 'blackship.workspace-audits.v1';
const storageKey = (accountId?: string) => accountId ? `${WORKSPACE_AUDITS_KEY}.${accountId}` : WORKSPACE_AUDITS_KEY;

export function loadWorkspaceAudits(accountId?: string): WorkspaceAuditRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(storageKey(accountId));
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed as WorkspaceAuditRecord[] : [];
  } catch {
    return [];
  }
}

export function saveWorkspaceAudits(records: WorkspaceAuditRecord[], accountId?: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(storageKey(accountId), JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

export function normalizeAuditText(text: string): string {
  return text.toLocaleLowerCase().replace(/[^a-z0-9\\s]/gi, ' ').replace(/\\s+/g, ' ').trim();
}

export function textSimilarity(left: string, right: string): number {
  const a = new Set(normalizeAuditText(left).split(' ').filter(Boolean));
  const b = new Set(normalizeAuditText(right).split(' ').filter(Boolean));
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const word of a) if (b.has(word)) intersection += 1;
  return intersection / Math.max(1, Math.min(a.size, b.size));
}

export function createWorkspaceAudit(draft: string, profile: BrandProfile, result: AuditResult): WorkspaceAuditRecord {
  const now = new Date();
  const title = draft.trim().replace(/\s+/g, ' ').slice(0, 54) || 'Untitled draft';
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
