import React, { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { auth, googleProvider, isFirebaseConfigured } from '../utils/firebase';

type AuthMode = 'signin' | 'signup';

function authErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account already uses this email. Try signing in instead.';
    case 'auth/weak-password':
      return 'Choose a password with at least 6 characters.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Enable Email/Password and Google providers in Firebase Authentication settings.';
    case 'auth/unauthorized-domain':
      return 'Add this website domain to Firebase Authentication’s authorized domains.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Allow popups and try again.';
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in window was closed before finishing.';
    case 'auth/account-exists-with-different-credential':
      return 'This email already uses another sign-in method. Sign in with that method first.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a little and try again.';
    case 'auth/network-request-failed':
      return 'Could not reach Firebase. Check your internet connection and try again.';
    default:
      return 'Authentication could not be completed. Check your Firebase setup and try again.';
  }
}

export const LoginPage: React.FC<{ onContinueAsDemo: () => void }> = ({ onContinueAsDemo }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
  if (!auth) return;

  getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        window.location.assign('/app');
      }
    })
    .catch((authError) => {
      setError(authErrorMessage(authError));
      setBusy(false);
    });
  }, []);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage('');
    setError('');
  };

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (!auth || !isFirebaseConfigured) {
      setError('Firebase is not configured yet. Follow FIREBASE_SETUP.md and add your Web app config to .env.local.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(credential.user);
        await signOut(auth);
        setPassword('');
        setMessage('Account created. Check your inbox for the verification link, then sign in.');
        setMode('signin');
      } else {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (!credential.user.emailVerified) {
          await sendEmailVerification(credential.user);
          await signOut(auth);
          setPassword('');
          setMessage('Please verify your email first. We sent a fresh verification link.');
          return;
        }
        window.location.assign('/app');
      }
    } catch (authError) {
      setError(authErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setMessage('');
    setError('');
    if (!auth || !isFirebaseConfigured) {
      setError('Firebase is not configured yet. Follow FIREBASE_SETUP.md and add your Web app config to .env.local.');
      return;
    }

    setBusy(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (authError) {
      setError(authErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordReset = async () => {
    setMessage('');
    setError('');
    if (!email.trim()) {
      setError('Enter your email address first, then choose Forgot password.');
      return;
    }
    if (!auth || !isFirebaseConfigured) {
      setError('Firebase is not configured yet. Follow FIREBASE_SETUP.md and add your Web app config to .env.local.');
      return;
    }

    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage('If an account exists for that address, Firebase will send password reset instructions.');
    } catch (authError) {
      setError(authErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  const notConfigured = !auth || !isFirebaseConfigured;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060608] text-zinc-100 selection:bg-white selection:text-black">
      <div className="pointer-events-none absolute inset-0 bg-grid-subtle opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-48 top-1/4 h-[34rem] w-[34rem] rounded-full bg-zinc-100/[0.06] blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-slate-300/[0.07] blur-[150px]" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <a href="/" aria-label="BLACKSHIP home" className="inline-flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300">
            <img src="/assets/aistudio/blackship_nav_logo.svg" alt="BLACKSHIP — Autonomous Brand Governance" className="h-auto w-[150px] object-contain sm:w-[190px]" />
          </a>
          <a href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-400 transition hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </a>
        </header>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_0.86fr] lg:gap-20">
          <section className="hidden max-w-xl lg:block">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-200" /> Human-reviewed brand governance
            </div>
            <h1 className="font-editorial text-6xl font-black uppercase leading-[0.92] tracking-tight text-white xl:text-7xl">
              Every decision.<br /><span className="text-zinc-500">On brand.</span>
            </h1>
            <p className="mt-7 max-w-lg text-sm leading-7 text-zinc-400">
              Review content against your brand rules, correct policy findings, and keep every approval in one workspace.
            </p>
            <div className="mt-12 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <span className="h-px w-12 bg-zinc-600" /> BLACKSHIP WORKSPACE
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="rounded-xl border border-white/[0.12] bg-[#0c0d10]/90 p-6 shadow-[0_32px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-9">
              <div className="mb-8 lg:hidden">
                <div className="mb-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Brand governance workspace
                </div>
              </div>

              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">Workspace access</p>
              <h2 className="mt-3 font-editorial text-4xl font-bold uppercase tracking-tight text-white">
                {mode === 'signin' ? 'Welcome back.' : 'Create account.'}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {mode === 'signin' ? 'Sign in to continue to your BLACKSHIP workspace.' : 'Create your BLACKSHIP account with email and password.'}
              </p>

              {notConfigured && (
                <div role="status" className="mt-6 rounded-md border border-amber-200/15 bg-amber-100/[0.045] p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100/90">Firebase setup required</p>
                  <p className="mt-1.5 text-xs leading-5 text-zinc-400">
                    Add the Firebase Web app values to <code className="text-zinc-300">.env.local</code> and enable Email/Password and Google in Firebase Authentication. See <code className="text-zinc-300">FIREBASE_SETUP.md</code>.
                  </p>
                </div>
              )}

              {error && <p role="alert" className="mt-5 rounded-md border border-red-300/20 bg-red-300/[0.06] px-3.5 py-3 text-xs leading-5 text-red-100">{error}</p>}
              {message && <p role="status" className="mt-5 rounded-md border border-emerald-200/20 bg-emerald-200/[0.05] px-3.5 py-3 text-xs leading-5 text-emerald-100">{message}</p>}

              <form onSubmit={handleEmailAuth} className="mt-7 space-y-5">
                <div>
                  <label htmlFor="blackship-email" className="mb-2 block text-xs font-medium text-zinc-300">Email address</label>
                  <div className="relative">
                    <Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="blackship-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      disabled={busy}
                      className="w-full rounded-md border border-white/10 bg-black/30 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-400/70 focus:ring-2 focus:ring-zinc-400/10 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="blackship-password" className="block text-xs font-medium text-zinc-300">Password</label>
                    {mode === 'signin' && <button type="button" disabled={busy || notConfigured} onClick={handlePasswordReset} className="text-[11px] text-zinc-500 transition hover:text-zinc-200 disabled:opacity-40">Forgot password?</button>}
                  </div>
                  <div className="relative">
                    <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="blackship-password"
                      type="password"
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={mode === 'signin' ? 'Enter your password' : 'At least 6 characters'}
                      disabled={busy}
                      className="w-full rounded-md border border-white/10 bg-black/30 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-400/70 focus:ring-2 focus:ring-zinc-400/10 disabled:opacity-50"
                    />
                  </div>
                </div>

                <button type="submit" disabled={busy || notConfigured} className="group flex w-full items-center justify-center gap-2 rounded-md bg-zinc-100 px-4 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0d10] disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in with email' : 'Create account'}
                  {!busy && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
              </div>

              <button type="button" onClick={handleGoogleSignIn} disabled={busy || notConfigured} className="flex w-full items-center justify-center gap-3 rounded-md border border-white/15 bg-white/[0.025] px-4 py-3 text-xs font-semibold text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50">
                <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full bg-white text-[12px] font-bold text-[#4285f4]">G</span>
                Continue with Google
              </button>

              <button type="button" onClick={onContinueAsDemo} disabled={busy} className="mt-3 flex w-full items-center justify-center rounded-md border border-sky-300/25 bg-sky-300/[0.06] px-4 py-3 text-xs font-semibold text-sky-100 transition hover:border-sky-200/50 hover:bg-sky-300/[0.12] disabled:cursor-not-allowed disabled:opacity-50">
                Continue as Demo
              </button>
              <p className="mt-2 text-center text-[10px] leading-5 text-zinc-500">Demo data stays in this browser and is separate from signed-in accounts.</p>

              <p className="mt-6 text-center text-xs text-zinc-500">
                {mode === 'signin' ? 'New to BLACKSHIP?' : 'Already have an account?'}{' '}
                <button type="button" onClick={() => changeMode(mode === 'signin' ? 'signup' : 'signin')} disabled={busy} className="font-semibold text-zinc-200 underline decoration-white/25 underline-offset-4 transition hover:decoration-white disabled:opacity-50">
                  {mode === 'signin' ? 'Create account' : 'Sign in'}
                </button>
              </p>
              {mode === 'signup' && <p className="mt-3 text-center text-[10px] leading-5 text-zinc-600">We’ll email you a verification link before workspace access.</p>}
            </div>

            <a href="/" className="mx-auto mt-6 inline-flex w-fit items-center gap-2 text-xs text-zinc-500 transition hover:text-zinc-200">
              <ArrowLeft className="h-3.5 w-3.5" /> Return to the BLACKSHIP landing page
            </a>
          </section>
        </div>

        <footer className="border-t border-white/[0.07] pt-4 text-[9px] uppercase tracking-[0.2em] text-zinc-600">
          BLACKSHIP · AUTHENTICATED WORKSPACE
        </footer>
      </div>
    </main>
  );
};
