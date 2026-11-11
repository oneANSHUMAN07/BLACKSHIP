import React, { useState } from 'react';
import { auditBrandCopy, loadBrandProfile, saveBrandProfile, type AuditResult, type BrandProfile, type CustomBrandRule } from '../utils/governance';
import {
  applyDecisionMemory,
  findRelevantDecision,
  textSimilarity,
  type ReviewDecision,
  type WorkspaceAuditRecord,
} from '../utils/workspace';
import { ShieldCheck, CheckCircle, ArrowRight, Plus, Trash2, Download } from 'lucide-react';

const PRESET_SNIPPETS = [
  {
    label: 'Hyperbolic Pitch Copy',
    text: 'Our insane AI engine is crazy fast and super easy to disrupt legacy enterprise workflows.',
  },
  {
    label: 'Risky Regulatory Guarantee',
    text: 'We guarantee 100% foolproof compliance with zero chance of error better than competitors.',
  },
  {
    label: 'Casual Social Post',
    text: 'Gonna launch cool stuff today that will supercharge your daily operations.',
  },
  {
    label: 'Compliant Luxury Editorial',
    text: 'Blackship delivers precision-engineered autonomous brand assurance for global institutions.',
  },
];

interface ApprovalRecord {
  id: string;
  brandName: string;
  copy: string;
  score: number;
  violationCount: number;
  decision: 'approved' | 'changes_requested' | 'rejected';
  reviewerNote: string;
  policySnapshot?: string;
  approvedAt: string;
}

const APPROVAL_HISTORY_KEY = 'blackship.approval-history.v1';

type AdaptionFinding = {
  category?: string;
  severity?: string;
  issue?: string;
  explanation?: string;
  recommendation?: string;
  matchedKeyword?: string;
  ruleId?: string;
};

type AdaptionAuditPayload = {
  passed?: boolean;
  score?: number;
  status?: string;
  findings?: AdaptionFinding[];
  violations?: AdaptionFinding[];
  summary?: string;
  suggestedCopy?: string;
  suggested_copy?: string;
  corrected_copy?: string;
};

function parseAdaptionResult(value: unknown): AdaptionAuditPayload {
  let parsed: unknown = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (error) {
      console.error('BLACKSHIP could not parse Adaption ai_result JSON:', error, value);
      throw new Error('Adaption returned invalid JSON');
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.error('BLACKSHIP received an invalid Adaption ai_result:', parsed);
    throw new Error('Adaption returned an empty result');
  }

  return parsed as AdaptionAuditPayload;
}

function mapAdaptionResult(payload: AdaptionAuditPayload, draft: string): AuditResult {
  const findings = payload.findings ?? payload.violations;
  if (!Array.isArray(findings)) {
    console.error('BLACKSHIP Adaption result has no findings or violations array:', payload);
    throw new Error('Adaption returned an unsupported audit result');
  }

  const violations = findings.map((finding, index) => {
    const rawSeverity = finding.severity?.toLowerCase();
    const severity: AuditResult['violations'][number]['severity'] =
      rawSeverity === 'high' || rawSeverity === 'critical'
        ? 'critical'
        : rawSeverity === 'medium' || rawSeverity === 'warning'
          ? 'warning'
          : 'advisory';

    return {
      ruleId: finding.ruleId || `adaption-${index + 1}`,
      matchedKeyword: finding.matchedKeyword || finding.category || 'AI detected issue',
      severity,
      recommendation: finding.recommendation || 'Review and revise this content.',
      category: finding.category || 'Brand Governance',
      explanation: finding.issue || finding.explanation || 'Adaption identified a governance concern.',
    };
  });

  const passed = typeof payload.passed === 'boolean'
    ? payload.passed
    : payload.status?.toLowerCase() === 'passed' || (typeof payload.score === 'number' && payload.score >= 90);
  const penalty = violations.reduce((total, violation) => total + (
    violation.severity === 'critical' ? 25 : violation.severity === 'warning' ? 15 : 5
  ), 0);
  const suppliedCopy = payload.suggestedCopy || payload.suggested_copy || payload.corrected_copy;
  const suggestedCopy = suppliedCopy || (violations.length
    ? violations.map((violation) => violation.recommendation).join('\n')
    : draft);

  return {
    score: typeof payload.score === 'number'
      ? Math.max(0, Math.min(100, payload.score))
      : passed ? 100 : Math.max(0, 100 - penalty),
    status: passed ? 'passed' : violations.some((violation) => violation.severity === 'critical') ? 'failed' : 'warning',
    violations,
    suggestedCopy,
  };
}

interface LiveAuditorProps {
  auditHistory?: WorkspaceAuditRecord[];
  workspaceMode?: boolean;
  showExportReport?: boolean;
  initialDraft?: string;
  initialAuditId?: string;
  initialAuditRecord?: WorkspaceAuditRecord;
  initialProfile?: BrandProfile;
  onProfileSave?: (profile: BrandProfile) => Promise<void>;
  onAuditComplete?: (draft: string, profile: BrandProfile, result: AuditResult) => string | undefined;
  onDecision?: (auditId: string | null, decision: ReviewDecision, note: string) => void;
  onCorrectionUpdate?: (auditId: string | null, correction: string, result: AuditResult, status: 'applied' | 'edited' | 'ignored') => void;
}

function loadApprovalHistory(): ApprovalRecord[] {
  try {
    const saved = window.localStorage.getItem(APPROVAL_HISTORY_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 10) as ApprovalRecord[] : [];
  } catch {
    return [];
  }
}

export const LiveAuditor: React.FC<LiveAuditorProps> = ({ workspaceMode = false, showExportReport = false, initialDraft, initialAuditId, initialAuditRecord, initialProfile, auditHistory = [], onProfileSave, onAuditComplete, onDecision, onCorrectionUpdate }) => {
  const [inputText, setInputText] = useState(initialDraft ?? '');
  const [brandProfile, setBrandProfile] = useState<BrandProfile>(() => initialProfile ?? loadBrandProfile());
  const [saveMessage, setSaveMessage] = useState('');
  const [approvalHistory, setApprovalHistory] = useState<ApprovalRecord[]>(() => workspaceMode ? [] : loadApprovalHistory());
  const [currentApprovalId, setCurrentApprovalId] = useState<string | null>(null);
  const [decisionRecord, setDecisionRecord] = useState<ApprovalRecord | null>(null);
  const [reviewerNote, setReviewerNote] = useState('');
  const [correctionDraft, setCorrectionDraft] = useState(initialAuditRecord?.suggestedCopy ?? '');
  const [correctionIgnored, setCorrectionIgnored] = useState(false);
  const [hasRunAudit, setHasRunAudit] = useState(Boolean(initialAuditId && initialAuditRecord));
  const [activeAuditId, setActiveAuditId] = useState<string | null>(initialAuditId ?? null);
  const [loadedAuditRecord, setLoadedAuditRecord] = useState<WorkspaceAuditRecord | null>(initialAuditRecord ?? null);
  const [aiAuditResult, setAiAuditResult] = useState<AuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isDeciding, setIsDeciding] = useState(false);
  const [isApplyingCorrection, setIsApplyingCorrection] = useState(false);
  const [auditError, setAuditError] = useState('');

  const localAuditResult = auditBrandCopy(inputText, brandProfile);
  const priorDecision = workspaceMode
    ? findRelevantDecision(inputText, auditHistory)
    : undefined;

  const baseAuditResult =
    activeAuditId && loadedAuditRecord
      ? {
          score: loadedAuditRecord.score,
          status: loadedAuditRecord.status,
          violations: loadedAuditRecord.violations,
          suggestedCopy: loadedAuditRecord.suggestedCopy,
        }
      : aiAuditResult ?? localAuditResult;

  const auditResult =
    activeAuditId && loadedAuditRecord
      ? baseAuditResult
      : applyDecisionMemory(baseAuditResult, priorDecision);

  const policySnapshot = JSON.stringify(brandProfile);
  const serverApproval = loadedAuditRecord?.decision ? {
    id: loadedAuditRecord.id,
    brandName: loadedAuditRecord.brandName,
    copy: loadedAuditRecord.draft,
    score: loadedAuditRecord.score,
    violationCount: loadedAuditRecord.violations.length,
    decision: loadedAuditRecord.decision,
    reviewerNote: loadedAuditRecord.reviewerNote ?? '',
    approvedAt: loadedAuditRecord.decidedAt ?? loadedAuditRecord.auditedAt,
  } as ApprovalRecord : null;

  const currentApproval = workspaceMode
    ? decisionRecord?.copy === inputText ? decisionRecord : serverApproval?.copy === inputText ? serverApproval : undefined
    : approvalHistory.find((record) => record.id === currentApprovalId && record.copy === inputText && record.brandName === brandProfile.brandName && record.policySnapshot === policySnapshot);

  const handleDraftChange = (nextText: string) => {
    setInputText(nextText);
    setCorrectionDraft('');
    setCorrectionIgnored(false);
    setCurrentApprovalId(null);
    setDecisionRecord(null);
    setReviewerNote('');
    setHasRunAudit(false);
    setActiveAuditId(null);
    setLoadedAuditRecord(null);
    setAiAuditResult(null);
    setAuditError('');
  };

  const handleRunAudit = async () => {
    if (!inputText.trim() || isAuditing) return;

    setIsAuditing(true);
    setAuditError('');
    setCorrectionIgnored(false);
    setCurrentApprovalId(null);
    setDecisionRecord(null);
    const controller = new AbortController();
    const requestTimeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/audit', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: inputText,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Adaption audit failed');
      }

      const parsedAI = parseAdaptionResult(data.ai_result);
      const aiResult = mapAdaptionResult(parsedAI, inputText);

      setAiAuditResult(aiResult);
      setLoadedAuditRecord(null);
      setCorrectionDraft(aiResult.suggestedCopy);
      setHasRunAudit(true);

      try {
        const auditId =
          onAuditComplete?.(
            inputText,
            brandProfile,
            aiResult
          ) ?? null;

        setActiveAuditId(auditId);
      } catch (callbackError) {
        console.error(
          'BLACKSHIP audit history callback error:',
          callbackError
        );

        setActiveAuditId(null);
      }
    } catch (error) {
      console.warn(
        'BLACKSHIP Adaption audit note (using local governance rule engine):',
        error
      );

      setAuditError(
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Adaption took too long to respond. The local rule audit was used instead.'
          : error instanceof Error
            ? error.message
            : 'Unable to connect to BLACKSHIP AI audit server.'
      );

      // ONLY fallback if the actual AI request failed.
      setAiAuditResult(null);
      setLoadedAuditRecord(null);
      const localResultWithMemory = applyDecisionMemory(localAuditResult, priorDecision);
      setCorrectionDraft(localResultWithMemory.suggestedCopy);
      setHasRunAudit(true);

      try {
        const auditId =
          onAuditComplete?.(
            inputText,
            brandProfile,
            localResultWithMemory
          ) ?? null;

        setActiveAuditId(auditId);
      } catch (callbackError) {
        console.error(
          'BLACKSHIP local audit history callback error:',
          callbackError
        );

        setActiveAuditId(null);
      }
    } finally {
      window.clearTimeout(requestTimeout);
      setIsAuditing(false);
    }
  };

  const handleApplyCorrection = (value: string, status: 'applied' | 'edited') => {
    const correctedCopy = value.trim();
    if (!correctedCopy || isApplyingCorrection) return;
    setIsApplyingCorrection(true);
    try {
      const correctedResult = auditBrandCopy(correctedCopy, brandProfile);
      setInputText(correctedCopy);
      setCorrectionDraft(correctedResult.suggestedCopy);
      setCorrectionIgnored(false);
      setCurrentApprovalId(null);
      setDecisionRecord(null);
      setReviewerNote('');
      setHasRunAudit(true);
      setLoadedAuditRecord(null);
      setAiAuditResult(correctedResult);
      onCorrectionUpdate?.(activeAuditId, correctedCopy, correctedResult, status);
    } finally {
      setIsApplyingCorrection(false);
    }
  };

  const handleHumanDecision = (decision: ApprovalRecord['decision']) => {
    if (!inputText.trim() || !hasRunAudit || isDeciding) return;
    if (decision !== 'approved' && !reviewerNote.trim()) return;
    setIsDeciding(true);
    const record: ApprovalRecord = {
      id: `${Date.now()}`,
      brandName: brandProfile.brandName || 'Untitled brand',
      copy: inputText,
      score: auditResult.score,
      violationCount: auditResult.violations.length,
      decision,
      reviewerNote: reviewerNote.trim(),
      policySnapshot,
      approvedAt: new Date().toISOString(),
    };
    try {
      if (workspaceMode) {
        setDecisionRecord(record);
      } else {
        const nextHistory = [record, ...approvalHistory].slice(0, 10);
        window.localStorage.setItem(APPROVAL_HISTORY_KEY, JSON.stringify(nextHistory));
        setApprovalHistory(nextHistory);
        setCurrentApprovalId(record.id);
      }
      onDecision?.(activeAuditId, decision, reviewerNote.trim());
      setReviewerNote('');
    } catch {
      setCurrentApprovalId(null);
    } finally {
      setIsDeciding(false);
    }
  };

  const handleExportReport = () => {
    if (!inputText.trim()) return;
    const report = {
      reportType: 'BLACKSHIP content governance review',
      generatedAt: new Date().toISOString(),
      engine: 'Local deterministic rule-based audit',
      brand: brandProfile,
      draft: inputText,
      audit: {
        verdict: auditResult.status,
        score: auditResult.score,
        violationCount: auditResult.violations.length,
        policyHits: auditResult.violations,
        suggestedCopy: auditResult.suggestedCopy,
      },
      humanDecision: currentApproval
        ? {
            status: currentApproval.decision,
            reviewerNote: currentApproval.reviewerNote,
            decidedAt: currentApproval.approvedAt,
          }
        : { status: 'pending' },
    };
    const file = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `BLACKSHIP-review-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };
const updateCustomRule = <K extends keyof CustomBrandRule,>(index: number, field: K, value: CustomBrandRule[K]) => {
    setBrandProfile((current) => ({
      ...current,
      customRules: current.customRules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [field]: value } : rule
      ),
    }));
    setSaveMessage('Unsaved changes');
  };

  const handleSaveBrand = async () => {
    if (brandProfile.customRules.some((rule) => !rule.phrase.trim())) {
      setSaveMessage('Add a restricted phrase or remove the empty rule before saving.');
      return;
    }
    try {
      if (workspaceMode && onProfileSave) await onProfileSave(brandProfile);
      else if (!saveBrandProfile(brandProfile)) throw new Error('Could not save. Check browser storage settings.');
      setSaveMessage(workspaceMode ? 'Brand setup saved to your workspace.' : 'Brand setup saved on this device.');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Could not save Brand Setup.');
    }
  };

  return (
    <section id="solutions" className="relative py-24 sm:py-32 bg-[#060608] border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="mb-12 pb-8 border-b border-white/[0.08] flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-400 font-medium mb-3">
              <span>{workspaceMode ? 'Policy-Backed Content Review' : 'Rule-Based Governance Demonstration Engine'}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>{workspaceMode ? 'Human Decision Required' : 'Interactive Evaluation Demo'}</span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-black uppercase text-white tracking-tight leading-[0.95]">
              {workspaceMode ? 'AUDIT CONTENT.' : 'TEST BRAND GOVERNANCE.'}
              <br />
              <span className="text-zinc-400">{workspaceMode ? 'WITH BRAND DNA.' : 'IN REAL TIME.'}</span>
            </h2>
          </div>
          <p className="text-sm text-zinc-400 max-w-md">
            {workspaceMode ? 'Check a content draft against the saved Brand DNA. Review every policy hit, apply supported corrections, and record a human decision.' : 'Interactive rule-based demonstration. Test sample marketing drafts to observe real-time policy evaluation, keyword detection, and simulated on-brand remediation.'}
          </p>
        </div>

        <details id="brand-setup" className="mb-8 rounded-xl border border-white/15 bg-[#0a0a0d] p-5 sm:p-6">
          <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-widest text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded">
            Brand Setup <span className="ml-2 text-xs font-normal normal-case tracking-normal text-zinc-400">Configure the policy used by this auditor</span>
          </summary>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="block text-xs uppercase tracking-wider text-zinc-400">
              Brand name
              <input value={brandProfile.brandName} onChange={(event) => { setBrandProfile({ ...brandProfile, brandName: event.target.value }); setSaveMessage('Unsaved changes'); }} className="mt-2 w-full rounded-lg border border-white/15 bg-black/50 p-3 text-sm normal-case tracking-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" />
            </label>
            <label className="block text-xs uppercase tracking-wider text-zinc-400">
              Voice description
              <input value={brandProfile.voiceDescription} onChange={(event) => { setBrandProfile({ ...brandProfile, voiceDescription: event.target.value }); setSaveMessage('Unsaved changes'); }} className="mt-2 w-full rounded-lg border border-white/15 bg-black/50 p-3 text-sm normal-case tracking-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" />
            </label>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 md:col-span-2">
              Approved terms <span className="normal-case tracking-normal">(comma-separated)</span>
              <input value={brandProfile.approvedTerms.join(', ')} onChange={(event) => { setBrandProfile({ ...brandProfile, approvedTerms: event.target.value.split(',').map((term) => term.trim()).filter(Boolean) }); setSaveMessage('Unsaved changes'); }} className="mt-2 w-full rounded-lg border border-white/15 bg-black/50 p-3 text-sm normal-case tracking-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" />
            </label>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xs uppercase tracking-wider text-zinc-300">Custom restricted phrases</h3>
              <button type="button" onClick={() => { setBrandProfile((current) => ({ ...current, customRules: [...current.customRules, { id: `custom-${Date.now()}`, phrase: '', replacement: '', severity: 'warning' }] })); setSaveMessage('Unsaved changes'); }} className="inline-flex min-h-11 items-center gap-2 rounded border border-white/20 px-3 text-xs uppercase tracking-wider text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <Plus className="h-4 w-4" /> Add phrase
              </button>
            </div>
            {brandProfile.customRules.length === 0 && <p className="text-sm text-zinc-500">No custom restrictions yet. Default BLACKSHIP rules remain active.</p>}
            <div className="space-y-3">
              {brandProfile.customRules.map((rule, index) => (
                <div key={rule.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_150px_44px] gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Restricted phrase<input aria-label={`Restricted phrase ${index + 1}`} value={rule.phrase} onChange={(event) => updateCustomRule(index, 'phrase', event.target.value)} placeholder="e.g. guaranteed results" className="mt-1 w-full rounded border border-white/15 bg-black/50 p-2.5 text-sm normal-case tracking-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" /></label>
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Suggested replacement<input aria-label={`Suggested replacement ${index + 1}`} value={rule.replacement} onChange={(event) => updateCustomRule(index, 'replacement', event.target.value)} placeholder="Optional" className="mt-1 w-full rounded border border-white/15 bg-black/50 p-2.5 text-sm normal-case tracking-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" /></label>
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Severity<select aria-label={`Severity ${index + 1}`} value={rule.severity} onChange={(event) => updateCustomRule(index, 'severity', event.target.value as CustomBrandRule['severity'])} className="mt-1 w-full rounded border border-white/15 bg-[#101014] p-2.5 text-sm normal-case tracking-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><option value="critical">Critical</option><option value="warning">Warning</option><option value="advisory">Advisory</option></select></label>
                  <button type="button" aria-label={`Remove restricted phrase ${index + 1}`} onClick={() => { setBrandProfile((current) => ({ ...current, customRules: current.customRules.filter((_, ruleIndex) => ruleIndex !== index) })); setSaveMessage('Unsaved changes'); }} className="mt-4 inline-flex h-11 w-11 items-center justify-center rounded border border-white/15 text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button type="button" onClick={handleSaveBrand} className="min-h-11 rounded bg-white px-5 text-xs font-bold uppercase tracking-widest text-black hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Save Brand Setup</button>
            <p role="status" aria-live="polite" className="text-xs text-zinc-400">{saveMessage || 'Changes affect the audit immediately; save to keep them after refresh.'}</p>
          </div>
        </details>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2.5 mb-8">
          <span className="text-xs uppercase font-mono tracking-wider text-zinc-400 mr-2">
            Sample Ingests:
          </span>
          {PRESET_SNIPPETS.map((snippet) => (
            <button
              key={snippet.label}
              type="button"
              onClick={() => handleDraftChange(snippet.text)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded border transition-all duration-200 cursor-pointer ${
                inputText === snippet.text
                  ? 'bg-white text-black border-white font-bold'
                  : 'bg-zinc-900/60 text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              {snippet.label}
            </button>
          ))}
        </div>

                {/* Sandbox Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input Copy Area */}
          <div className="lg:col-span-7 rounded-xl border border-white/15 bg-[#0a0a0d] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-300">
                Draft Marketing Asset / Copy Stream
              </span>
              <button
                type="button"
                onClick={() => handleDraftChange('')}
                className="text-xs font-mono uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => handleDraftChange(e.target.value)}
              rows={4}
                        placeholder={PRESET_SNIPPETS[0].text}
              className="w-full bg-black/60 border border-white/10 rounded-lg p-4 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/40 font-sans text-sm sm:text-base leading-relaxed transition-colors resize-none"
            />

            {workspaceMode && <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={handleRunAudit} disabled={!inputText.trim() || isAuditing} className="inline-flex min-h-11 items-center gap-2 rounded bg-white px-5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><ShieldCheck className="h-4 w-4" />
{isAuditing ? 'Analyzing with Adaption...' : 'Run Brand Audit'}</button>

{auditError && (
  <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
    AI audit unavailable: {auditError}
    <span className="ml-2 text-zinc-500">
      Local rule engine remains active.
    </span>
  </div>
)}
<span className="text-xs text-zinc-500">{hasRunAudit ? 'This draft is recorded in the audit history.' : 'Run the audit to record this draft and enable reviewer decisions.'}</span></div>}
{hasRunAudit && priorDecision && (
  <div className="mb-4 rounded-lg border border-sky-300/20 bg-sky-300/[0.04] p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-300">
        Similar prior review · {priorDecision.decision?.replace('_', ' ')}
      </p>
      <span className="font-mono text-[10px] text-zinc-400">
        {Math.round(textSimilarity(inputText, priorDecision.draft) * 100)}% text similarity
      </span>
    </div>
    <p className="mt-2 text-xs text-zinc-300">
      {priorDecision.reviewerNote ||
        'A reviewer decision was recorded for similar content.'}
    </p>
    <p className="mt-2 text-[10px] text-zinc-500">
      Previous human decision is surfaced as context; it does not automatically decide this new audit.
    </p>
  </div>
)}
            {/* Smart Corrections */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Smart Corrections</span>
                </span>
                {hasRunAudit && auditResult.violations.length > 0 && (
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    {correctionIgnored ? 'Correction ignored' : 'Review before applying'}
                  </span>
                )}
              </div>
              {!hasRunAudit ? (
                <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-zinc-400">
                  {!inputText.trim()
                    ? 'Add content above to see suggested corrections.'
                    : 'Run the brand audit to generate correction suggestions.'}
                </div>
              ) : auditResult.violations.length === 0 ? (
                <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-zinc-300">
                  No correction is needed. The draft currently satisfies the configured rules.
                </div>
              ) : (
                <>
                  <textarea
                    value={correctionDraft}
                    onChange={(event) => setCorrectionDraft(event.target.value)}
                    rows={4}
                    disabled={correctionIgnored}
                    aria-label="Suggested corrected copy"
                    className="w-full resize-y rounded-lg bg-white/[0.03] border border-white/10 p-3.5 text-sm font-sans text-zinc-200 focus:outline-none focus:border-white/30 disabled:opacity-50"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={correctionIgnored || !inputText.trim() || isApplyingCorrection}
                      onClick={() => handleApplyCorrection(correctionDraft, 'applied')}
                      className="min-h-10 rounded bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200 disabled:opacity-40 cursor-pointer"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      disabled={correctionIgnored || !correctionDraft.trim() || isApplyingCorrection}
                      onClick={() => handleApplyCorrection(correctionDraft.trim(), 'edited')}
                      className="min-h-10 rounded border border-white/20 px-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer"
                    >
                      Edit & Apply
                    </button>
                    <button
                      type="button"
                      disabled={correctionIgnored}
                      onClick={() => {
                        setCorrectionIgnored(true);
                        onCorrectionUpdate?.(activeAuditId, correctionDraft || auditResult.suggestedCopy, auditResult, 'ignored');
                      }}
                      className="min-h-10 rounded border border-white/10 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Ignore
                    </button>
                  </div>
                  {auditResult.violations.map((violation, idx) => (
                    <div key={idx} className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{violation.category} · {violation.severity}</span>
                        <span className="text-[10px] font-mono text-zinc-500">Matched: "{violation.matchedKeyword}"</span>
                      </div>
                      <p className="mt-2 text-[11px] text-zinc-300">Suggested replacement: <span className="text-white font-medium">"{violation.recommendation}"</span></p>
                      <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{violation.explanation}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
                    {/* Right Column: Real-Time Governance Verdict */}
          <div className="lg:col-span-5 rounded-xl border border-white/15 bg-[#0a0a0d] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-300">
                Diagnostic Verdict (Rule Engine)
              </span>
              <span
                className={`text-xs font-mono uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border ${
                  !hasRunAudit
                    ? 'border-white/10 text-zinc-500 bg-transparent'
                    : auditResult.status === 'passed'
                    ? 'border-white/30 text-white bg-white/10'
                    : auditResult.status === 'warning'
                    ? 'border-zinc-400/30 text-zinc-300 bg-white/5'
                    : 'border-zinc-500/40 text-zinc-300 bg-zinc-900'
                }`}
              >
                {!hasRunAudit ? 'READY' : auditResult.status.toUpperCase()}
              </span>
            </div>

            {/* Score Ring / Bar */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-black/60 border border-white/10 mb-6">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block mb-0.5">
                  Rule Engine Score
                </span>
                <span className="text-3xl font-editorial font-bold text-white tracking-tight">
                  {!hasRunAudit ? '—' : `${auditResult.score} / 100`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block mb-0.5">
                  Violations Detected
                </span>
                <span className="text-xl font-mono font-bold text-white">
                  {!hasRunAudit ? '—' : auditResult.violations.length}
                </span>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="block text-[10px] uppercase font-mono tracking-widest text-zinc-400">Human decision</span>
                  <span className="mt-1 block text-sm font-semibold text-white">
                    {!hasRunAudit
                      ? 'Awaiting audit run'
                      : currentApproval
                      ? currentApproval.decision.replace('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
                      : 'Awaiting reviewer decision'}
                  </span>
                </div>
              </div>
              <label className="mt-4 block text-[10px] uppercase font-mono tracking-widest text-zinc-400">
                Reviewer note <span className="normal-case tracking-normal text-zinc-500">(required for changes or rejection)</span>
                <textarea
                  value={reviewerNote}
                  onChange={(event) => setReviewerNote(event.target.value)}
                  rows={2}
                  disabled={!hasRunAudit}
                  placeholder={hasRunAudit ? "Explain what should change or why this is rejected..." : "Run brand audit first to enable reviewer note..."}
                  className="mt-2 w-full resize-y rounded border border-white/10 bg-black/50 p-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40"
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleHumanDecision('approved')}
                  disabled={!inputText.trim() || !hasRunAudit || isDeciding}
                  className="min-h-11 rounded bg-white px-4 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {hasRunAudit && auditResult.violations.length > 0 ? 'Approve with flags' : 'Approve content'}
                </button>
                <button
                  type="button"
                  onClick={() => handleHumanDecision('changes_requested')}
                  disabled={!inputText.trim() || !reviewerNote.trim() || !hasRunAudit || isDeciding}
                  className="min-h-11 rounded border border-white/20 px-4 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Request changes
                </button>
                <button
                  type="button"
                  onClick={() => handleHumanDecision('rejected')}
                  disabled={!inputText.trim() || !reviewerNote.trim() || !hasRunAudit || isDeciding}
                  className="min-h-11 rounded border border-white/20 px-4 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Reject
                </button>
              </div>
              {showExportReport && (
                <button
                  type="button"
                  onClick={handleExportReport}
                  disabled={!inputText.trim() || !hasRunAudit}
                  className="mt-3 inline-flex min-h-10 items-center gap-2 rounded border border-white/15 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-300 transition-colors hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Download className="h-4 w-4" /> Download audit report
                </button>
              )}
              {hasRunAudit && currentApproval && (
                <p role="status" className="mt-3 text-xs text-zinc-400">
                  {workspaceMode ? 'Decision saved to this audit' : 'Decision saved on this device'} · {new Date(currentApproval.approvedAt).toLocaleString()}{currentApproval.reviewerNote ? ` · ${currentApproval.reviewerNote}` : ''}
                </p>
              )}
              {hasRunAudit && !currentApproval && (
                <p className="mt-3 text-xs text-zinc-500">Review decisions are saved with the audit record.</p>
              )}
              {!hasRunAudit && (
                <p className="mt-3 text-xs text-zinc-500">Run the brand audit above to enable reviewer decisions.</p>
              )}
            </div>

            <div id="review-history" className="mb-6">
              {approvalHistory.length > 0 ? (
                <>
                <span className="mb-2 block text-[10px] uppercase font-mono tracking-widest text-zinc-400">Recent review decisions</span>
                <div className="space-y-2">
                  {approvalHistory.slice(0, 3).map((record) => (
                    <div key={record.id} className="flex items-center justify-between gap-3 rounded border border-white/[0.08] bg-black/30 px-3 py-2 text-xs">
                      <span className="truncate text-zinc-300">{record.brandName} · {record.copy}</span>
                      <span className="shrink-0 font-mono text-zinc-500">{record.decision?.replace('_', ' ') || 'approved'} · {record.score}/100 · {record.violationCount} flags</span>
                    </div>
                  ))}
                </div>
                </>
              ) : (
                <div className="rounded border border-white/[0.08] bg-black/30 px-3 py-3 text-xs text-zinc-500">No review decisions yet. Approve, request changes, or reject a draft to start the local history.</div>
              )}
            </div>
             {/* Violation List */}
            <div className="space-y-3">
              <span className="text-xs uppercase font-mono tracking-wider text-zinc-400 block mb-2">
                Active Policy Hits:
              </span>

              {!hasRunAudit ? (
                <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02] text-xs text-zinc-400">
                  {!inputText.trim()
                    ? 'Add content above to check it against your Brand DNA.'
                    : 'Run the brand audit to see the diagnostic result.'}
                </div>
              ) : auditResult.violations.length === 0 ? (
                <div className="p-4 rounded-lg border border-white/15 bg-white/[0.03] text-xs text-zinc-300 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-white shrink-0" />
                  <span>
                    Zero infractions detected. Asset satisfies all brand voice, terminology, and legal guardrails.
                  </span>
                </div>
              ) : (
                auditResult.violations.map((violation, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-white/10 bg-white/[0.02] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                        {violation.category} · {violation.severity}
                      </span>
                      <span className="text-zinc-400 font-mono text-[10px]">
                        Matched: &quot;{violation.matchedKeyword}&quot;
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500">Policy reference: {violation.ruleId}</p>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      Recommended: <span className="text-white font-medium">&quot;{violation.recommendation}&quot;</span>
                    </p>
                    <p className="text-zinc-500 text-[10px] leading-relaxed">
                      {violation.explanation}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
