import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, Mic, Scale, ArrowRight, ChevronRight,
  CheckCircle2, Search, Globe, Menu, X, Sun, Moon
} from 'lucide-react';
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

/* ── Shared style tokens based on Light/Dark Mode ──────────────── */
const getT = (isDark: boolean) => ({
  accent:    '#F97316',
  muted:     isDark ? '#6B7280' : '#64748B',
  ultraMuted:isDark ? '#4B5563' : '#94A3B8',
  white:     isDark ? '#ffffff' : '#020617', // Main text (black in light mode)
  offWhite:  isDark ? '#d1d5db' : '#334155', // Secondary text
  bg:        isDark ? '#0f0f0f' : '#f8fafc',
  // Replaced pure black with the shades from the login page:
  cardBg:    isDark ? 'linear-gradient(160deg, #080808 0%, #0d0d0d 60%, #111111 100%)' : '#ffffff',
  caseBg:    isDark ? '#111111' : '#ffffff',
  cardBdr:   isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.06)',
  divider:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
  rowHover:  isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
  iconBg:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
  label:     { fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: isDark ? '#4B5563' : '#64748B', textTransform: 'uppercase' as const },
  sectionHd: { fontSize: 18, fontWeight: 700, color: isDark ? '#fff' : '#0f172a' },
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
    <div style={{ background: T.bg, minHeight: '100vh', color: T.white, fontFamily: 'Inter, system-ui, sans-serif', transition: 'background 0.3s ease, color 0.3s ease' }}>

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

            {/* Language pill */}
            <button style={{
              fontSize: 12, fontWeight: 600, color: T.muted,
              padding: '4px 10px', borderRadius: 99,
              border: `1px solid ${T.divider}`,
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Globe size={13} /> EN
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
          <div style={T.label}>स्वागत है &nbsp;·&nbsp; VICTIM PORTAL</div>

          {/* Main greeting */}
          <h1 style={{
            marginTop: 14, marginBottom: 0,
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800, letterSpacing: '-0.03em',
            color: T.white, lineHeight: 1.1,
          }}>
            {getGreeting()}, {firstName}.
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
            SECTION 4 — My Cases
        ─────────────────────────────────────────────────────── */}
        <section style={{ paddingBottom: 56 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={T.label}>मेरे मामले</div>
              <div style={{ ...T.sectionHd, marginTop: 4 }}>My Cases</div>
            </div>
            <Link to="/victim/tracker" style={{ fontSize: 13, color: T.accent, textDecoration: 'none', fontWeight: 500, paddingBottom: 2 }}>
              View all →
            </Link>
          </div>

          {CASES.length === 0 ? (
            <p style={{ fontSize: 14, color: T.muted }}>
              No FIRs filed yet.{' '}
              <Link to="/victim/statement" style={{ color: T.accent, textDecoration: 'none', fontWeight: 600 }}>
                Describe an incident →
              </Link>
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{
                background: T.caseBg, border: T.cardBdr,
                borderRadius: 12, overflow: 'hidden', minWidth: 580,
              }}>
                {/* Header row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2.2fr 1fr 36px 1.6fr 1fr 28px',
                  padding: '10px 20px',
                  borderBottom: T.divider,
                }}>
                  {['FIR No.', 'BNS Section', '', 'Status', 'Date', ''].map((h, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: isDark ? '#4B5563' : '#64748B', textTransform: 'uppercase' }}>{h}</div>
                  ))}
                </div>

                {/* Data rows */}
                {CASES.map((c, idx) => (
                  <div key={c.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2.2fr 1fr 36px 1.6fr 1fr 28px',
                      padding: '14px 20px', alignItems: 'center',
                      borderBottom: idx < CASES.length - 1 ? T.divider : 'none',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.offWhite, fontFamily: 'JetBrains Mono, monospace' }}>{c.id}</div>
                    <div style={{ fontSize: 13, color: T.muted }}>{c.bns}</div>
                    <div style={{ display: 'flex', alignItems: 'center' }}><UrgencyDot level={c.urgency} /></div>
                    <div style={{ fontSize: 13, color: T.muted }}>{c.status}</div>
                    <div style={{ fontSize: 12, color: T.ultraMuted }}>{c.date}</div>
                    <div style={{ color: T.ultraMuted, display: 'flex', alignItems: 'center' }}><ChevronRight size={14} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracking input bar */}
          <div style={{
            marginTop: 14, display: 'flex', alignItems: 'center',
            background: T.caseBg, border: T.cardBdr,
            borderRadius: 10, overflow: 'hidden', padding: '4px 4px 4px 14px',
          }}>
            <Search size={14} style={{ color: T.muted, flexShrink: 0 }} />
            <input
              value={trackId}
              onChange={e => setTrackId(e.target.value)}
              placeholder="Enter acknowledgment number to track"
              style={{
                flex: 1, background: 'transparent', border: 'none',
                outline: 'none', color: T.white, fontSize: 13,
                padding: '7px 10px',
              }}
            />
            <button style={{
              padding: '8px 18px', background: T.accent, color: '#fff',
              border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.02em', flexShrink: 0,
            }}>
              Track
            </button>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────
            SECTION 5 — Rights (60%) + Notifications (40%)
        ─────────────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-5" style={{ gap: 24 }}>

            {/* ── Left: Your Rights (3/5 = 60%) ─────────────── */}
            <div className="lg:col-span-3">
              <div style={T.label}>आपके अधिकार</div>
              <div style={{ ...T.sectionHd, marginTop: 4, marginBottom: 16 }}>Your Rights</div>

              <div style={{ background: T.caseBg, border: T.cardBdr, borderRadius: 12, overflow: 'hidden' }}>
                {RIGHTS.map((r, idx) => (
                  <div key={r.title} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px',
                    borderBottom: idx < RIGHTS.length - 1 ? T.divider : 'none',
                    background: r.highlight ? (isDark ? 'rgba(249,115,22,0.06)' : 'rgba(249,115,22,0.1)') : 'transparent',
                  }}>
                    <CheckCircle2
                      size={15}
                      style={{ color: r.highlight ? T.accent : '#22c55e', flexShrink: 0 }}
                      strokeWidth={2}
                    />
                    <div style={{ flex: 1, fontSize: 14, color: r.highlight ? T.accent : T.offWhite, fontWeight: r.highlight ? 600 : 400 }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: 11, color: T.ultraMuted, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {r.basis}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Notifications (2/5 = 40%) ─────────── */}
            <div className="lg:col-span-2">
              <div style={T.label}>सूचनाएं</div>
              <div style={{ ...T.sectionHd, marginTop: 4, marginBottom: 16 }}>Recent Notifications</div>

              <div style={{ background: T.caseBg, border: T.cardBdr, borderRadius: 12, overflow: 'hidden' }}>
                {NOTIFICATIONS.map((n, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '13px 16px',
                    borderBottom: idx < NOTIFICATIONS.length - 1 ? T.divider : 'none',
                  }}>
                    {/* Status dot */}
                    <span style={{
                      display: 'inline-block', width: 7, height: 7,
                      borderRadius: '50%', background: SMS_COLOR[n.status],
                      flexShrink: 0, marginTop: 5,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: T.offWhite, lineHeight: 1.45 }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: T.ultraMuted, marginTop: 3 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
    </div>
  );
};

export default LandingHome;