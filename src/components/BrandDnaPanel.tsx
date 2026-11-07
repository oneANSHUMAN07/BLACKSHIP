import React, { useEffect, useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import type { BrandProfile } from '../utils/governance';

const lines = (values: string[]) => values.join('\n');
interface BrandDnaPanelProps { initialProfile: BrandProfile; onSaved: (profile: BrandProfile) => Promise<void> }

export const BrandDnaPanel: React.FC<BrandDnaPanelProps> = ({ initialProfile, onSaved }) => {
  const [profile, setProfile] = useState<BrandProfile>(initialProfile);
  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setProfile(initialProfile), [initialProfile]);

  const update = <K extends keyof BrandProfile>(key: K, value: BrandProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaveMessage('Unsaved changes');
  };

  const setRestrictedPhrases = (value: string) => {
    const existing = new Map(profile.customRules.map((rule) => [rule.phrase.trim().toLocaleLowerCase(), rule]));
    const customRules = value.split('\n').map((phrase) => phrase.trim()).filter(Boolean).map((phrase) => {
      const previous = existing.get(phrase.toLocaleLowerCase());
      return previous ?? { id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, phrase, replacement: '', severity: 'warning' as const };
    });
    update('customRules', customRules);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaved(profile);
      setSaveMessage('Brand DNA saved to your workspace.');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Could not save Brand DNA.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="brand-dna" className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="mb-8 border-b border-white/10 pb-7">
        <p className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-sky-300"><ShieldCheck className="h-4 w-4" /> Policy configuration</p>
        <h1 className="font-editorial text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">Brand DNA</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Define the identity and verified claims the auditor will use. These settings are shared with the content review workflow on this device.</p>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-white/10 bg-[#0b0c10] p-5 sm:p-7">
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">Brand identity</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs uppercase tracking-wider text-zinc-400">Brand name<input value={profile.brandName} onChange={(event) => update('brandName', event.target.value)} className="mt-2 w-full rounded border border-white/15 bg-black/50 p-3 text-sm normal-case tracking-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" /></label>
            <label className="text-xs uppercase tracking-wider text-zinc-400">Industry<input value={profile.industry} onChange={(event) => update('industry', event.target.value)} placeholder="e.g. Enterprise software" className="mt-2 w-full rounded border border-white/15 bg-black/50 p-3 text-sm normal-case tracking-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" /></label>
            <label className="text-xs uppercase tracking-wider text-zinc-400 md:col-span-2">Brand description<textarea value={profile.description} onChange={(event) => update('description', event.target.value)} rows={2} placeholder="What the brand does and who it serves" className="mt-2 w-full resize-y rounded border border-white/15 bg-black/50 p-3 text-sm normal-case tracking-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" /></label>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#0b0c10] p-5 sm:p-7">
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">Voice & approved language</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs uppercase tracking-wider text-zinc-400 md:col-span-2">Voice and tone<textarea value={profile.voiceDescription} onChange={(event) => update('voiceDescription', event.target.value)} rows={2} placeholder="Professional, precise, warm..." className="mt-2 w-full resize-y rounded border border-white/15 bg-black/50 p-3 text-sm normal-case tracking-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" /></label>
            <label className="text-xs uppercase tracking-wider text-zinc-400">Approved terms <span className="normal-case tracking-normal text-zinc-500">(one per line)</span><textarea value={lines(profile.approvedTerms)} onChange={(event) => update('approvedTerms', event.target.value.split('\n').map((term) => term.trim()).filter(Boolean))} rows={5} placeholder="brand governance\ncontent compliance" className="mt-2 w-full resize-y rounded border border-white/15 bg-black/50 p-3 text-sm normal-case tracking-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" /></label>
            <label className="text-xs uppercase tracking-wider text-zinc-400">Restricted terms <span className="normal-case tracking-normal text-zinc-500">(one per line)</span><textarea value={lines(profile.customRules.map((rule) => rule.phrase))} onChange={(event) => setRestrictedPhrases(event.target.value)} rows={5} placeholder="guaranteed\n#1\n100% accurate" className="mt-2 w-full resize-y rounded border border-white/15 bg-black/50 p-3 text-sm normal-case tracking-normal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" /></label>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#0b0c10] p-5 sm:p-7">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">Approved facts</h2>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Used to check factual claims</span>
          </div>
          <p className="mb-4 text-xs leading-5 text-zinc-500">Add verified claims with their exact approved wording. Unsupported superlative or numeric claims will be flagged for human verification; the auditor will not guess whether they are true.</p>
          <label className="sr-only" htmlFor="approved-facts">Approved facts, one per line</label>
          <textarea id="approved-facts" value={lines(profile.approvedFacts)} onChange={(event) => update('approvedFacts', event.target.value.split('\n').map((fact) => fact.trim()).filter(Boolean))} rows={5} placeholder={'BLACKSHIP provides brand governance tools for enterprise teams.\nAudited processing latency is below 140 ms (Benchmark report, v1).'} className="w-full resize-y rounded border border-white/15 bg-black/50 p-3 text-sm leading-6 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" />
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={handleSave} disabled={saving} className="inline-flex min-h-12 items-center gap-2 rounded bg-white px-5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"><Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Brand DNA'}</button>
          <p role="status" aria-live="polite" className="text-xs text-zinc-400">{saveMessage || 'Your saved Brand DNA is available when you sign in again.'}</p>
        </div>
      </div>
    </section>
  );
};
