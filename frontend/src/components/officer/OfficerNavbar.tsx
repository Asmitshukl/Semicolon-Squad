import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { ChakraMini } from './ChakraMini';
import { useAuth } from '../../features/shared/auth/useAuth';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'text-sm font-semibold whitespace-nowrap border-b-2 pb-2 -mb-[1px] transition-colors',
    isActive ? 'text-white border-[#F97316]' : 'text-[#6B7280] border-transparent hover:text-[#D1D5DB]',
  ].join(' ');

const navItems = [
  { to: '/officer', end: true, label: 'Dashboard' },
  { to: '/officer/fir', label: 'FIR Inbox' },
  { to: '/officer/bns', label: 'BNS Translator' },
  { to: '/officer/voice', label: 'Voice Statements' },
] as const;

type OfficerNavItem = {
  to: (typeof navItems)[number]['to'];
  label: (typeof navItems)[number]['label'];
  end?: boolean;
};

export const OfficerNavbar = () => {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-white/[0.07] bg-transparent">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className="flex h-14 md:h-[52px] items-center gap-4">
          <Link to="/officer" className="flex items-center gap-2 shrink-0 min-w-0" onClick={() => setOpen(false)}>
            <ChakraMini className="w-7 h-7 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-extrabold tracking-tight text-white truncate">NyayaSetu</div>
              <div className="text-[10px] font-bold tracking-[0.15em] text-[#6B7280] uppercase truncate">
                Officer Portal
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex flex-1 justify-center items-end gap-8 min-w-0 px-4 border-b border-white/[0.07] self-stretch">
            {navItems.map((item: OfficerNavItem) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 ml-auto shrink-0">
            <span className="hidden sm:inline font-mono text-xs font-bold text-[#F97316] tabular-nums">DL-SI-4821</span>
            <Link
              to="/officer/profile"
              className="w-8 h-8 rounded-sm bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-xs font-extrabold text-white hover:bg-white/[0.12]"
              title="Profile"
            >
              RK
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="p-2 text-[#6B7280] hover:text-white rounded-sm border border-transparent hover:border-white/[0.08]"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              className="lg:hidden p-2 text-[#6B7280] hover:text-white"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="lg:hidden flex flex-col gap-1 py-3 border-t border-white/[0.07]">
            {navItems.map((item: OfficerNavItem) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-sm text-sm font-semibold ${isActive ? 'bg-[#F97316]/10 text-white' : 'text-[#9CA3AF]'}`
                }
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};
