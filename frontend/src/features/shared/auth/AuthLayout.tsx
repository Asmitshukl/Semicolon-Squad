import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FileText, BadgeCheck, Users } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════
   ASHOKA CHAKRA — 24-spoke wheel (from Indian national flag)
══════════════════════════════════════════════════════════════════ */
const AshokaChakra = () => {
  const CX = 200, CY = 200;
  const R_OUTER = 185;
  const R_SPOKE_OUTER = 168;
  const R_SPOKE_INNER = 28;
  const R_HUB = 22;
  const SPOKES = 24;

  const spokes = Array.from({ length: SPOKES }, (_, i) => {
    const angleDeg = (i * 360) / SPOKES - 90; // start from top
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x1: CX + R_SPOKE_INNER * Math.cos(rad),
      y1: CY + R_SPOKE_INNER * Math.sin(rad),
      x2: CX + R_SPOKE_OUTER * Math.cos(rad),
      y2: CY + R_SPOKE_OUTER * Math.sin(rad),
    };
  });

  return (
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"
         aria-hidden="true" className="w-full h-full">
      {/* Outer ring — double stroke for depth */}
      <circle cx={CX} cy={CY} r={R_OUTER}     stroke="white" strokeWidth="10" />
      <circle cx={CX} cy={CY} r={R_OUTER - 14} stroke="white" strokeWidth="2" strokeDasharray="2 6" />

      {/* 24 Spokes */}
      {spokes.map(({ x1, y1, x2, y2 }, i) => (
        <line key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      ))}

      {/* Central hub */}
      <circle cx={CX} cy={CY} r={R_HUB} stroke="white" strokeWidth="5"
              fill="white" fillOpacity="0.1" />
      <circle cx={CX} cy={CY} r={10}    stroke="white" strokeWidth="2"
              fill="white" fillOpacity="0.2" />
    </svg>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SCALES OF JUSTICE — Taraju overlay
══════════════════════════════════════════════════════════════════ */
const ScalesOfJustice = () => (
  <svg viewBox="0 0 420 480" fill="none" xmlns="http://www.w3.org/2000/svg"
       aria-hidden="true" className="w-full h-full">

    {/* Top finial */}
    <circle cx="210" cy="36" r="10" stroke="white" strokeWidth="2" />
    <line x1="210" y1="46" x2="210" y2="64" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

    {/* Shaft */}
    <rect x="205" y="64" width="10" height="310" rx="3" stroke="white" strokeWidth="1.5" />

    {/* Shaft rings */}
    <rect x="198" y="190" width="24" height="7" rx="2" stroke="white" strokeWidth="1.2" />
    <rect x="198" y="260" width="24" height="7" rx="2" stroke="white" strokeWidth="1.2" />

    {/* Central pivot sphere */}
    <circle cx="210" cy="106" r="18" stroke="white" strokeWidth="2.5" fill="white" fillOpacity="0.05" />
    <circle cx="210" cy="106" r="7"  stroke="white" strokeWidth="1.5" />

    {/* Balance arm — slightly tilted (right is heavier) */}
    <path d="M 30 100 Q 120 96 210 100 Q 300 104 390 108"
          stroke="white" strokeWidth="4" strokeLinecap="round" />

    {/* Arm end balls */}
    <circle cx="30"  cy="100" r="7" stroke="white" strokeWidth="2" fill="white" fillOpacity="0.08" />
    <circle cx="390" cy="108" r="7" stroke="white" strokeWidth="2" fill="white" fillOpacity="0.08" />

    {/* Left chain */}
    <line x1="30" y1="107" x2="30" y2="278"
          stroke="white" strokeWidth="1.8" strokeDasharray="6 5" strokeLinecap="round" />

    {/* Right chain */}
    <line x1="390" y1="115" x2="390" y2="296"
          stroke="white" strokeWidth="1.8" strokeDasharray="6 5" strokeLinecap="round" />

    {/* Left pan */}
    <path d="M -10 278 Q 30 300 70 278" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="-10" y1="272" x2="-10" y2="278" stroke="white" strokeWidth="2" />
    <line x1="70"  y1="272" x2="70"  y2="278" stroke="white" strokeWidth="2" />

    {/* Right pan (lower — heavier side) */}
    <path d="M 348 296 Q 390 318 432 296" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="348" y1="290" x2="348" y2="296" stroke="white" strokeWidth="2" />
    <line x1="432" y1="290" x2="432" y2="296" stroke="white" strokeWidth="2" />

    {/* Base steps */}
    <rect x="184" y="374" width="52"  height="11" rx="3" stroke="white" strokeWidth="1.8" />
    <rect x="164" y="385" width="92"  height="11" rx="3" stroke="white" strokeWidth="1.5" />
    <rect x="138" y="396" width="144" height="13" rx="4" stroke="white" strokeWidth="1.2" />
    <ellipse cx="210" cy="414" rx="114" ry="9" stroke="white" strokeWidth="1" />
  </svg>
);

/* ── Stat widget ─────────────────────────────────────────────────── */
const Stat = ({
  value, label, icon: Icon,
}: { value: string; label: string; icon: React.ElementType }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
  }} className="flex items-center gap-3 p-3.5 rounded-xl backdrop-blur-sm">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
         style={{ background: 'rgba(255,153,51,0.15)' }}>
      <Icon className="w-4 h-4" style={{ color: '#FF9933' }} />
    </div>
    <div>
      <div className="text-white font-bold text-base leading-none">{value}</div>
      <div className="text-[11px] mt-0.5" style={{ color: '#5a6e8a' }}>{label}</div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   AuthLayout — Indian Government / Judiciary Split Layout
══════════════════════════════════════════════════════════════════ */
interface AuthLayoutProps {
  children:     ReactNode;
  backTo?:      string;
  backLabel?:   string;
  formMaxWidth?: string;
}

export const AuthLayout = ({
  children,
  backTo     = '/',
  backLabel  = '← Home',
  formMaxWidth = 'max-w-md',
}: AuthLayoutProps) => (
  <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row overflow-hidden font-sans">

    {/* ════════════════════════════════════════════════════════════
        LEFT PANEL — Indian Judiciary Branding
    ════════════════════════════════════════════════════════════ */}
    <div
      className="hidden lg:flex lg:w-[46%] relative flex-col flex-shrink-0 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #080808 0%, #0d0d0d 60%, #111111 100%)' }}
    >

      {/* ── Ashoka Chakra — large watermark ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
           style={{ opacity: 0.09 }}>
        <div style={{ width: '88%', height: '88%' }}>
          <AshokaChakra />
        </div>
      </div>

      {/* ── Scales of Justice — smaller overlay ── */}
      <div
        className="absolute pointer-events-none select-none"
        style={{ bottom: '6%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '50%', opacity: 0.07 }}
      >
        <ScalesOfJustice />
      </div>

      {/* ── Saffron radial glow (top-left) ── */}
      <div className="absolute pointer-events-none" style={{
        top: '-10%', left: '-10%',
        width: '60%', height: '60%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,153,51,0.12) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />

      {/* ── India Green glow (bottom-right) ── */}
      <div className="absolute pointer-events-none" style={{
        bottom: '-10%', right: '-10%',
        width: '50%', height: '50%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(19,136,8,0.1) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />

      {/* ── Tricolor top stripe ── */}
      <div className="absolute top-0 left-0 right-0 flex" style={{ height: '4px' }}>
        <div className="flex-1" style={{ background: '#FF9933' }} />
        <div className="flex-1" style={{ background: '#e8dfc8' }} />
        <div className="flex-1" style={{ background: '#138808' }} />
      </div>

      {/* ── Decorative corner triangles ── */}
      <svg className="absolute top-0 right-0 opacity-[0.07]" width="200" height="200" viewBox="0 0 200 200">
        <polygon points="200,0 0,0 200,200" fill="white" />
      </svg>
      <svg className="absolute bottom-0 left-0 opacity-[0.06]" width="160" height="160" viewBox="0 0 160 160">
        <polygon points="0,160 160,160 0,0" fill="white" />
      </svg>

      {/* ── Left panel content ── */}
      <div className="relative z-10 flex flex-col h-full p-10 pt-8">

        {/* Government tag */}
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4"
             style={{ color: 'rgba(255,153,51,0.6)' }}>
          भारत सरकार &nbsp;·&nbsp; GOVERNMENT OF INDIA
        </div>

        {/* Logo + App Name */}
        <div className="flex items-center gap-3.5">
          {/* Ashoka Chakra mini logo */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
               style={{
                 background: 'linear-gradient(135deg, #FF9933 0%, #E07800 100%)',
                 boxShadow: '0 4px 20px rgba(255,153,51,0.4)',
               }}>
            <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
              {/* mini Ashoka Chakra */}
              <circle cx="20" cy="20" r="17" stroke="white" strokeWidth="2.5" />
              {Array.from({ length: 24 }, (_, i) => {
                const rad = (((i * 15) - 90) * Math.PI) / 180;
                return (
                  <line key={i}
                    x1={20 + 5 * Math.cos(rad)} y1={20 + 5 * Math.sin(rad)}
                    x2={20 + 15 * Math.cos(rad)} y2={20 + 15 * Math.sin(rad)}
                    stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                );
              })}
              <circle cx="20" cy="20" r="4" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <div className="text-white font-extrabold text-xl leading-none tracking-tight">
              FIR Platform
            </div>
            <div className="text-xs mt-0.5 font-medium" style={{ color: 'rgba(255,153,51,0.7)' }}>
              Digital Justice System
            </div>
          </div>
        </div>

        {/* Main text block */}
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-[1.9rem] font-extrabold leading-tight text-white mt-2">
            न्याय आपकी<br />
            <span style={{
              background: 'linear-gradient(90deg, #FF9933 0%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              उंगलियों पर।
            </span>
          </h2>
          <p className="text-sm mt-1.5 leading-relaxed max-w-[280px]"
             style={{ color: '#5a7090' }}>
            Justice at your fingertips — file FIRs, track case status,
            access victim rights &amp; connect with the nearest police station.
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mt-8">
            <Stat value="1,247" label="FIRs Filed Today" icon={FileText}  />
            <Stat value="89"    label="Officers Online"  icon={BadgeCheck} />
            <Stat value="358"   label="BNS Sections"     icon={FileText}   />
            <Stat value="6"     label="Languages"         icon={Users}      />
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {['AI Classification', 'Voice Input', 'Station Finder', 'SMS Alerts'].map(f => (
              <span key={f} className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#6a809a' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer — Satyameva Jayate */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs" style={{ color: '#3a5070' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-slow inline-block" />
            End-to-end encrypted · MHA, Government of India
          </div>
          <div className="text-xs font-semibold tracking-widest" style={{ color: 'rgba(255,153,51,0.4)' }}>
            सत्यमेव जयते
          </div>
        </div>
      </div>
    </div>

    {/* ════════════════════════════════════════════════════════════
        RIGHT PANEL — Auth Form
    ════════════════════════════════════════════════════════════ */}
    <div
      className="flex-1 flex flex-col overflow-y-auto relative"
      style={{ background: '#0f0f0f' }}
    >
      {/* Tricolor top stripe (visible on mobile too) */}
      <div className="flex shrink-0" style={{ height: '3px' }}>
        <div className="flex-1" style={{ background: '#FF9933' }} />
        <div className="flex-1" style={{ background: '#e8dfc8' }} />
        <div className="flex-1" style={{ background: '#138808' }} />
      </div>

      {/* Subtle saffron corner glow on right panel */}
      <div className="absolute top-0 right-0 pointer-events-none" style={{
        width: '40%', height: '40%',
        background: 'radial-gradient(circle at top right, rgba(255,153,51,0.05) 0%, transparent 70%)',
      }} />

      {/* Breadcrumb */}
      <div className="px-8 pt-5 pb-0 shrink-0">
        <Link to={backTo}
              className="text-sm transition-colors"
              style={{ color: '#3a5070' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6a90b0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a5070')}>
          {backLabel}
        </Link>
      </div>

      {/* Centered form area */}
      <div className={`relative z-10 flex-1 flex flex-col justify-center px-8 sm:px-14 py-10 w-full ${formMaxWidth} mx-auto`}>
        {children}
      </div>

      {/* Footer */}
      <p className="text-center text-xs py-4 shrink-0" style={{ color: '#253348' }}>
        © {new Date().getFullYear()} FIR Platform · Ministry of Home Affairs · NIC
      </p>
    </div>
  </div>
);
