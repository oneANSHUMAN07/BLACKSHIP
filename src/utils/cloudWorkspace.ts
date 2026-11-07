import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { BrandProfile } from './governance';
import type { WorkspaceAuditRecord } from './workspace';

type CloudWorkspaceUpdate = (brand: BrandProfile, audits: WorkspaceAuditRecord[]) => void;
type CloudWorkspaceError = (error: unknown) => void;

function isBrandProfile(value: unknown): value is BrandProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Partial<BrandProfile>;
  return typeof profile.brandName === 'string'
    && typeof profile.description === 'string'
    && typeof profile.industry === 'string'
    && typeof profile.voiceDescription === 'string'
    && Array.isArray(profile.approvedTerms)
    && Array.isArray(profile.approvedFacts)
    && Array.isArray(profile.customRules);
}

export function subscribeToCloudWorkspace(
  accountId: string,
  localBrand: BrandProfile,
  localAudits: WorkspaceAuditRecord[],
  onUpdate: CloudWorkspaceUpdate,
  onError: CloudWorkspaceError,
): () => void {
  if (!db) {
    onError(new Error('Firebase is not configured.'));
    return () => undefined;
  }

  const accountRef = doc(db, 'users', accountId);
  const auditsRef = collection(db, 'users', accountId, 'audits');
  let accountReady = false;
  let auditsReady = false;
  let cloudBrand: BrandProfile | undefined;
  let cloudAudits: WorkspaceAuditRecord[] = [];

  const reconcile = () => {
    if (!accountReady || !auditsReady) return;

    const cloudIds = new Set(cloudAudits.map((audit) => audit.id));
    const merged = new Map<string, WorkspaceAuditRecord>();
    for (const audit of localAudits) merged.set(audit.id, audit);
    for (const audit of cloudAudits) merged.set(audit.id, audit);
    const audits = [...merged.values()].sort((left, right) => right.auditedAt.localeCompare(left.auditedAt));
    const brand = cloudBrand ?? localBrand;

    if (!cloudBrand) {
      void setDoc(accountRef, { brand, updatedAt: new Date().toISOString() }, { merge: true }).catch(onError);
    }
    for (const audit of localAudits) {
      if (!cloudIds.has(audit.id)) {
        void setDoc(doc(auditsRef, audit.id), audit).catch(onError);
      }
    }
    onUpdate(brand, audits);
  };

  const unsubscribeAccount = onSnapshot(accountRef, (snapshot) => {
    if (snapshot.metadata.fromCache) return;
    accountReady = true;
    const candidate: unknown = snapshot.data()?.brand;
    cloudBrand = isBrandProfile(candidate) ? candidate : undefined;
    reconcile();
  }, onError);

  const unsubscribeAudits = onSnapshot(auditsRef, (snapshot) => {
    if (snapshot.metadata.fromCache) return;
    auditsReady = true;
    cloudAudits = snapshot.docs.map((auditDocument) => {
      const data = auditDocument.data() as WorkspaceAuditRecord;
      return { ...data, id: data.id || auditDocument.id };
    });
    reconcile();
  }, onError);

  return () => {
    unsubscribeAccount();
    unsubscribeAudits();
  };
}

export async function saveBrandToCloud(accountId: string, brand: BrandProfile): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'users', accountId), { brand, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function saveAuditToCloud(accountId: string, audit: WorkspaceAuditRecord): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'users', accountId, 'audits', audit.id), audit);
}
