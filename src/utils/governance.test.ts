import test from 'node:test';
import assert from 'node:assert';
import { auditBrandCopy } from './governance';

test('empty copy returns perfect score with zero violations', () => {
  const result = auditBrandCopy('');
  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.status, 'passed');
  assert.strictEqual(result.violations.length, 0);
  assert.strictEqual(result.suggestedCopy, '');
});

test('on-brand luxury editorial copy passes cleanly', () => {
  const copy = 'Blackship delivers precision-engineered autonomous brand assurance for global institutions.';
  const result = auditBrandCopy(copy);
  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.status, 'passed');
  assert.strictEqual(result.violations.length, 0);
  assert.strictEqual(result.suggestedCopy, copy);
});

test('preset 1 (hyperbolic pitch copy) produces distinct non-repetitive corrections without duplicate words', () => {
  const input = 'Our insane AI engine is crazy fast and super easy to disrupt legacy enterprise workflows.';
  const result = auditBrandCopy(input);

  assert.strictEqual(result.violations.length, 4);
  // Verify matched keywords
  const matched = result.violations.map(v => v.matchedKeyword);
  assert.ok(matched.includes('insane'));
  assert.ok(matched.includes('crazy fast'));
  assert.ok(matched.includes('super easy'));
  assert.ok(matched.includes('disrupt'));

  // Verify resulting suggestedCopy has distinct replacements:
  // "advanced", "exceptionally fast", "intuitive", "modernize"
  assert.strictEqual(
    result.suggestedCopy,
    'Our advanced AI engine is exceptionally fast and intuitive to modernize legacy enterprise workflows.'
  );

  // Assert no repetitive words
  const words = result.suggestedCopy.toLowerCase().split(/\s+/);
  const wordCounts = words.reduce<Record<string, number>>((acc, w) => {
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {});
  // Key replacement words should appear at most once
  assert.strictEqual(wordCounts['advanced'], 1);
  assert.strictEqual(wordCounts['exceptionally'], 1);
  assert.strictEqual(wordCounts['intuitive'], 1);
  assert.strictEqual(wordCounts['modernize'], 1);
});

test('preset 2 (regulatory guarantee) produces distinct corrections and flags critical violations', () => {
  const input = 'We guarantee 100% foolproof compliance with zero chance of error better than competitors.';
  const result = auditBrandCopy(input);

  assert.strictEqual(result.violations.length, 4);
  assert.strictEqual(result.status, 'failed');
  assert.strictEqual(
    result.suggestedCopy,
    'We deliver deterministic, enterprise-grade compliance with rigorous error mitigation as a category-defining independent platform.'
  );

  // Each violation must have its own distinct explanation
  const explanations = result.violations.map(v => v.explanation);
  const uniqueExplanations = new Set(explanations);
  assert.strictEqual(uniqueExplanations.size, 4);
});

test('preset 3 (casual social post) corrects informal slang and buzzwords with preserved capitalization', () => {
  const input = 'Gonna launch cool stuff today that will supercharge your daily operations.';
  const result = auditBrandCopy(input);

  assert.strictEqual(result.violations.length, 3);
  assert.strictEqual(
    result.suggestedCopy,
    'Preparing to launch new platform capabilities today that will optimize your daily operations.'
  );
});

test('unsupported factual claims receive a concrete conservative correction', () => {
  const result = auditBrandCopy('BLACKSHIP is the #1 fastest platform with 99% accurate results.');
  assert.ok(result.violations.some(v => v.ruleId === 'rule-claims-unverified-fact'));
  assert.notStrictEqual(result.suggestedCopy, 'BLACKSHIP is the #1 fastest platform with 99% accurate results.');
  assert.ok(result.suggestedCopy.includes('a verified brand-governance solution'));
  assert.ok(result.suggestedCopy.includes('measurable, source-backed results'));
});

test('Round 3 Smart Corrections: conservative rewritten version for absolute medical/guarantee claims', () => {
  const input = 'This product is guaranteed to give you perfect results every time. It has zero side effects and is completely risk-free.';
  const result = auditBrandCopy(input);

  assert.ok(result.violations.length >= 3);
  assert.strictEqual(result.status, 'failed');
  assert.ok(result.violations.some(v => v.matchedKeyword === 'guaranteed'));
  assert.ok(result.violations.some(v => v.matchedKeyword === 'perfect results'));
  assert.ok(result.violations.some(v => v.matchedKeyword === 'zero side effects'));
  assert.ok(result.violations.some(v => v.matchedKeyword === 'completely risk-free'));

  // Suggested copy is conservative and free of unverified absolute claims
  assert.ok(!result.suggestedCopy.includes('guaranteed'));
  assert.ok(!result.suggestedCopy.includes('perfect results'));
  assert.ok(!result.suggestedCopy.includes('zero side effects'));
  assert.ok(!result.suggestedCopy.includes('completely risk-free'));
  assert.strictEqual(
    result.suggestedCopy,
    'This product is engineered to give you high-quality outcomes every time. It has a well-tolerated profile and is backed by robust quality standards.'
  );

  // Re-auditing the corrected suggestedCopy satisfies configured rules
  const reAudit = auditBrandCopy(result.suggestedCopy);
  assert.strictEqual(reAudit.status, 'passed');
  assert.strictEqual(reAudit.violations.length, 0);
  assert.strictEqual(reAudit.score, 100);
});

test('Round 3 Better Brand Memory: surfaces previous decision as context for similar content B without deciding it', async () => {
  const { findRelevantDecision, applyDecisionMemory, textSimilarity, createWorkspaceAudit } = await import('./workspace');
  const { DEFAULT_BRAND_PROFILE } = await import('./governance');

  const contentA = 'Our face serum is guaranteed to remove acne in 3 days. It has zero side effects and gives permanent results.';
  const auditResultA = auditBrandCopy(contentA, DEFAULT_BRAND_PROFILE);
  const auditRecordA = createWorkspaceAudit(contentA, DEFAULT_BRAND_PROFILE, auditResultA);

  // Reviewer decision on content A: REJECTED with note
  auditRecordA.decision = 'rejected';
  auditRecordA.reviewerNote = 'Do not allow absolute medical claims or guaranteed results. Use evidence-based and non-absolute wording.';
  auditRecordA.decidedAt = new Date().toISOString();

  const auditHistory = [auditRecordA];

  const contentB = 'Our advanced face serum helps reduce the appearance of acne. Get visible results in just 3 days with our powerful formula. It is the safest and most effective solution for clear skin.';

  // Verify text similarity is computed and exceeds matching threshold
  const similarity = textSimilarity(contentB, contentA);
  assert.ok(similarity >= 0.5, `Expected similarity >= 0.5, got ${similarity}`);

  // Relevant decision is found
  const relevant = findRelevantDecision(contentB, auditHistory);
  assert.ok(relevant);
  assert.strictEqual(relevant?.id, auditRecordA.id);
  assert.strictEqual(relevant?.decision, 'rejected');
  assert.strictEqual(relevant?.reviewerNote, auditRecordA.reviewerNote);

  // New audit for content B is created
  const auditResultB = auditBrandCopy(contentB, DEFAULT_BRAND_PROFILE);
  const auditRecordB = createWorkspaceAudit(contentB, DEFAULT_BRAND_PROFILE, auditResultB);

  // CRITICAL: Previous decision does NOT automatically decide the new audit
  assert.strictEqual(auditRecordB.decision, undefined, 'New audit must not be automatically decided');

  // Decision memory provides context violation
  const memoryAdjusted = applyDecisionMemory(auditResultB, relevant);
  assert.ok(memoryAdjusted.violations.some(v => v.category === 'review-memory'));
});

test('Smart Corrections: properly rewrites permanently removes acne, guarantees, and risk claims', () => {
  // Test 1: exact phrase "permanently removes acne"
  const res1 = auditBrandCopy('permanently removes acne');
  assert.strictEqual(res1.status, 'warning');
  assert.strictEqual(res1.score, 75);
  assert.ok(res1.violations.some(v => v.matchedKeyword === 'permanently removes acne'));
  assert.strictEqual(res1.suggestedCopy, 'helps reduce the appearance of acne');

  // Test 2: "guaranteed to give perfect results"
  const res2 = auditBrandCopy('guaranteed to give perfect results');
  assert.strictEqual(res2.status, 'failed');
  assert.ok(res2.violations.some(v => v.matchedKeyword === 'guaranteed'));
  assert.ok(res2.violations.some(v => v.matchedKeyword === 'perfect results'));
  assert.strictEqual(res2.suggestedCopy, 'engineered to give high-quality outcomes');

  // Test 3: "zero side effects and completely risk-free"
  const res3 = auditBrandCopy('zero side effects and completely risk-free');
  assert.strictEqual(res3.status, 'failed');
  assert.ok(res3.violations.some(v => v.matchedKeyword === 'zero side effects'));
  assert.ok(res3.violations.some(v => v.matchedKeyword === 'completely risk-free'));
  assert.strictEqual(res3.suggestedCopy, 'a well-tolerated profile and backed by robust quality standards');

  // Test 4: Combined passage
  const res4 = auditBrandCopy('Our serum permanently removes acne, is guaranteed to give perfect results, and is completely risk-free with zero side effects.');
  assert.strictEqual(
    res4.suggestedCopy,
    'Our serum helps reduce the appearance of acne, is engineered to give high-quality outcomes, and is backed by robust quality standards with a well-tolerated profile.'
  );

  // Confirm re-auditing suggested copy passes with 100/100 and 0 violations
  const cleanAudit = auditBrandCopy(res4.suggestedCopy);
  assert.strictEqual(cleanAudit.score, 100);
  assert.strictEqual(cleanAudit.status, 'passed');
  assert.strictEqual(cleanAudit.violations.length, 0);
});



