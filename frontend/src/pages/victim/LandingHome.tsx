import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, Mic, Scale, ArrowRight, ChevronRight,
  CheckCircle2, Search, Globe, Menu, X, Sun, Moon, Bell
} from 'lucide-react';
import { WatermarkBackground } from '../../components/ui/WatermarkBackground';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
type Urgency   = 'critical' | 'high' | 'medium' | 'low';
type SMSStatus = 'sent' | 'failed' | 'pending';

interface Case         { id: string; bns: string; urgency: Urgency; status: string; date: string; }
interface Right        { title: string; basis: string; highlight?: boolean; }
interface Notification { status: SMSStatus; message: string; time: string; }
interface Action       { icon: React.ElementType; title: string; titleHi: string; desc: string; href: string; }
interface Stat         { value: string; label: string; labelHi: string; }

/* ══════════════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════════════ */
const CASES: Case[] = [
  { id: 'FIR/MH/2024/00123', bns: 'BNS § 115', urgency: 'high',   status: 'Under Investigation', date: '08 Apr 2024' },
  { id: 'FIR/MH/2024/00089', bns: 'BNS § 351', urgency: 'medium', status: 'FIR Registered',       date: '02 Apr 2024' },
  { id: 'FIR/MH/2024/00056', bns: 'BNS § 303', urgency: 'low',    status: 'Chargesheet Filed',    date: '28 Mar 2024' },
];

const RIGHTS: Right[] = [
  { title: 'Free FIR copy within 24 hours',  basis: 'BNSS § 173(2)'           },
  { title: 'Legal aid & representation',      basis: 'Legal Services Act, 1987' },
  { title: 'Zero FIR at any police station',  basis: 'BNSS § 173(1)'           },
  { title: 'Right to know investigation',     basis: 'BNSS § 193'              },
  { title: 'Compensation for harm caused',    basis: 'BNS § 25', highlight: true },
];

const NOTIFICATIONS: Notification[] = [
  { status: 'sent',    message: 'FIR/MH/2024/00123 has been registered successfully', time: '2h ago'  },
  { status: 'sent',    message: 'SI Kumar has been assigned to your case',             time: '5h ago'  },
  { status: 'failed',  message: 'SMS delivery failed — retry will happen shortly',     time: '8h ago'  },
  { status: 'sent',    message: 'Case status updated: Under Investigation',            time: '1d ago'  },
  { status: 'pending', message: 'Court date notification pending approval',            time: '2d ago'  },
];

const ACTIONS: Action[] = [
  { icon: FileText, title: 'Describe My Incident',  titleHi: 'घटना बताएं',       desc: 'AI maps it to the correct BNS section automatically', href: '/victim/statement' },
  { icon: Mic,      title: 'Prepare My Statement',  titleHi: 'बयान दर्ज करें',   desc: 'Voice or text input, in your preferred language',    href: '/victim/statement' },
  { icon: Scale,    title: 'Know My Rights',        titleHi: 'अधिकार जानें',    desc: 'BNSS rights, BNS §25 victim compensation details',    href: '/victim/rights'    },
];

const STATS: Stat[] = [
  { value: '1,247', label: 'FIRs Today',       labelHi: 'आज की FIR'          },
  { value: '358',   label: 'BNS Sections',      labelHi: 'BNS धाराएं'        },
  { value: '89',    label: 'Officers Online',   labelHi: 'अधिकारी ऑनलाइन'   },
  { value: '6',     label: 'Languages',         labelHi: 'भाषाएं'             },
];

const NAV_LINKS = [
  { label: 'Describe Incident', href: '/victim/statement' },
  { label: 'Prepare Statement', href: '/victim/statement' },
  { label: 'Know Rights',       href: '/victim/rights'   },
  { label: 'My Cases',          href: '/victim/tracker'  },
];

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */
const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
};

const URGENCY_COLOR: Record<Urgency, string> = {
  critical: '#ef4444',
  high:     '#ef4444',
  medium:   '#F97316',
  low:      '#eab308',
};

const SMS_COLOR: Record<SMSStatus, string> = {
  sent:    '#22c55e',
  failed:  '#ef4444',
  pending: '#6B7280',
};

/* ══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════════ */

/** 24-spoke Ashoka Chakra — used in nav logo */
const ChakraIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="5" />
    {Array.from({ length: 24 }, (_, i) => {
      const rad = ((i * 15 - 90) * Math.PI) / 180;
      return (
        <line key={i}
          x1={50 + 10 * Math.cos(rad)} y1={50 + 10 * Math.sin(rad)}
          x2={50 + 40 * Math.cos(rad)} y2={50 + 40 * Math.sin(rad)}
          stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      );
    })}
    <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="4" />
  </svg>
);

const UrgencyDot = ({ level }: { level: Urgency }) => (
  <span style={{
    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
    background: URGENCY_COLOR[level], flexShrink: 0,
  }} />
);

/* Custom SVGs for Social Icons since lucide-react might not include brand icons */
const TwitterIcon = ({ size = 24, style, ...props }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ size = 24, style, ...props }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ size = 24, style, fill, ...props }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke={fill ? "none" : "currentColor"} strokeWidth={fill ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round" style={style} {...props}>
    {fill ? (
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z" />
    ) : (
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    )}
  </svg>
);

/* ── Shared style tokens based on Light/Dark Mode ──────────────── */
const getT = (isDark: boolean) => ({
  accent:    '#FF9933',
  muted:     isDark ? '#5a7090' : '#64748B',
  ultraMuted:isDark ? '#3a5070' : '#94A3B8',
  white:     isDark ? '#ffffff' : '#020617', // Main text (black in light mode)
  offWhite:  isDark ? '#e8d8c0' : '#334155', // Secondary text
  bg:        isDark ? '#0f0f0f' : '#f8fafc',
  // Replaced pure black with the shades from the login page:
  cardBg:    isDark ? 'linear-gradient(160deg, #080808 0%, #0d0d0d 60%, #111111 100%)' : '#ffffff',
  caseBg:    isDark ? '#111111' : '#ffffff',
  cardBdr:   isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.06)',
  divider:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
  rowHover:  isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
  iconBg:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
  label:     { fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', color: isDark ? '#5a7090' : '#64748B', textTransform: 'uppercase' as const },
  sectionHd: { fontSize: 18, fontWeight: 800, color: isDark ? '#fff' : '#0f172a' },
});

/* ══════════════════════════════════════════════════════════════════
   LANDING HOME — NyayaSetu Victim Dashboard
══════════════════════════════════════════════════════════════════ */
export const LandingHome = () => {
  const user      = useAuthStore(s => s.user);
  const storeOut  = useAuthStore(s => s.logout);
  const navigate  = useNavigate();
  const location  = useLocation();
  const [trackId, setTrackId]     = useState('');
  const [mobileOpen, setMobile]   = useState(false);
  const [isDark, setIsDark]       = useState(true);

  // Sync with body background on mount/toggle
  useEffect(() => {
    document.body.style.background = isDark ? '#0f0f0f' : '#f8fafc';
    return () => { document.body.style.background = ''; };
  }, [isDark]);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const T = getT(isDark);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* swallow */ }
    storeOut();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.white, fontFamily: 'Inter, system-ui, sans-serif', transition: 'background 0.3s ease, color 0.3s ease', position: 'relative', overflowX: 'hidden' }}>

      {/* ══ BACKGROUND WATERMARK ═════════════════════════════════ */}
      <WatermarkBackground isDark={isDark} />

      {/* Everything else gets relative positioning so it sits above the watermark */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* ══ Tricolor stripe ══════════════════════════════════════ */}
        <div style={{ display: 'flex', height: 3, flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#fff'    }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* ══ NAVBAR ═══════════════════════════════════════════════ */}
      <nav style={{ borderBottom: T.divider, transition: 'border-color 0.3s ease' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 24px',
          height: 54, display: 'flex', alignItems: 'center', gap: 0,
        }}>
          {/* Logo */}
          <Link to="/victim" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', color: T.white, flexShrink: 0, marginRight: 40 }}>
            <span style={{ color: T.accent }}><ChakraIcon size={18} /></span>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: T.white }}>NyayaSetu</span>
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex" style={{ gap: 2, flex: 1, justifyContent: 'center' }}>
            {NAV_LINKS.map(({ label, href }) => {
              const active = location.pathname === href;
              return (
                <Link key={label} to={href} style={{
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? T.white : T.muted,
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: active ? T.iconBg : 'transparent',
                  transition: 'background 0.2s',
                }}>
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right controls */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Notifications Toggle */}
            <button 
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px', position: 'relative'
              }}
              title="Notifications"
            >
              <Bell size={17} style={{ color: T.muted }} />
              <span style={{
                position: 'absolute', top: 2, right: 3, width: 6, height: 6,
                background: '#ef4444', borderRadius: '50%',
                border: `1.5px solid ${T.bg}`
              }} />
            </button>

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDark(!isDark)}
              style={{
                fontSize: 12, fontWeight: 600, color: T.muted,
                padding: '4px', borderRadius: 99,
                border: 'none',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Avatar / logout */}
            <button
              onClick={handleLogout}
              title={`${user?.name ?? 'User'} — click to sign out`}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: T.iconBg,
                border: `1px solid ${T.divider}`,
                color: T.white, fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {(user?.name?.[0] ?? 'U').toUpperCase()}
            </button>

            {/* Mobile burger */}
            <button
              onClick={() => setMobile(v => !v)}
              className="flex md:hidden"
              style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden" style={{ borderTop: T.divider, padding: '8px 24px 16px' }}>
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} to={href} onClick={() => setMobile(false)} style={{
                display: 'block', padding: '11px 0', fontSize: 14,
                color: location.pathname === href ? T.white : T.muted,
                textDecoration: 'none',
                borderBottom: T.divider,
              }}>
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* ══ PAGE CONTENT ═════════════════════════════════════════ */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 96px' }}>

        {/* ────────────────────────────────────────────────────────
            SECTION 1 — Greeting
        ─────────────────────────────────────────────────────── */}
        <section style={{ paddingTop: 60, paddingBottom: 52 }}>
          {/* Micro-label */}
          <div style={{...T.label, color: '#FF9933', display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{ width: 24, height: 1, background: '#FF9933' }}></span>
            स्वागत है &nbsp;·&nbsp; WELCOME BACK
          </div>

          {/* Main greeting */}
          <h1 style={{
            marginTop: 14, marginBottom: 0,
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            fontWeight: 800, letterSpacing: '-0.02em',
            color: T.white, lineHeight: 1.1,
          }}>
            {getGreeting()},<br />{firstName}.
          </h1>

          {/* Subtitle */}
          <p style={{ marginTop: 10, fontSize: 15, color: T.muted, lineHeight: 1.6, maxWidth: 480 }}>
            Your case details, legal rights, and tools — all in one secure place.
          </p>

          {/* Text-links */}
          <div style={{ marginTop: 22, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <Link to="/victim/statement" style={{ fontSize: 14, fontWeight: 600, color: T.accent, textDecoration: 'none' }}>
              Describe an incident →
            </Link>
            <Link to="/victim/tracker" style={{ fontSize: 14, fontWeight: 600, color: T.accent, textDecoration: 'none' }}>
              Track your case →
            </Link>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────
            SECTION 2 — Stats row (no cards, just numbers)
        ─────────────────────────────────────────────────────── */}
        <section style={{ paddingBottom: 56 }}>
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {STATS.map(({ value, label, labelHi }, idx) => (
              <div key={label} style={{
                flex: 1, minWidth: 110,
                padding: '0 28px',
                textAlign: 'center',
                borderLeft: idx > 0 ? T.divider : 'none',
              }}>
                <div style={{
                  fontSize: 'clamp(28px, 3.5vw, 38px)',
                  fontWeight: 800, letterSpacing: '-0.03em',
                  color: T.white, lineHeight: 1,
                }}>
                  {value}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: T.muted, fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 11, color: T.ultraMuted, marginTop: 2 }}>{labelHi}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────
            SECTION 3 — Actions 2×2 grid
        ─────────────────────────────────────────────────────── */}
        <section style={{ paddingBottom: 56 }}>
          <div style={{ ...T.label, marginBottom: 20 }}>
            क्या चाहिए आपको? &nbsp;·&nbsp; What do you need?
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 12 }}>
            {ACTIONS.map(({ icon: Icon, title, titleHi, desc, href }) => (
              <Link key={title} to={href} style={{ textDecoration: 'none', display: 'block' }}>
                <div
                  style={{
                    background: T.cardBg, border: T.cardBdr,
                    borderRadius: 12, padding: '20px 20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    height: '100%',
                    transition: 'opacity 0.15s, transform 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <Icon size={20} style={{ color: T.accent }} strokeWidth={1.5} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.white, lineHeight: 1.3 }}>{title}</div>
                    <div style={{ fontSize: 11, color: T.ultraMuted, marginTop: 2 }}>{titleHi}</div>
                  </div>
                  <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.55, flex: 1 }}>{desc}</div>
                  <div style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    Open <ArrowRight size={11} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────
            SECTION 5 — Discover (Police Dept Cards)
        ─────────────────────────────────────────────────────── */}
        <section style={{ paddingBottom: 56 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={T.label}>भारतीय पुलिस</div>
            <div style={{ ...T.sectionHd, marginTop: 4, fontSize: 24 }}>The Indian Police</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top row: 3 cards */}
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16 }}>
              {[
                { img: '/images/flag.png', title: 'Overview' },
                { img: '/images/vehicle.png', title: 'Dedicated Service' },
                { img: '/images/heroes.png', title: 'Join the Force' },
              ].map(c => (
                <div key={c.title} style={{
                  position: 'relative', borderRadius: 12, overflow: 'hidden', height: 260,
                  cursor: 'pointer', transition: 'transform 0.2s', border: T.cardBdr
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <img src={c.img} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>

            {/* Bottom row: 2 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
              {[
                { img: '/images/community.png', title: 'Community & Trust' },
                { img: '/images/wellness.png', title: 'Center for Officer Wellness' },
              ].map(c => (
                <div key={c.title} style={{
                  position: 'relative', borderRadius: 12, overflow: 'hidden', height: 320,
                  cursor: 'pointer', transition: 'transform 0.2s', border: T.cardBdr
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                   <img src={c.img} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────
            SECTION 6 — Follow Us / Socials
        ─────────────────────────────────────────────────────── */}
        <section style={{ paddingTop: 24, paddingBottom: 56 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={T.label}>हमसे जुड़ें</div>
            <div style={{ ...T.sectionHd, marginTop: 4, fontSize: 24 }}>Follow Us</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: 16 }}>
            
            {/* Website Card */}
            <a href="https://bprd.nic.in" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ 
                background: T.caseBg, border: T.cardBdr, borderRadius: 12, display: 'flex', flexDirection: 'column', 
                height: '100%', minHeight: 300, cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' 
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                <img
                  src="/images/flag.png"
                  alt="Official portal — national emblem imagery"
                  width={400}
                  height={120}
                  style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block', flexShrink: 0 }}
                />
                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Globe size={32} style={{ color: T.accent }} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 8, textAlign: 'center' }}>BPR&D Official Portal</div>
                  <div style={{ fontSize: 14, color: T.muted, marginBottom: 24 }}>bprd.nic.in</div>
                  <div style={{ fontSize: 13, background: T.iconBg, padding: '8px 20px', borderRadius: 20, color: T.white, fontWeight: 600 }}>
                    Visit Website
                  </div>
                </div>
              </div>
            </a>

            {/* X (Twitter) Card */}
            <a href="https://twitter.com/BPRDIndia" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ 
                background: T.caseBg, border: T.cardBdr, borderRadius: 12, display: 'flex', flexDirection: 'column', 
                height: '100%', minHeight: 300, cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' 
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                <img
                  src="/images/heroes.png"
                  alt="Police force and public service"
                  width={400}
                  height={120}
                  style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block', flexShrink: 0 }}
                />
                <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <TwitterIcon size={24} style={{ color: T.white }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChakraIcon size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.white }}>BPR&D India</div>
                      <div style={{ fontSize: 13, color: T.muted }}>@BPRDIndia</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: T.offWhite, lineHeight: 1.5, marginBottom: 24, flex: 1 }}>
                    Official updates and announcements from Bureau of Police Research & Development are shared here.
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>
                    Follow BPR&D India on X
                  </div>
                </div>
              </div>
            </a>

            {/* Instagram Card */}
            <a href="https://instagram.com/bprdindia" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ 
                background: T.caseBg, border: T.cardBdr, borderRadius: 12, display: 'flex', flexDirection: 'column', 
                height: '100%', minHeight: 300, cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' 
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                <img
                  src="/images/community.png"
                  alt="Community and police outreach"
                  width={400}
                  height={120}
                  style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block', flexShrink: 0 }}
                />
                <div style={{ padding: 20, display: 'flex', justifyContent: 'center' }}>
                  <InstagramIcon size={24} style={{ color: T.white }} />
                </div>
                <div style={{ flex: 1, background: T.iconBg, margin: '0 20px', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.divider}` }}>
                  <InstagramIcon size={44} style={{ color: '#E1306C', marginBottom: 16 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>View this profile on Instagram</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 6, fontWeight: 500 }}>@bprdindia</div>
                  <div style={{ fontSize: 12, color: T.ultraMuted, marginTop: 2 }}>1,845 followers</div>
                </div>
                <div style={{ padding: 20, display: 'flex', gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 12, height: 12, border: `2px solid ${T.muted}`, borderRadius: '50%' }}></div>
                  </div>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 12, height: 4, background: T.muted, borderRadius: 2 }}></div>
                  </div>
                </div>
              </div>
            </a>

            {/* Facebook Card */}
             <a href="https://facebook.com/officialBPRDIndia" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ 
                background: T.caseBg, border: T.cardBdr, borderRadius: 12, display: 'flex', flexDirection: 'column', 
                height: '100%', minHeight: 300, cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' 
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                <img
                  src="/images/vehicle.png"
                  alt="Police vehicles and dedicated service"
                  width={400}
                  height={120}
                  style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block', flexShrink: 0 }}
                />
                <div style={{ padding: '16px 20px', borderBottom: T.divider, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FacebookIcon size={18} fill="white" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>BPR&D</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>2,726 likes</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, background: T.iconBg, padding: '6px 10px', borderRadius: 6, color: T.white }}>Follow Page</div>
                </div>
                <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 14, color: T.offWhite, lineHeight: 1.5, marginBottom: 20 }}>
                    Welcome to the official Facebook page of Bureau of Police Research & Development (BPR&D).
                  </div>
                  <div style={{ height: 110, background: T.iconBg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.divider}` }}>
                    <FacebookIcon size={36} style={{ color: T.muted, opacity: 0.4 }} />
                  </div>
                </div>
              </div>
            </a>

          </div>
        </section>
      </main>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer style={{ borderTop: T.divider, padding: '18px 24px', transition: 'border-color 0.3s ease' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <span style={{ fontSize: 11, color: isDark ? '#475569' : '#94A3B8' }}>
            © {new Date().getFullYear()} NyayaSetu · Ministry of Home Affairs, Govt. of India · NIC
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: '0.15em' }}>
            सत्यमेव जयते
          </span>
        </div>
      </footer>
      </div> {/* End of zIndex wrapper */}
    </div>
  );
};

export default LandingHome;