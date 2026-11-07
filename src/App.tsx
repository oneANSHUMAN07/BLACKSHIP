import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { AboutSection } from './components/AboutSection';
import { CtaSection } from './components/CtaSection';
import { Footer } from './components/Footer';
import { WorkspaceApp } from './components/WorkspaceApp';
import { LoginPage } from './components/LoginPage';
import { auth, isFirebaseConfigured } from './utils/firebase';

const DEMO_SESSION_KEY = 'blackship-demo-session';

export default function App() {
  const path = window.location.pathname;
  const [user, setUser] = useState<User | null>(null);
  const [demoSession, setDemoSession] = useState(() => window.sessionStorage.getItem(DEMO_SESSION_KEY) === 'active');
  const [authReady, setAuthReady] = useState(!auth);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setAuthReady(true);
      return;
    }
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (path === '/app' && authReady && !demoSession && (!isFirebaseConfigured || !user)) {
      window.location.replace('/login');
    }
  }, [path, authReady, user, demoSession]);

  if (path === '/app') {
    if (demoSession) return <WorkspaceApp user={{ uid: 'demo', email: 'Demo workspace', displayName: 'Demo' }} demo />;
    if (authReady && user && isFirebaseConfigured) return <WorkspaceApp user={user} />;
    return <main className="grid min-h-screen place-items-center bg-[#060608] text-sm text-zinc-400">Checking your BLACKSHIP sign-in…</main>;
  }
  if (window.location.pathname === '/login') return <LoginPage onContinueAsDemo={() => {
    window.sessionStorage.setItem(DEMO_SESSION_KEY, 'active');
    setDemoSession(true);
    window.location.assign('/app');
  }} />;

  const scrollToFeatures = () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  const scrollToHowItWorks = () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-[#060608] text-[#f4f4f5] flex flex-col selection:bg-white selection:text-black">
      <Navbar onExploreClick={scrollToFeatures} onHowItWorksClick={scrollToHowItWorks} onGetStartedClick={() => window.location.assign('/login')} />
      <main className="flex-1">
        <Hero onExploreClick={scrollToFeatures} onSeeHowItWorksClick={scrollToHowItWorks} />
        <TrustStrip />
        <Features />
        <HowItWorks />
        <AboutSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
