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
