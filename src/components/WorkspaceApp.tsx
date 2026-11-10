import React, { useEffect, useMemo, useState } from 'react';
import { signOut, type User } from 'firebase/auth';
import { Activity, ArrowDownToLine, ArrowLeft, Bell, CheckCheck, Clock3, FileSearch, LayoutDashboard, Mail, Settings2, ShieldCheck, SlidersHorizontal, UserRound } from 'lucide-react';
import { BrandDnaPanel } from './BrandDnaPanel';
import { LiveAuditor } from './LiveAuditor';
import { auditBrandCopy, DEFAULT_BRAND_PROFILE, loadBrandProfile, saveBrandProfile, type AuditResult, type BrandProfile } from '../utils/governance';
import {
  applyDecisionMemory,
  createWorkspaceAudit,
  findRelevantDecision,
  getHistoricalViolations,
  loadWorkspaceAudits,
  saveWorkspaceAudits,
  textSimilarity,
  type ReviewDecision,
  type WorkspaceAuditRecord,
} from '../utils/workspace';
import { saveAuditToCloud, saveBrandToCloud, subscribeToCloudWorkspace } from '../utils/cloudWorkspace';
import { auth } from '../utils/firebase';

type WorkspacePage = 'overview' | 'brand-dna' | 'auditor' | 'review-queue' | 'brand-memory' | 'reports' | 'audit-history' | 'account' | 'notifications' | 'settings';

const NAV_ITEMS: { id: WorkspacePage; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'brand-dna', label: 'Brand DNA', icon: SlidersHorizontal },
  { id: 'auditor', label: 'Content Auditor', icon: FileSearch },
  { id: 'review-queue', label: 'Review Queue', icon: Clock3 },
  { id: 'brand-memory', label: 'Brand Memory', icon: ShieldCheck },
  { id: 'reports', label: 'Reports', icon: Activity },

      { id: 'audit-history', label: 'Audit History', icon: Clock3 },
  { id: 'account', label: 'My Account', icon: UserRound },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

const number = (value: number) => new Intl.NumberFormat().format(value);
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};

type WorkspaceIdentity = Pick<User, 'uid' | 'email' | 'displayName'>
  & Partial<Pick<User, 'photoURL' | 'providerData' | 'metadata'>>;

type WorkspaceNotification = {
  id: string;
  audit: WorkspaceAuditRecord;
  at: string;
  title: string;
  detail: string;
};

export const WorkspaceApp: React.FC<{ user: WorkspaceIdentity; demo?: boolean }> = ({ user, demo = false }) => {
  const [page, setPage] = useState<WorkspacePage>('overview');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connecting' | 'synced' | 'error'>(demo ? 'synced' : 'connecting');
  const [brand, setBrand] = useState<BrandProfile>(() => loadBrandProfile(user.uid) ?? DEFAULT_BRAND_PROFILE);
  const [audits, setAudits] = useState<WorkspaceAuditRecord[]>(() => {
    const profile = loadBrandProfile(user.uid) ?? DEFAULT_BRAND_PROFILE;
    const stored = loadWorkspaceAudits(user.uid);
    let migrated = false;
    const normalized = stored.map((audit) => {
      const correctedCopy = audit.appliedCorrection?.trim();
      if (!correctedCopy || audit.correctionStatus === 'ignored' || correctedCopy === audit.draft.trim()) return audit;

      const result = auditBrandCopy(correctedCopy, profile);
      migrated = true;
      return {
        ...audit,
        title: correctedCopy.replace(/\s+/g, ' ').slice(0, 54) || 'Untitled draft',
        originalDraft: audit.originalDraft ?? audit.draft,
        originalScore: audit.originalScore ?? audit.score,
        originalStatus: audit.originalStatus ?? audit.status,
        originalViolations: audit.originalViolations ?? audit.violations,
        originalSuggestedCopy: audit.originalSuggestedCopy ?? audit.suggestedCopy,
        draft: correctedCopy,
        score: result.score,
        status: result.status,
        violations: result.violations,
        suggestedCopy: result.suggestedCopy,
      };
    });
    if (migrated) saveWorkspaceAudits(normalized, user.uid);
    return normalized;
  });
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const notificationReadKey = `blackship.notifications.read.v1.${user.uid}`;
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem(notificationReadKey);
      return saved ? JSON.parse(saved) as string[] : [];
    } catch {
      return [];
    }
  });
  const [notificationBaselineReady, setNotificationBaselineReady] = useState(() => {
    try {
      return Boolean(window.localStorage.getItem(notificationReadKey)) || demo;
    } catch {
      return demo;
    }
  });

  useEffect(() => {
    if (demo) {
      setCloudSyncStatus('synced');
      return undefined;
    }

    setCloudSyncStatus('connecting');
    return subscribeToCloudWorkspace(user.uid, brand, audits, (cloudBrand, cloudAudits) => {
      setBrand(cloudBrand);
      setAudits(cloudAudits);
      saveBrandProfile(cloudBrand, user.uid);
      saveWorkspaceAudits(cloudAudits, user.uid);
      setCloudSyncStatus('synced');
    }, () => {
      setCloudSyncStatus('error');
    });
  }, [user.uid, demo]);

  const reportCloudSaveError = () => {
    setCloudSyncStatus('error');
    setToast('Saved on this device, but cloud sync failed. Check Firestore setup and rules.');
  };

  const saveAuditEverywhere = (audit: WorkspaceAuditRecord) => {
    if (demo) return;
    void saveAuditToCloud(user.uid, audit).then(() => setCloudSyncStatus('synced')).catch(reportCloudSaveError);
  };

  const saveBrandEverywhere = (profile: BrandProfile) => {
    if (demo) return;
    void saveBrandToCloud(user.uid, profile).then(() => setCloudSyncStatus('synced')).catch(reportCloudSaveError);
  };

  const selectedAudit = audits.find((audit) => audit.id === selectedAuditId);
  const issueTotal = audits.reduce(
    (sum, audit) => sum + getHistoricalViolations(audit).length,
    0
  );
  
  const approvedTotal = audits.filter((audit) => audit.decision === 'approved').length;
  const pendingAudits = audits.filter((audit) => !audit.decision);
  const decidedAudits = audits.filter((audit) => Boolean(audit.decision));
  const averageScore = audits.length ? Math.round(audits.reduce((sum, audit) => sum + audit.score, 0) / audits.length) : null;
  const categoryCounts = useMemo(
  () =>
    audits
      .flatMap(getHistoricalViolations)
      .reduce<Record<string, number>>((counts, violation) => {
        counts[violation.category] =
          (counts[violation.category] ?? 0) + 1;
        return counts;
      }, {}),
  [audits]
  );
  const recentActivity = audits.slice(0, 5);
  const decisionCounts = useMemo(() => audits.reduce<Record<string, number>>((counts, audit) => {
    const key = audit.decision ?? 'pending';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {}), [audits]);
  const topViolationTypes = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const greetingName = user.displayName?.trim().split(/\s+/)[0]
    || user.email?.split('@')[0]
    || 'there';
  const notifications = audits.flatMap<WorkspaceNotification>((audit) => {
    const items: WorkspaceNotification[] = [{
      id: `${audit.id}:audit`, audit, at: audit.auditedAt,
      title: 'Audit completed', detail: `${audit.title} · score ${audit.score}/100`,
    }];
    if (audit.correctionStatus && audit.correctionStatus !== 'ignored') {
      items.push({
        id: `${audit.id}:correction:${audit.correctionStatus}`, audit, at: audit.auditedAt,
        title: 'Correction applied', detail: `${audit.title} · ${audit.correctionStatus}`,
      });
    }
    if (audit.decision && audit.decidedAt) {
      items.push({
        id: `${audit.id}:decision:${audit.decidedAt}`, audit, at: audit.decidedAt,
        title: `Review ${audit.decision.replace('_', ' ')}`,
        detail: audit.reviewerNote || audit.title,
      });
    }
    return items;
  }).sort((left, right) => right.at.localeCompare(left.at)).slice(0, 50);

  useEffect(() => {
    if (notificationBaselineReady || (!demo && cloudSyncStatus !== 'synced')) return;
    const initialReadIds = notifications.map((notification) => notification.id);
    setReadNotificationIds(initialReadIds);
    setNotificationBaselineReady(true);
    try {
      window.localStorage.setItem(notificationReadKey, JSON.stringify(initialReadIds));
    } catch {
      // Keep the notification list available if browser storage is unavailable.
    }
  }, [notificationBaselineReady, notifications, notificationReadKey, cloudSyncStatus, demo]);

  const unreadNotificationCount = notificationBaselineReady
    ? notifications.filter((notification) => !readNotificationIds.includes(notification.id)).length
    : 0;
  const markNotificationsRead = (ids: string[]) => {
    const next = [...new Set([...readNotificationIds, ...ids])];
    setReadNotificationIds(next);
    try {
      window.localStorage.setItem(notificationReadKey, JSON.stringify(next));
    } catch {
      setToast('Notifications are visible, but read status could not be saved on this device.');
    }
  };

  const handleAuditComplete = (
  draft: string,
  profile: BrandProfile,
  result: AuditResult
  ) => {
  const priorDecision = findRelevantDecision(draft, audits);
  const record = createWorkspaceAudit(draft, profile, result);

  if (priorDecision) {
    record.relatedDecisionId = priorDecision.id;
    record.reviewerNote = priorDecision.reviewerNote;
  }

  const next = [record, ...audits].slice(0, 100);
  setBrand(profile);
  setAudits(next);
  setSelectedAuditId(record.id);
  saveBrandProfile(profile, user.uid);
  saveWorkspaceAudits(next, user.uid);
  saveBrandEverywhere(profile);
  saveAuditEverywhere(record);

  setToast(
    priorDecision
      ? `Audit saved with context from a similar ${priorDecision.decision?.replace('_', ' ')} decision.`
      : 'Audit saved in this browser.'
  );

  return record.id;
  };

  const handleCorrectionUpdate = (auditId: string | null, correction: string, result: AuditResult, status: 'applied' | 'edited' | 'ignored') => {
    if (!auditId) return;
    const next = audits.map((audit) => {
      if (audit.id !== auditId) return audit;
      if (status === 'ignored') return { ...audit, correctionStatus: 'ignored' as const };

      const correctedCopy = correction.trim();
      return {
        ...audit,
        title: correctedCopy.replace(/\s+/g, ' ').slice(0, 54) || 'Untitled draft',
        originalDraft: audit.originalDraft ?? audit.draft,
        originalScore: audit.originalScore ?? audit.score,
        originalStatus: audit.originalStatus ?? audit.status,
        originalViolations: audit.originalViolations ?? audit.violations,
        draft: correctedCopy,
        score: result.score,
        status: result.status,
        violations: result.violations,
        suggestedCopy: result.suggestedCopy,
        appliedCorrection: correctedCopy,
        correctionStatus: status,
        auditedAt: new Date().toISOString(),
        decision: undefined,
        reviewerNote: undefined,
        decidedAt: undefined,
      };
    });
    setAudits(next);
    saveWorkspaceAudits(next, user.uid);
    const updatedAudit = next.find((audit) => audit.id === auditId);
    if (updatedAudit) saveAuditEverywhere(updatedAudit);
    setToast(status === 'ignored' ? 'Correction ignored.' : 'Correction saved to this audit.');
  };

  const handleDecision = (auditId: string | null, decision: ReviewDecision, note: string) => {
    if (!auditId) return;
    const next = audits.map((audit) => audit.id === auditId
      ? { ...audit, decision, reviewerNote: note, decidedAt: new Date().toISOString() }
      : audit);
    setAudits(next);
    saveWorkspaceAudits(next, user.uid);
    const updatedAudit = next.find((audit) => audit.id === auditId);
    if (updatedAudit) saveAuditEverywhere(updatedAudit);
    setToast('Reviewer decision recorded.');
  };

  const handleSaveBrand = async (profile: BrandProfile) => {
    if (!saveBrandProfile(profile, user.uid)) throw new Error('Could not save. Check this browser’s storage settings.');
    setBrand(profile);
    if (!demo) {
      try {
        await saveBrandToCloud(user.uid, profile);
        setCloudSyncStatus('synced');
      } catch {
        reportCloudSaveError();
        throw new Error('Brand DNA is saved on this device, but cloud sync failed. Check Firestore setup and rules.');
      }
    }
    setToast('Brand DNA saved in this browser.');
  };

  const exportWorkspaceReport = () => {
    const payload = {
      reportType: 'BLACKSHIP workspace audit summary',
      exportedAt: new Date().toISOString(),
      brand: brand.brandName,
      storage: demo ? 'This browser (demo)' : cloudSyncStatus === 'synced' ? 'Firebase Cloud and this browser' : 'This browser; cloud sync not confirmed',
      metrics: {
        contentAudited: audits.length,
        issuesDetected: issueTotal,
        approved: approvedTotal,
        pendingReview: pendingAudits.length,
        averageRuleScore: averageScore,
      },
      audits,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BLACKSHIP-workspace-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const metricCards = [
    { label: 'Content audited', value: audits.length, detail: 'Saved audit runs', icon: FileSearch },
    { label: 'Issues detected', value: issueTotal, detail: 'Policy hits across saved audits', icon: Activity },
    { label: 'Approved', value: approvedTotal, detail: 'Human decisions', icon: ShieldCheck },
    { label: 'Pending review', value: pendingAudits.length, detail: 'Audits awaiting a decision', icon: Clock3 },
  ];

  const openAudit = (audit: WorkspaceAuditRecord) => {
    setSelectedAuditId(audit.id);
    setPage('auditor');
  };

  const handleSignOut = async () => {
    if (demo) {
      window.sessionStorage.removeItem('blackship-demo-session');
      window.location.assign('/login');
      return;
    }
    if (!auth) return;
    try {
      await signOut(auth);
      window.location.assign('/login');
    } catch {
      setToast('Could not sign out. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#08090c]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="/" className="flex shrink-0 items-center gap-3" aria-label="Back to BLACKSHIP website">
            <img src="/assets/aistudio/blackship_nav_logo.svg" alt="BLACKSHIP" className="h-auto w-[150px] object-contain sm:w-[190px]" />
          </a>
          <div className="hidden max-w-[240px] truncate text-[10px] uppercase tracking-[0.14em] text-zinc-500 sm:block"><span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${demo ? 'bg-amber-300' : 'bg-emerald-400'}`} />{demo ? 'Demo workspace' : user.email ?? user.displayName ?? 'Authenticated account'}</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage('notifications')} aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ''}`} className={`relative inline-flex min-h-10 items-center gap-2 rounded border px-3 text-[10px] font-semibold uppercase tracking-wider transition-colors ${page === 'notifications' ? 'border-white/35 text-white' : 'border-white/15 text-zinc-300 hover:border-white/35 hover:text-white'}`}><Bell className="h-3.5 w-3.5" /><span className="hidden sm:inline">Notifications</span>{unreadNotificationCount > 0 && <span className="rounded-full bg-sky-300 px-1.5 py-0.5 text-[9px] font-bold text-black">{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</span>}</button>
            <button type="button" onClick={() => setPage('account')} aria-label="My account" className={`inline-flex min-h-10 items-center gap-2 rounded border px-3 text-[10px] font-semibold uppercase tracking-wider transition-colors ${page === 'account' ? 'border-white/35 text-white' : 'border-white/15 text-zinc-300 hover:border-white/35 hover:text-white'}`}><UserRound className="h-3.5 w-3.5" /><span className="hidden sm:inline">My Account</span></button>
            <button type="button" onClick={handleSignOut} className="inline-flex min-h-10 items-center rounded border border-white/15 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 transition-colors hover:border-white/35 hover:text-white">{demo ? 'Exit demo' : 'Sign out'}</button>
            <a href="/" className="inline-flex min-h-10 items-center gap-2 rounded border border-white/15 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 transition-colors hover:border-white/35 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Marketing site</span><span className="sm:hidden">Back</span></a>
          </div>
        </div>
        <nav aria-label="Workspace navigation" className="mx-auto flex max-w-[1500px] flex-wrap gap-1 px-4 pb-3 sm:px-6 lg:hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} type="button" onClick={() => setPage(item.id)} aria-current={page === item.id ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${page === item.id ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>;
          })}
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-65px)] border-r border-white/[0.08] px-4 py-7 lg:block">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600">Workspace</p>
          <nav aria-label="Workspace navigation" className="mt-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} type="button" onClick={() => setPage(item.id)} aria-current={page === item.id ? 'page' : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-medium transition-colors ${page === item.id ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'}`}><Icon className="h-4 w-4" />{item.label}{item.id === 'review-queue' && pendingAudits.length > 0 && <span className="ml-auto rounded-full bg-sky-300 px-2 py-0.5 text-[10px] font-bold text-black">{pendingAudits.length}</span>}</button>;
            })}
          </nav>
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.025] p-4">
            <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Active brand</span>
            <p className="mt-2 truncate text-sm font-bold uppercase tracking-wider text-white">{brand.brandName || 'Untitled brand'}</p>
            <span className="mt-2 inline-flex items-center gap-2 text-[10px] text-zinc-500"><span className={`h-1.5 w-1.5 rounded-full ${demo ? 'bg-amber-300' : cloudSyncStatus === 'synced' ? 'bg-emerald-400' : cloudSyncStatus === 'connecting' ? 'bg-sky-300' : 'bg-red-400'}`} />{demo ? 'Demo · saved on this device' : cloudSyncStatus === 'synced' ? 'Synced to your Firebase account' : cloudSyncStatus === 'connecting' ? 'Connecting to cloud storage…' : 'Device copy saved · cloud sync needs setup'}</span>
          </div>
        </aside>

        <main className="min-w-0">
          {page === 'overview' && <section className="mx-auto max-w-6xl px-5 py-9 sm:px-8 lg:py-12">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <div><p className="mb-2 text-[10px] uppercase tracking-[0.23em] text-sky-300">Brand governance control center</p><h1 className="font-editorial text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">{greeting()}, {greetingName}</h1><p className="mt-3 text-sm text-zinc-400">Run an audit, review policy findings, and record a human decision.</p></div>
              <button type="button" onClick={() => { setSelectedAuditId(null); setPage('auditor'); }} className="inline-flex min-h-12 items-center gap-2 rounded bg-white px-5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200"><FileSearch className="h-4 w-4" /> New content audit</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((metric) => { const Icon = metric.icon; return <article key={metric.label} className="rounded-xl border border-white/10 bg-[#0b0c10] p-5"><div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{metric.label}</span><Icon className="h-4 w-4 text-sky-300" /></div><p className="mt-4 font-editorial text-3xl font-bold text-white">{number(metric.value)}</p><p className="mt-1 text-[11px] text-zinc-500">{metric.detail}</p></article>; })}
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
              <section className="rounded-xl border border-white/10 bg-[#0b0c10] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Recent audits</h2><p className="mt-1 text-xs text-zinc-500">Saved when you run an audit in this workspace.</p></div><button type="button" onClick={() => setPage('review-queue')} className="text-[10px] font-semibold uppercase tracking-wider text-sky-300 hover:text-white">Review queue →</button></div>
                {audits.length === 0 ? <div className="mt-5 rounded-lg border border-dashed border-white/10 px-4 py-8 text-center"><p className="text-sm text-zinc-300">No audit data yet</p><p className="mt-1 text-xs text-zinc-500">Your dashboard metrics and history will update after your first content audit.</p></div> : <div className="mt-5 divide-y divide-white/[0.07]">{audits.slice(0, 6).map((audit) => <button key={audit.id} type="button" onClick={() => openAudit(audit)} className="flex w-full items-center justify-between gap-4 py-3 text-left hover:bg-white/[0.025]"><span className="min-w-0"><span className="block truncate text-sm font-medium text-zinc-200">{audit.title}</span><span className="mt-1 block text-[10px] text-zinc-500">{new Date(audit.auditedAt).toLocaleString()} · score {audit.score}</span></span><span className="shrink-0 text-right"><span className="block text-xs text-zinc-300">{audit.violations.length} {audit.violations.length === 1 ? 'issue' : 'issues'}</span><span className={`mt-1 inline-block text-[9px] font-bold uppercase tracking-wider ${audit.decision === 'approved' ? 'text-emerald-300' : audit.decision === 'rejected' ? 'text-rose-300' : audit.decision === 'changes_requested' ? 'text-amber-300' : 'text-sky-300'}`}>{audit.decision?.replace('_', ' ') ?? 'Needs review'}</span></span></button>)}</div>}
              </section>
              <section className="rounded-xl border border-white/10 bg-[#0b0c10] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3"><div><h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Brand health</h2><p className="mt-1 text-xs text-zinc-500">Calculated from saved rule-engine audits.</p></div><Activity className="h-4 w-4 text-sky-300" /></div>
                {averageScore === null ? <div className="mt-5 rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-xs text-zinc-500">No audit data yet. No score is shown until a real audit is run.</div> : <><div className="mt-5 rounded-lg bg-black/40 p-4"><span className="text-[10px] uppercase tracking-wider text-zinc-500">Average rule score</span><div className="mt-1 flex items-end gap-2"><span className="font-editorial text-3xl font-bold text-white">{averageScore}</span><span className="pb-1 text-xs text-zinc-500">/ 100 · {audits.length} audits</span></div></div><div className="mt-4 space-y-3">{['tone', 'terminology', 'claims', 'compliance'].map((category) => { const count = categoryCounts[category] ?? 0; const maxCount = Math.max(1, ...Object.values(categoryCounts)); const width = count === 0 ? 0 : Math.max(6, Math.round(count / maxCount * 100)); return <div key={category}><div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-zinc-500"><span>{category} flags</span><span>{count}</span></div><div className="h-1.5 overflow-hidden rounded bg-white/[0.06]"><div className="h-full rounded bg-sky-300/80" style={{ width: `${width}%` }} /></div></div>; })}</div></>}
              </section>
            </div>
          </section>}

          {page === 'brand-dna' && <BrandDnaPanel initialProfile={brand} onSaved={handleSaveBrand} />}

{page === 'auditor' && (
  <LiveAuditor
    key={selectedAuditId ?? 'new-audit'}
    workspaceMode
    showExportReport
    initialDraft={selectedAudit?.draft}
    initialAuditId={selectedAuditId ?? undefined}
    initialAuditRecord={selectedAudit}
    initialProfile={brand}
    auditHistory={audits}
    onProfileSave={handleSaveBrand}
    onAuditComplete={handleAuditComplete}
    onDecision={handleDecision}
    onCorrectionUpdate={handleCorrectionUpdate}
  />
)}

      {page === 'audit-history' && (
        <section className="mx-auto max-w-6xl px-5 py-10">
          <h1 className="text-3xl font-bold text-white">Audit History</h1>
          <p className="mt-2 text-sm text-zinc-400">Previous checks, detected issues, AI corrections, and reviewer decisions.</p>
          <p className="mt-2 text-xs text-zinc-500">{audits.length} saved audits</p>
          {audits.length === 0 ? <div className="mt-7 rounded-xl border border-dashed border-white/15 p-8 text-sm text-zinc-400">No audits saved yet. Run a brand audit to start your history.</div> : (
            <div className="mt-7 space-y-4">
              {audits.map((audit) => (
                <article key={audit.id} className="rounded-2xl border border-white/10 bg-[#0b0c10] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><p className="text-[10px] uppercase tracking-widest text-zinc-500">{new Date(audit.auditedAt).toLocaleString()}</p><h2 className="mt-2 text-lg font-semibold text-white">{audit.title}</h2><p className="mt-1 text-xs text-zinc-400">{audit.brandName} · Score {audit.score}/100 · {audit.violations.length} issue(s)</p></div>
                    <div className="flex items-center gap-3"><span className="rounded-full border border-white/10 px-3 py-1.5 text-xs capitalize text-zinc-300">{audit.decision ? audit.decision.replace('_', ' ') : 'Pending review'}</span><button type="button" onClick={() => openAudit(audit)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/5">Open audit</button></div>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-white/10 p-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Content checked</h3><p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{audit.originalDraft || audit.draft}</p></div>
                    <div className="rounded-xl border border-white/10 p-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">AI suggested correction</h3><p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{audit.originalSuggestedCopy || audit.suggestedCopy || 'No AI suggestion was recorded.'}</p></div>
                  </div>
                  <div className="mt-3 rounded-xl border border-white/10 p-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Problems detected</h3>{(audit.originalViolations ?? audit.violations).length ? <div className="mt-3 space-y-3">{(audit.originalViolations ?? audit.violations).map((violation, index) => <div key={`${audit.id}-issue-${index}`} className="border-l-2 border-amber-400/60 pl-3"><p className="text-xs font-semibold text-amber-200">{violation.category} · {violation.severity}</p><p className="mt-1 text-sm text-zinc-300">{violation.explanation}</p><p className="mt-1 text-xs text-zinc-500">Suggestion: {violation.recommendation}</p></div>)}</div> : <p className="mt-2 text-sm text-zinc-400">No policy issues were detected.</p>}</div>
                  {audit.appliedCorrection && <div className="mt-3 rounded-xl border border-sky-300/15 p-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-sky-200">Applied correction · {audit.correctionStatus || 'recorded'}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{audit.appliedCorrection}</p></div>}
                  <div className="mt-3 rounded-xl border border-white/10 p-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Final decision</h3><p className="mt-2 text-sm capitalize text-white">{audit.decision ? audit.decision.replace('_', ' ') : 'Awaiting reviewer decision'}</p>{audit.reviewerNote && <p className="mt-1 text-sm text-zinc-400">Reviewer note: {audit.reviewerNote}</p>}{audit.decidedAt && <p className="mt-1 text-xs text-zinc-500">Recorded {new Date(audit.decidedAt).toLocaleString()}</p>}</div>
                </article>
              ))}
            </div>
          )}

        </section>
      )}

          {page === 'account' && <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
            <p className="mb-3 text-[10px] uppercase tracking-[0.23em] text-sky-300">Personal workspace</p>
            <h1 className="font-editorial text-4xl font-black uppercase text-white sm:text-5xl">My Account</h1>
            <p className="mt-3 text-sm text-zinc-400">Your profile and the work saved to this BLACKSHIP account.</p>
            <div className="mt-7 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-xl border border-white/10 bg-[#0b0c10] p-5 sm:p-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Personal information</h2>
                <div className="mt-5 flex items-center gap-4">
                  {user.photoURL ? <img src={user.photoURL} alt="" className="h-14 w-14 rounded-full border border-white/10 object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]"><UserRound className="h-6 w-6 text-zinc-300" /></div>}
                  <div><p className="text-base font-semibold text-white">{user.displayName || 'BLACKSHIP user'}</p><p className="mt-1 text-xs text-zinc-400">{demo ? 'Demo workspace' : 'Signed-in account'}</p></div>
                </div>
                <dl className="mt-6 space-y-4">
                  <div className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 text-zinc-500" /><div><dt className="text-[10px] uppercase tracking-wider text-zinc-500">Email</dt><dd className="mt-1 break-all text-sm text-zinc-200">{user.email || 'No email on this account'}</dd></div></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-zinc-500">Sign-in method</dt><dd className="mt-1 text-sm text-zinc-200">{demo ? 'Demo' : user.providerData?.map((provider) => provider.providerId === 'google.com' ? 'Google' : provider.providerId === 'password' ? 'Email and password' : provider.providerId).join(', ') || 'Firebase account'}</dd></div>
                  {user.metadata?.creationTime && <div><dt className="text-[10px] uppercase tracking-wider text-zinc-500">Account created</dt><dd className="mt-1 text-sm text-zinc-200">{new Date(user.metadata.creationTime).toLocaleDateString()}</dd></div>}
                  <div><dt className="text-[10px] uppercase tracking-wider text-zinc-500">Active brand</dt><dd className="mt-1 text-sm text-zinc-200">{brand.brandName || 'Untitled brand'}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-zinc-500">Cloud status</dt><dd className="mt-1 text-sm text-zinc-200">{demo ? 'Saved on this device' : cloudSyncStatus === 'synced' ? 'Synced to your Firebase account' : cloudSyncStatus === 'connecting' ? 'Connecting to Firebase' : 'Device copy saved · sync needs attention'}</dd></div>
                </dl>
              </section>
              <section className="rounded-xl border border-white/10 bg-[#0b0c10] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Your saved work</h2><p className="mt-1 text-xs text-zinc-500">Audits, corrections, and decisions linked to this account.</p></div><button type="button" onClick={exportWorkspaceReport} disabled={!audits.length} className="inline-flex min-h-9 items-center gap-2 rounded border border-white/15 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-200 hover:border-white/35 disabled:opacity-40"><ArrowDownToLine className="h-3.5 w-3.5" /> Export</button></div>
                <div className="mt-5 grid grid-cols-3 gap-2"><div className="rounded-lg bg-white/[0.03] p-3"><p className="text-xl font-bold text-white">{number(audits.length)}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-zinc-500">Audits</p></div><div className="rounded-lg bg-white/[0.03] p-3"><p className="text-xl font-bold text-white">{number(decidedAudits.length)}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-zinc-500">Decisions</p></div><div className="rounded-lg bg-white/[0.03] p-3"><p className="text-xl font-bold text-white">{number(pendingAudits.length)}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-zinc-500">Pending</p></div></div>
                {audits.length === 0 ? <p className="mt-5 rounded-lg border border-dashed border-white/10 p-5 text-sm text-zinc-400">Your saved audits will appear here after your first content review.</p> : <div className="mt-4 divide-y divide-white/[0.07]">{audits.slice(0, 8).map((audit) => <button key={audit.id} type="button" onClick={() => openAudit(audit)} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-white/[0.025]"><span className="min-w-0"><span className="block truncate text-sm text-zinc-200">{audit.title}</span><span className="mt-1 block text-[10px] text-zinc-500">{new Date(audit.auditedAt).toLocaleString()} · score {audit.score}</span></span><span className="shrink-0 text-[10px] font-semibold uppercase text-zinc-400">{audit.decision?.replace('_', ' ') || 'Pending'}</span></button>)}</div>}
                {audits.length > 8 && <button type="button" onClick={() => setPage('audit-history')} className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-sky-300 hover:text-white">View all {audits.length} saved audits →</button>}
              </section>
            </div>
          </section>}

          {page === 'notifications' && <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-3 text-[10px] uppercase tracking-[0.23em] text-sky-300">Workspace activity</p><h1 className="font-editorial text-4xl font-black uppercase text-white sm:text-5xl">Notifications</h1><p className="mt-3 text-sm text-zinc-400">Audit, correction, and reviewer activity for your account.</p></div>{unreadNotificationCount > 0 && <button type="button" onClick={() => markNotificationsRead(notifications.map((notification) => notification.id))} className="inline-flex min-h-10 items-center gap-2 rounded border border-white/15 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-200 hover:border-white/35"><CheckCheck className="h-4 w-4" /> Mark all read</button>}</div>
            {notifications.length === 0 ? <div className="mt-7 rounded-xl border border-dashed border-white/15 p-8 text-center"><Bell className="mx-auto h-6 w-6 text-zinc-500" /><p className="mt-3 text-sm text-zinc-300">You’re all caught up</p><p className="mt-1 text-xs text-zinc-500">New audit and review activity will appear here.</p></div> : <div className="mt-7 space-y-2">{notifications.map((notification) => { const unread = notificationBaselineReady && !readNotificationIds.includes(notification.id); return <button key={notification.id} type="button" onClick={() => { markNotificationsRead([notification.id]); openAudit(notification.audit); }} className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-[#0b0c10] p-4 text-left transition hover:border-white/25"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? 'bg-sky-300' : 'bg-zinc-700'}`} /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold text-white">{notification.title}</span><time className="text-[10px] text-zinc-500">{new Date(notification.at).toLocaleString()}</time></span><span className="mt-1 block truncate text-xs text-zinc-400">{notification.detail}</span></span></button>; })}</div>}
            <p className="mt-4 text-[10px] text-zinc-600">Read status is saved on this device for this signed-in account.</p>
          </section>}
          {page === 'review-queue' && <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><p className="mb-3 text-[10px] uppercase tracking-[0.23em] text-sky-300">Human review</p><h1 className="font-editorial text-4xl font-black uppercase text-white sm:text-5xl">Review queue</h1><p className="mt-3 text-sm text-zinc-400">Only saved audits without a final decision appear here.</p>{pendingAudits.length === 0 ? <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center"><p className="text-sm text-zinc-300">No content awaiting review</p><p className="mt-2 text-xs text-zinc-500">Run an audit to add a draft to the queue.</p></div> : <div className="mt-6 space-y-3">{pendingAudits.map((audit) => <article key={audit.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0b0c10] p-5"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{audit.title}</p><p className="mt-1 text-xs text-zinc-500">{new Date(audit.auditedAt).toLocaleString()} · {audit.violations.length} issues · score {audit.score}</p></div><button type="button" onClick={() => openAudit(audit)} className="min-h-10 rounded border border-white/20 px-4 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white/10">Open in auditor</button></article>)}</div>}</section>}

          {page === 'brand-memory' && <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
            <p className="mb-3 text-[10px] uppercase tracking-[0.23em] text-sky-300">Decision history</p>
            <h1 className="font-editorial text-4xl font-black uppercase text-white sm:text-5xl">Brand memory</h1>
            <p className="mt-3 text-sm text-zinc-400">Approved, rejected, and change-requested decisions are retained as reusable review context.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {(['approved', 'rejected', 'changes_requested'] as const).map((decision) => <div key={decision} className="rounded-xl border border-white/10 bg-[#0b0c10] p-5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">{decision.replace('_', ' ')}</span>
                <p className="mt-2 font-editorial text-3xl font-bold text-white">{number(audits.filter((audit) => audit.decision === decision).length)}</p>
              </div>)}
            </div>
            {decidedAudits.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-white/15 p-8 text-center text-xs text-zinc-500">No reviewer decisions recorded yet.</div> : <div className="mt-6 space-y-3">
              {decidedAudits.map((audit) => {
                const similar = decidedAudits
                  .filter((candidate) => candidate.id !== audit.id)
                  .map((candidate) => ({ candidate, score: textSimilarity(audit.draft, candidate.draft) }))
                  .filter((item) => item.score >= 0.35)
                  .sort((a, b) => b.score - a.score)[0];
                return <article key={audit.id} className="rounded-xl border border-white/10 bg-[#0b0c10] p-5">
                  <div className="flex flex-wrap justify-between gap-3">
                    <h2 className="text-sm font-semibold text-white">{audit.title}</h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">{audit.decision?.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{audit.reviewerNote || 'No reviewer note provided.'}</p>
                  {similar && <div className="mt-4 rounded-lg border border-sky-300/15 bg-sky-300/[0.03] p-3">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sky-300">Similar prior decision · {Math.round(similar.score * 100)}% text overlap</p>
                    <p className="mt-1 text-xs text-zinc-300">{similar.candidate.title} · {similar.candidate.decision?.replace('_', ' ')}</p>
                    <p className="mt-1 text-[10px] text-zinc-500">Previous human decision is shown as context; it does not automatically decide a new audit.</p>
                  </div>}
                  {audit.correctionStatus && <p className="mt-3 text-[10px] uppercase tracking-wider text-zinc-500">Correction {audit.correctionStatus}</p>}
                  {audit.originalDraft && audit.originalDraft !== audit.draft && <p className="mt-2 text-xs leading-5 text-zinc-500"><span className="font-semibold uppercase tracking-wider">Original draft: </span>{audit.originalDraft}</p>}
                  <button type="button" onClick={() => openAudit(audit)} className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 hover:text-white">View audit →</button>
                </article>;
              })}
            </div>}
          </section>}

          {page === 'reports' && <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
            <p className="mb-3 text-[10px] uppercase tracking-[0.23em] text-sky-300">Audit reporting</p>
            <h1 className="font-editorial text-4xl font-black uppercase text-white sm:text-5xl">Reports</h1>
            <p className="mt-3 text-sm text-zinc-400">Every number below is calculated from saved audit and reviewer data on this device.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((metric) => { const Icon = metric.icon; return <div key={metric.label} className="rounded-xl border border-white/10 bg-[#0b0c10] p-5"><Icon className="h-4 w-4 text-sky-300" /><p className="mt-4 text-[10px] uppercase tracking-wider text-zinc-500">{metric.label}</p><p className="mt-1 font-editorial text-3xl font-bold text-white">{number(metric.value)}</p></div>; })}
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#0b0c10] p-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Common violation types</h2>
                {topViolationTypes.length === 0 ? <p className="mt-5 text-xs text-zinc-500">No violation data yet.</p> : <div className="mt-4 space-y-3">{topViolationTypes.map(([type, count]) => <div key={type} className="flex items-center justify-between gap-4"><span className="text-xs capitalize text-zinc-300">{type}</span><span className="text-xs font-semibold text-white">{count}</span></div>)}</div>}
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0b0c10] p-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Review outcomes</h2>
                <div className="mt-4 space-y-3">{['approved', 'changes_requested', 'rejected', 'pending'].map((key) => <div key={key} className="flex items-center justify-between gap-4"><span className="text-xs capitalize text-zinc-300">{key.replace('_', ' ')}</span><span className="text-xs font-semibold text-white">{decisionCounts[key] ?? 0}</span></div>)}</div>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-white/10 bg-[#0b0c10] p-5">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Recent activity</h2>
              {recentActivity.length === 0 ? <p className="mt-5 text-xs text-zinc-500">No activity yet. Run a content audit to populate this report.</p> : <div className="mt-4 divide-y divide-white/[0.07]">{recentActivity.map((audit) => <div key={audit.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-xs text-zinc-200">{audit.title}</p><p className="mt-1 text-[10px] text-zinc-500">{new Date(audit.auditedAt).toLocaleString()} · {audit.violations.length} issues</p></div><span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">{audit.decision?.replace('_', ' ') ?? 'pending'}</span></div>)}</div>}
            </div>
            <div className="mt-6 rounded-xl border border-white/10 bg-[#0b0c10] p-5 sm:p-6">
              <p className="text-sm text-white">{audits.length ? `${audits.length} audit records are ready to export.` : 'No report data yet.'}</p>
              <button type="button" onClick={exportWorkspaceReport} disabled={!audits.length} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded bg-white px-4 text-xs font-bold uppercase tracking-wider text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"><ArrowDownToLine className="h-4 w-4" /> Export workspace report</button>
            </div>
          </section>}

          {page === 'settings' && <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><p className="mb-3 text-[10px] uppercase tracking-[0.23em] text-sky-300">Workspace configuration</p><h1 className="font-editorial text-4xl font-black uppercase text-white sm:text-5xl">Settings</h1><div className="mt-6 rounded-xl border border-white/10 bg-[#0b0c10] p-5 sm:p-7"><h2 className="text-sm font-semibold text-white">Workspace data</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{demo ? 'Demo Brand DNA, audits, and decisions are saved only in this browser.' : cloudSyncStatus === 'synced' ? 'Brand DNA, audits, and reviewer decisions are saved in this browser and synced to your Firebase account.' : 'This browser keeps a local copy. Finish Firestore setup to sync data across devices.'}</p><p className="mt-4 text-xs text-zinc-500">To update brand profile and policy, use the Brand DNA page.</p></div></section>}

          {toast && <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-50 rounded-lg border border-white/15 bg-[#101116] px-4 py-3 text-xs text-zinc-200 shadow-2xl">{toast}<button type="button" onClick={() => setToast('')} className="ml-3 text-zinc-500 hover:text-white" aria-label="Dismiss notification">×</button></div>}
        </main>
      </div>
    </div>
  );
};
