import test from 'node:test';
import assert from 'node:assert';
import {
  createWorkspaceAudit,
  findRelevantDecision,
  textSimilarity,
  applyDecisionMemory,
  type WorkspaceAuditRecord,
} from './workspace';
import { auditBrandCopy, DEFAULT_BRAND_PROFILE } from './governance';

test('createWorkspaceAudit sets unreviewed state and accurate metrics', () => {
  const draft = 'Our insane AI engine is crazy fast and super easy to disrupt legacy enterprise workflows.';
  const result = auditBrandCopy(draft, DEFAULT_BRAND_PROFILE);
  const audit = createWorkspaceAudit(draft, DEFAULT_BRAND_PROFILE, result);

  assert.strictEqual(audit.draft, draft);
  assert.strictEqual(audit.score, result.score);
  assert.strictEqual(audit.status, result.status);
  assert.strictEqual(audit.violations.length, result.violations.length);
  assert.strictEqual(audit.decision, undefined, 'Newly created audit must not have a decision yet');
  assert.strictEqual(audit.reviewerNote, undefined);
  assert.ok(audit.id);
  assert.ok(audit.auditedAt);
});

test('modifying draft creates a distinct new audit without mutating previous record', () => {
  const draft1 = 'Draft version 1 with guaranteed outcomes.';
  const result1 = auditBrandCopy(draft1, DEFAULT_BRAND_PROFILE);
  const audit1 = createWorkspaceAudit(draft1, DEFAULT_BRAND_PROFILE, result1);
  audit1.decision = 'approved';
  audit1.reviewerNote = 'Approved v1';

  const draft2 = 'Draft version 2 with verified metrics.';
  const result2 = auditBrandCopy(draft2, DEFAULT_BRAND_PROFILE);
  const audit2 = createWorkspaceAudit(draft2, DEFAULT_BRAND_PROFILE, result2);

  // audit1 remains unchanged
  assert.strictEqual(audit1.draft, draft1);
  assert.strictEqual(audit1.decision, 'approved');
  assert.strictEqual(audit1.reviewerNote, 'Approved v1');

  // audit2 is independent
  assert.strictEqual(audit2.draft, draft2);
  assert.notStrictEqual(audit2.id, audit1.id);
  assert.strictEqual(audit2.decision, undefined);
});

test('applying correction preserves original draft for historical audit inspection', () => {
  const originalDraft = 'We guarantee 100% foolproof compliance with zero chance of error.';
  const originalResult = auditBrandCopy(originalDraft, DEFAULT_BRAND_PROFILE);
  const audit = createWorkspaceAudit(originalDraft, DEFAULT_BRAND_PROFILE, originalResult);

  // Apply correction
  const correctedCopy = originalResult.suggestedCopy;
  const correctedResult = auditBrandCopy(correctedCopy, DEFAULT_BRAND_PROFILE);

  const updatedAudit: WorkspaceAuditRecord = {
    ...audit,
    originalDraft: audit.draft,
    originalScore: audit.score,
    originalStatus: audit.status,
    originalViolations: audit.violations,
    draft: correctedCopy,
    score: correctedResult.score,
    status: correctedResult.status,
    violations: correctedResult.violations,
    suggestedCopy: correctedResult.suggestedCopy,
    appliedCorrection: correctedCopy,
    correctionStatus: 'applied',
    decision: undefined,
  };

  assert.strictEqual(updatedAudit.originalDraft, originalDraft);
  assert.strictEqual(updatedAudit.draft, correctedCopy);
  assert.strictEqual(updatedAudit.correctionStatus, 'applied');
  assert.strictEqual(updatedAudit.score, 100);
  assert.strictEqual(updatedAudit.violations.length, 0);
  assert.strictEqual(updatedAudit.decision, undefined, 'Decision must be reset on correction');
});
