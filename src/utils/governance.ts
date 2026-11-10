/**
 * Core Brand Governance logic and rule-based remediation engine
 */

export interface BrandRule {
  id: string;
  category: 'tone' | 'terminology' | 'claims' | 'compliance';
  name: string;
  forbiddenKeywords: string[];
  severity: 'critical' | 'warning' | 'advisory';
  description: string;
}

export interface PhraseRemediation {
  keyword: string;
  replacement: string;
  category: 'tone' | 'terminology' | 'claims' | 'compliance';
  severity: 'critical' | 'warning' | 'advisory';
  explanation: string;
}

export interface Violation {
  ruleId: string;
  matchedKeyword: string;
  severity: 'critical' | 'warning' | 'advisory';
  recommendation: string;
  category: string;
  explanation: string;
}

export interface AuditResult {
  score: number;
  status: 'passed' | 'warning' | 'failed';
  violations: Violation[];
  suggestedCopy: string;
}

export interface CustomBrandRule {
  id: string;
  phrase: string;
  replacement: string;
  severity: 'critical' | 'warning' | 'advisory';
}

export interface BrandProfile {
  brandName: string;
  description: string;
  industry: string;
  voiceDescription: string;
  approvedTerms: string[];
  approvedFacts: string[];
  customRules: CustomBrandRule[];
}

const BRAND_PROFILE_KEY = 'blackship.brand-profile.v1';

const storageKey = (key: string, accountId?: string) =>
  accountId ? `${key}.${accountId}` : key;

export const DEFAULT_BRAND_PROFILE: BrandProfile = {
  brandName: 'BLACKSHIP',
  description: '',
  industry: '',
  voiceDescription:
    'Authoritative, restrained, precise, and enterprise-focused.',
  approvedTerms: ['precision-engineered', 'brand assurance'],
  approvedFacts: [],
  customRules: [],
};

export function loadBrandProfile(accountId?: string): BrandProfile {
  if (typeof window === 'undefined') return DEFAULT_BRAND_PROFILE;

  try {
    const saved = window.localStorage.getItem(
      storageKey(BRAND_PROFILE_KEY, accountId)
    );

    if (!saved) return DEFAULT_BRAND_PROFILE;

    const parsed = JSON.parse(saved) as Partial<BrandProfile>;

    return {
      ...DEFAULT_BRAND_PROFILE,
      ...parsed,
      description:
        typeof parsed.description === 'string' ? parsed.description : '',
      industry: typeof parsed.industry === 'string' ? parsed.industry : '',
      approvedTerms: Array.isArray(parsed.approvedTerms)
        ? parsed.approvedTerms
        : DEFAULT_BRAND_PROFILE.approvedTerms,
      approvedFacts: Array.isArray(parsed.approvedFacts)
        ? parsed.approvedFacts
        : [],
      customRules: Array.isArray(parsed.customRules)
        ? parsed.customRules
        : [],
    };
  } catch {
    return DEFAULT_BRAND_PROFILE;
  }
}

export function saveBrandProfile(
  profile: BrandProfile,
  accountId?: string
): boolean {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(
      storageKey(BRAND_PROFILE_KEY, accountId),
      JSON.stringify(profile)
    );

    return true;
  } catch {
    return false;
  }
}

/**
 * Phrase-specific dictionary mapping forbidden words to distinct,
 * contextually appropriate professional alternatives.
 */
export const PHRASE_REMEDIATIONS: PhraseRemediation[] = [
  // Preset 1: Hyperbolic Pitch Copy
  {
    keyword: 'insane',
    replacement: 'advanced',
    category: 'tone',
    severity: 'warning',
    explanation:
      'Replace sensationalist hype "insane" with the authoritative performance descriptor "advanced".',
  },
  {
    keyword: 'crazy fast',
    replacement: 'exceptionally fast',
    category: 'tone',
    severity: 'warning',
    explanation:
      'Replace breathless speed colloquialism "crazy fast" with measured, quantifiable velocity terminology "exceptionally fast".',
  },
  {
    keyword: 'super easy',
    replacement: 'intuitive',
    category: 'tone',
    severity: 'advisory',
    explanation:
      'Replace casual phrasing "super easy" with the professional usability descriptor "intuitive".',
  },
  {
    keyword: 'disrupt',
    replacement: 'modernize',
    category: 'terminology',
    severity: 'warning',
    explanation:
      'Replace overused tech cliche "disrupt" with constructive transformation term "modernize".',
  },

  // Preset 2: Risky Regulatory Guarantee
  {
    keyword: 'guarantee',
    replacement: 'deliver',
    category: 'claims',
    severity: 'critical',
    explanation:
      'Eliminate absolute legal warranty "guarantee" to adhere to corporate regulatory compliance standards.',
  },
  {
    keyword: '100% foolproof',
    replacement: 'deterministic, enterprise-grade',
    category: 'claims',
    severity: 'critical',
    explanation:
      'Replace unprovable absolute claim "100% foolproof" with verifiable precision architecture descriptor "deterministic, enterprise-grade".',
  },
  {
    keyword: 'zero chance of error',
    replacement: 'rigorous error mitigation',
    category: 'claims',
    severity: 'critical',
    explanation:
      'Replace zero-defect warranty "zero chance of error" with defensible governance benchmark "rigorous error mitigation".',
  },
  {
    keyword: 'better than competitors',
    replacement: 'as a category-defining independent platform',
    category: 'terminology',
    severity: 'critical',
    explanation:
      'Remove unverified competitor disparagement "better than competitors" in compliance with fair marketing standards.',
  },

  // Preset 3: Casual Social Post
  {
    keyword: 'gonna',
    replacement: 'preparing to',
    category: 'tone',
    severity: 'advisory',
    explanation:
      'Replace informal phonetic slang "gonna" with formal executive announcement syntax "preparing to".',
  },
  {
    keyword: 'cool stuff',
    replacement: 'new platform capabilities',
    category: 'tone',
    severity: 'advisory',
    explanation:
      'Replace vague conversational expression "cool stuff" with concrete feature terminology "new platform capabilities".',
  },
  {
    keyword: 'supercharge',
    replacement: 'optimize',
    category: 'tone',
    severity: 'warning',
    explanation:
      'Replace hyper-inflated marketing buzzword "supercharge" with measurable operational impact term "optimize".',
  },

  // Additional enterprise vocabulary guardrails
  {
    keyword: 'game-changing',
    replacement: 'foundational',
    category: 'tone',
    severity: 'warning',
    explanation:
      'Replace overused industry cliché "game-changing" with substantive architecture descriptor "foundational".',
  },
  {
    keyword: 'cheaper alternative',
    replacement: 'cost-efficient enterprise platform',
    category: 'terminology',
    severity: 'critical',
    explanation:
      'Avoid discounting language "cheaper alternative"; emphasize institutional value.',
  },
  {
    keyword: 'cheap copy',
    replacement: 'derivative alternative',
    category: 'terminology',
    severity: 'critical',
    explanation:
      'Replace derogatory informal phrasing "cheap copy" with objective comparative terminology.',
  },
  {
    keyword: 'guaranteed success',
    replacement: 'measurable outcomes',
    category: 'claims',
    severity: 'critical',
    explanation:
      'Replace speculative performance promise with verifiable impact metrics.',
  },
  {
    keyword: 'wanna',
    replacement: 'seek to',
    category: 'tone',
    severity: 'advisory',
    explanation:
      'Replace conversational colloquialism "wanna" with formal intent syntax "seek to".',
  },
  {
    keyword: 'kinda',
    replacement: 'moderately',
    category: 'tone',
    severity: 'advisory',
    explanation:
      'Replace vague hedging word "kinda" with precise qualification.',
  },
];

export const DEFAULT_BRAND_RULES: BrandRule[] = [
  {
    id: 'rule-tone-hype',
    category: 'tone',
    name: 'Prohibit Hyperbolic SaaS Jargon',
    forbiddenKeywords: [
      'insane',
      'crazy fast',
      'game-changing',
      'supercharge',
      'disrupt',
    ],
    severity: 'warning',
    description:
      'Maintain an authoritative, measured luxury tone. Avoid breathless tech cliches.',
  },
  {
    id: 'rule-term-competitor',
    category: 'terminology',
    name: 'Restricted Competitor Mentions',
    forbiddenKeywords: [
      'better than competitors',
      'cheaper alternative',
      'cheap copy',
    ],
    severity: 'critical',
    description:
      'Never compare on price or use degrading competitor language.',
  },
  {
    id: 'rule-claims-guarantee',
    category: 'claims',
    name: 'Unsubstantiated Guarantee',
    forbiddenKeywords: [
      'guarantee',
      'guarantees',
      'guaranteed',
      '100% foolproof',
      'guaranteed success',
      'zero chance of error',
    ],
    severity: 'critical',
    description:
      'Ensure regulatory and legal compliance by avoiding absolute guarantees.',
  },
  {
    id: 'rule-tone-slang',
    category: 'tone',
    name: 'Informal Slang & Casualisms',
    forbiddenKeywords: [
      'gonna',
      'wanna',
      'kinda',
      'cool stuff',
      'super easy',
    ],
    severity: 'advisory',
    description:
      'Brand messaging must reflect institutional precision.',
  },
];

/**
 * Escape a string so it can safely be inserted into a RegExp.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Audits marketing copy against deterministic brand rules,
 * producing distinct non-repetitive corrections and phrase-specific explanations.
 */
export function auditBrandCopy(
  text: string,
  profile: BrandProfile = DEFAULT_BRAND_PROFILE
): AuditResult {
  if (!text || text.trim().length === 0) {
    return {
      score: 100,
      status: 'passed',
      violations: [],
      suggestedCopy: text,
    };
  }

  const violations: Violation[] = [];
  let correctedText = text;

  // Custom brand rules
  const customRemediations: PhraseRemediation[] = profile.customRules
    .filter((rule) => rule.phrase.trim().length > 0)
    .map((rule) => ({
      keyword: rule.phrase.trim(),
      replacement: rule.replacement.trim(),
      category: 'compliance',
      severity: rule.severity,
      explanation: rule.replacement.trim()
        ? `Restricted by ${profile.brandName || 'the brand'} policy.`
        : `Restricted by ${
            profile.brandName || 'the brand'
          } policy. The phrase is removed from the suggestion; review the revised copy manually.`,
    }));

  // Approved terms should not be flagged.
  const approvedTerms = new Set(
    profile.approvedTerms
      .map((term) => term.trim().toLocaleLowerCase())
      .filter(Boolean)
  );

  const allRemediations = [
    ...PHRASE_REMEDIATIONS,
    ...customRemediations,
  ].filter(
    (remediation) =>
      !approvedTerms.has(remediation.keyword.toLocaleLowerCase())
  );

  // Longest phrases first so "zero chance of error"
  // is matched before shorter overlapping phrases.
  const sortedRemediations = [...allRemediations].sort(
    (a, b) => b.keyword.length - a.keyword.length
  );

  const matchedRanges: Array<{ start: number; end: number }> = [];
  const replacements: Array<{
    start: number;
    end: number;
    value: string;
  }> = [];

  // Detect phrase-based violations.
  for (const rem of sortedRemediations) {
    const escapedKeyword = escapeRegExp(rem.keyword);
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');

    const matches = [...text.matchAll(regex)].filter((match) => {
      const start = match.index ?? 0;
      const end = start + match[0].length;

      return !matchedRanges.some(
        (range) => start < range.end && end > range.start
      );
    });

    if (matches.length === 0) continue;

    matches.forEach((match) => {
      const start = match.index ?? 0;

      matchedRanges.push({
        start,
        end: start + match[0].length,
      });
    });

    violations.push({
      ruleId: `rule-${rem.category}-${rem.keyword.replace(/\s+/g, '-')}`,
      matchedKeyword: rem.keyword,
      severity: rem.severity,
      recommendation:
        rem.replacement ||
        'Remove this restricted phrase or provide approved wording.',
      category: rem.category,
      explanation: rem.explanation,
    });

    for (const match of matches) {
      const start = match.index ?? 0;

      const isUpperCase =
        match[0] === match[0].toUpperCase() &&
        match[0] !== match[0].toLowerCase();
      const startsWithUpperCase =
        match[0].charAt(0) === match[0].charAt(0).toUpperCase() &&
        match[0].charAt(0) !== match[0].charAt(0).toLowerCase();

      const value = isUpperCase
        ? rem.replacement.toLocaleUpperCase()
        : startsWithUpperCase
          ? rem.replacement.charAt(0).toLocaleUpperCase() + rem.replacement.slice(1)
          : rem.replacement;

      replacements.push({
        start,
        end: start + match[0].length,
        value,
      });
    }
  }

  /**
   * Detect factual/quantitative claims that are not present
   * in the configured approved facts.
   */
  const factSensitivePatterns: RegExp[] = [
    /\b(?:world'?s|industry'?s)\s+(?:#\s?1|number\s+one|best|leading|fastest)\b/gi,
    /(?<![\w])(?:the\s+)?#\s?1(?:\s+(?:fastest|platform)){0,2}/gi,
    /\b\d+(?:\.\d+)?\s?%\s?(?:accurate|compliant|compliance|uptime|faster|reduction|increase|success|conversion)\b/gi,
  ];

  for (const pattern of factSensitivePatterns) {
    for (const match of text.matchAll(pattern)) {
      const claim = match[0].trim();

      const isApproved = profile.approvedFacts.some((fact) =>
        fact.toLocaleLowerCase().includes(claim.toLocaleLowerCase())
      );

      const alreadyFlagged = violations.some(
        (violation) =>
          violation.matchedKeyword.toLocaleLowerCase() ===
          claim.toLocaleLowerCase()
      );

      if (isApproved || alreadyFlagged) continue;

      const isRankingClaim =
        /(?:#\s?1|number\s+one|world'?s|industry'?s|best|leading|fastest)/i.test(
          claim
        );

      /**
       * IMPORTANT:
       * Use "measurable, source-backed" instead of
       * "measurable, source-backed results".
       *
       * This prevents:
       * "source-backed results results"
       */
      const safeReplacement = isRankingClaim
        ? 'a verified brand-governance solution'
        : 'measurable, source-backed';

      violations.push({
        ruleId: 'rule-claims-unverified-fact',
        matchedKeyword: claim,
        severity: 'critical',
        recommendation: safeReplacement,
        category: 'claims',
        explanation: `This claim is not present in ${
          profile.brandName || 'the brand'
        }'s approved facts. Replace it with a verified statement or remove it before approval.`,
      });
    }
  }

  /**
   * Apply normal phrase corrections.
   * Apply replacements from right to left so original
   * character positions remain valid.
   */
  for (const replacement of [...replacements].sort(
    (a, b) => b.start - a.start
  )) {
    correctedText =
      correctedText.slice(0, replacement.start) +
      replacement.value +
      correctedText.slice(replacement.end);
  }

  /**
   * Apply conservative corrections for unsupported factual claims.
   */
  for (const violation of violations.filter(
    (item) => item.ruleId === 'rule-claims-unverified-fact'
  )) {
    const escaped = escapeRegExp(violation.matchedKeyword);

    correctedText = correctedText.replace(
      new RegExp(`\\b${escaped}\\b`, 'gi'),
      violation.recommendation
    );
  }

  /**
   * Clean up formatting after replacements.
   */
  correctedText = correctedText
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/([([{])\s+/g, '$1')
    .replace(/\s+([)\]}])/g, '$1')
    .trim();

  /**
   * Calculate score:
   * critical = -25
   * warning  = -15
   * advisory = -5
   */
  let penalty = 0;

  for (const violation of violations) {
    if (violation.severity === 'critical') {
      penalty += 25;
    } else if (violation.severity === 'warning') {
      penalty += 15;
    } else {
      penalty += 5;
    }
  }

  const score = Math.max(0, 100 - penalty);

  const status =
    score >= 90 ? 'passed' : score >= 65 ? 'warning' : 'failed';

  return {
    score,
    status,
    violations,
    suggestedCopy: correctedText,
  };
}
