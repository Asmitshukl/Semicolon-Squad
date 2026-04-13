import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { HeroSection } from '../components/ui/HeroSection';
import { StatsBar } from '../components/ui/StatsBar';

/* ── Inline 24-spoke mini Chakra for the nav logo ─────────────── */
const ChakraIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="5" />
    {Array.from({ length: 24 }, (_, i) => {
      const rad = ((i * 15 - 90) * Math.PI) / 180;
      return (
        <line
          key={i}
          x1={50 + 10 * Math.cos(rad)} y1={50 + 10 * Math.sin(rad)}
          x2={50 + 40 * Math.cos(rad)} y2={50 + 40 * Math.sin(rad)}
          stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        />
      );
    })}
    <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="4" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   PUBLIC LANDING PAGE
══════════════════════════════════════════════════════════════ */
export const PublicLandingPage: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background: '#12100E',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Ambient glow blobs ─────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
      >
        {/* Top-right blob — saffron/amber */}
        <div
          style={{
            position: 'absolute',
            top: '-15vh',
            right: '-10vw',
            width: '55vw',
            height: '55vw',
            background:
              'radial-gradient(circle, rgba(210,112,26,0.18) 0%, rgba(210,112,26,0.04) 55%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(2px)',
          }}
        />
        {/* Bottom-left blob — India green */}
        <div
          style={{
            position: 'absolute',
            bottom: '-20vh',
            left: '-10vw',
            width: '40vw',
            height: '40vw',
            background:
              'radial-gradient(circle, rgba(19,136,8,0.08) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* ── Content layer (above blobs) ────────────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── Tricolor top stripe ─────────────────────────────── */}
        <div className="flex h-[3px] flex-shrink-0">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-[#ffffff]" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        {/* ══ NAVBAR ═════════════════════════════════════════════ */}
        <header
          className="flex-shrink-0 border-b border-white/[0.06] backdrop-blur-sm"
          style={{ background: 'rgba(18,16,14,0.85)' }}
        >
          <div className="max-w-7xl mx-auto px-6 h-[64px] flex items-center">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 text-[#FF9933] no-underline mr-10"
              aria-label="NyayaSetu home"
            >
              <ChakraIcon size={20} />
              <span
                className="font-extrabold text-[15px] tracking-[-0.02em]"
                style={{ color: '#FFFFFF' }}
              >
                Nyaya<span style={{ color: '#FF9933' }}>Setu</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 flex-1">
              {[
                { label: 'Features',  href: '#features' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'BNS 2024',  href: '#bns' },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="text-[13px] font-medium px-4 py-2 rounded-md transition-colors"
                  style={{ color: '#8A857D', textDecoration: 'none' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#E5E5E0')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = '#8A857D')}
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* Right CTA group */}
            <div className="ml-auto flex items-center gap-3">
              <Link
                to="/login"
                className="hidden md:inline-flex text-[13px] font-semibold px-5 py-2 rounded-sm border border-white/10 transition-colors"
                style={{ color: '#C5BEB5', textDecoration: 'none', background: 'rgba(255,255,255,0.04)' }}
              >
                Sign In
              </Link>
              <Link
                to="/register/victim"
                className="inline-flex text-[13px] font-black px-5 py-2 rounded-sm tracking-wider uppercase transition-opacity hover:opacity-90"
                style={{
                  background: 'linear-gradient(to bottom, #FFEA7E, #F2A63B, #D2701A)',
                  color: '#12100E',
                  textDecoration: 'none',
                }}
              >
                Get Started
              </Link>
              {/* Burger */}
              <button
                className="md:hidden p-1.5 rounded-md transition-colors"
                style={{ color: '#8A857D', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setMobileOpen(v => !v)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div
              className="md:hidden border-t border-white/[0.06] px-6 py-4 flex flex-col gap-2"
              style={{ background: 'rgba(18,16,14,0.95)' }}
            >
              {[
                { label: 'Features',     href: '#features'   },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'BNS 2024',     href: '#bns'        },
                { label: 'Sign In',      href: '/login'      },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[14px] font-medium py-2.5 border-b border-white/[0.05]"
                  style={{ color: '#A39D95', textDecoration: 'none' }}
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </header>

        {/* ══ MAIN ═══════════════════════════════════════════════ */}
        <main className="flex-1">
          {/* Hero */}
          <HeroSection />

          {/* Stats bar */}
          <StatsBar />

          {/* ── Features section ───────────────────────────────── */}
          <section id="features" className="py-24 px-8">
            <div className="max-w-7xl mx-auto">
              {/* Section header */}
              <div className="mb-14 max-w-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-[2px] w-5 bg-gradient-to-r from-[#FFEA7E] to-[#D2701A]" />
                  <span className="text-[#A39D95] text-[10px] font-bold tracking-[0.25em] uppercase">
                    Features
                  </span>
                </div>
                <h2 className="text-[40px] font-bold leading-[1.15] text-white tracking-tight">
                  Everything you need,<br />
                  <span className="bg-gradient-to-b from-[#FFE373] via-[#F2A33A] to-[#D6711C] text-transparent bg-clip-text">
                    in one platform.
                  </span>
                </h2>
              </div>

              {/* Feature cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    icon: '⚖️',
                    title: 'AI-Powered BNS Mapping',
                    desc: 'Describe the incident in plain language. Our AI maps it to the correct BNS 2024 section automatically.',
                    tag: 'AI',
                  },
                  {
                    icon: '🎙️',
                    title: 'Voice Statement Recording',
                    desc: 'Record your statement by voice in 6 regional languages. Transcription happens live.',
                    tag: 'Voice',
                  },
                  {
                    icon: '📄',
                    title: 'Auto-Generated FIR Draft',
                    desc: 'Download a ready-to-submit FIR PDF, pre-filled with all legally required fields.',
                    tag: 'Documents',
                  },
                  {
                    icon: '🛡️',
                    title: 'Know Your Rights',
                    desc: 'BNSS §173 free copy rights, Zero FIR provisions, BNS §25 compensation — explained in plain Hindi & English.',
                    tag: 'Rights',
                  },
                  {
                    icon: '📍',
                    title: 'Nearest Police Station',
                    desc: 'Find the closest station by GPS, check jurisdiction, and initiate contact before arriving.',
                    tag: 'Maps',
                  },
                  {
                    icon: '🔔',
                    title: 'Case Status Tracking',
                    desc: 'Real-time updates as your case progresses — from FIR filed to chargesheet, all in one timeline.',
                    tag: 'Tracker',
                  },
                ].map(({ icon, title, desc, tag }) => (
                  <div
                    key={title}
                    className="group relative rounded-sm border border-white/[0.07] p-6 transition-all duration-300"
                    style={{
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(210,112,26,0.35)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-[28px] leading-none">{icon}</span>
                      <span
                        className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-[3px]"
                        style={{ background: 'rgba(210,112,26,0.12)', color: '#F2A33A' }}
                      >
                        {tag}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-[16px] mb-2 leading-tight">{title}</h3>
                    <p className="text-[#7A756E] text-[13px] leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── How it works ────────────────────────────────────── */}
          <section id="how-it-works" className="py-24 px-8 border-t border-white/[0.04]">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <div className="flex items-center justify-center gap-3 mb-5">
                  <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#D2701A]" />
                  <span className="text-[#A39D95] text-[10px] font-bold tracking-[0.25em] uppercase">
                    How It Works
                  </span>
                  <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#D2701A]" />
                </div>
                <h2 className="text-[36px] font-bold text-white tracking-tight">
                  From incident to FIR in{' '}
                  <span className="bg-gradient-to-b from-[#FFE373] via-[#F2A33A] to-[#D6711C] text-transparent bg-clip-text">
                    minutes.
                  </span>
                </h2>
              </div>

              <div className="relative">
                {/* Connecting line */}
                <div
                  className="hidden md:block absolute top-[28px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-[1px]"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(210,112,26,0.4), transparent)' }}
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[
                    { step: '01', title: 'Describe', body: 'Type or speak your incident in any language.' },
                    { step: '02', title: 'AI Classifies', body: 'We map it to the right BNS section instantly.' },
                    { step: '03', title: 'Review & Sign', body: 'Review the pre-filled FIR draft and confirm.' },
                    { step: '04', title: 'Submit', body: 'Download PDF or send directly to the station.' },
                  ].map(({ step, title, body }) => (
                    <div key={step} className="flex flex-col items-center text-center">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-[13px] font-black mb-5 border border-white/10 relative z-10"
                        style={{
                          background: 'linear-gradient(145deg, rgba(210,112,26,0.2), rgba(210,112,26,0.06))',
                          color: '#F2A33A',
                        }}
                      >
                        {step}
                      </div>
                      <h3 className="text-white font-bold text-[15px] mb-2">{title}</h3>
                      <p className="text-[#7A756E] text-[13px] leading-relaxed max-w-[180px]">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── BNS 2024 compliance callout ──────────────────────── */}
          <section id="bns" className="py-20 px-8">
            <div className="max-w-7xl mx-auto">
              <div
                className="relative rounded-sm overflow-hidden px-10 py-14 md:px-16 border border-white/[0.07]"
                style={{
                  background: 'linear-gradient(135deg, rgba(210,112,26,0.10) 0%, rgba(18,16,14,1) 60%)',
                }}
              >
                {/* Decorative large chakra watermark */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 opacity-[0.04]"
                >
                  <svg width="340" height="340" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="46" stroke="white" strokeWidth="3" />
                    {Array.from({ length: 24 }, (_, i) => {
                      const rad = ((i * 15 - 90) * Math.PI) / 180;
                      return (
                        <line key={i}
                          x1={50 + 10 * Math.cos(rad)} y1={50 + 10 * Math.sin(rad)}
                          x2={50 + 40 * Math.cos(rad)} y2={50 + 40 * Math.sin(rad)}
                          stroke="white" strokeWidth="2" strokeLinecap="round"
                        />
                      );
                    })}
                    <circle cx="50" cy="50" r="10" stroke="white" strokeWidth="3" />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-10">
                  <div className="flex-1">
                    <div className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase px-3 py-1.5 rounded-[3px] mb-5"
                      style={{ background: 'rgba(210,112,26,0.15)', color: '#F2A33A' }}
                    >
                      BNS 2024 Compliant
                    </div>
                    <h2 className="text-[32px] font-bold text-white leading-tight mb-4">
                      Built on Bharatiya<br />Nyaya Sanhita 2024
                    </h2>
                    <p className="text-[#8A857D] text-[15px] leading-relaxed max-w-md">
                      Every feature is built and verified against the Bharatiya Nyaya Sanhita 2024, 
                      Bharatiya Nagarik Suraksha Sanhita, and Bharatiya Sakshya Adhiniyam — 
                      replacing the IPC, CrPC, and Indian Evidence Act.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 min-w-[260px]">
                    {[
                      'BNS 2024 — 358 sections mapped',
                      'BNSS — Victim rights & Zero FIR',
                      'BSA — Digital evidence support',
                      'Legal aid & compensation (§ 25)',
                    ].map(item => (
                      <div key={item} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(19,136,8,0.2)', border: '1px solid rgba(19,136,8,0.4)' }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        </div>
                        <span className="text-[#B5AFA6] text-[13px]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Final CTA ───────────────────────────────────────── */}
          <section className="py-24 px-8 border-t border-white/[0.04]">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-[40px] md:text-[52px] font-bold text-white leading-[1.1] mb-6 tracking-tight">
                न्याय आपका अधिकार है।
              </h2>
              <p className="text-[#8A857D] text-[16px] leading-relaxed mb-10">
                Justice is your right. Start your complaint today —<br />
                free, encrypted, and legally compliant.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/register/victim"
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-sm font-black text-sm tracking-widest uppercase transition-opacity hover:opacity-90"
                  style={{
                    background: 'linear-gradient(to bottom, #FFEA7E, #F2A63B, #D2701A)',
                    color: '#12100E',
                    textDecoration: 'none',
                  }}
                >
                  Register as Victim →
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-sm font-black text-sm tracking-widest uppercase border border-white/10 transition-colors hover:bg-white/5"
                  style={{ color: '#E5E5E0', textDecoration: 'none' }}
                >
                  Officer Login
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* ══ FOOTER ═══════════════════════════════════════════════ */}
        <footer className="border-t border-white/[0.06] px-8 py-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span style={{ color: '#FF9933' }}><ChakraIcon size={16} /></span>
              <span className="text-white font-extrabold text-[14px] tracking-[-0.02em]">
                Nyaya<span style={{ color: '#FF9933' }}>Setu</span>
              </span>
            </div>
            <p className="text-[#47443F] text-[11px] text-center">
              © {new Date().getFullYear()} NyayaSetu · Ministry of Home Affairs, Govt. of India · NIC
            </p>
            <span className="text-[12px] font-bold tracking-[0.15em]" style={{ color: '#FF9933' }}>
              सत्यमेव जयते
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PublicLandingPage;
