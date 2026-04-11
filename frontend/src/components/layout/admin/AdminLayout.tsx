import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Shield, LayoutDashboard, UserCheck, Building2, BookOpen, LogOut } from 'lucide-react';
import { useAuth } from '../../../features/shared/auth/useAuth';
import { adminService } from '../../../services/adminService';

const navCls = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors border-l-[3px]',
    isActive
      ? 'border-[#F97316] bg-[rgba(249,115,22,0.08)] text-white'
      : 'border-transparent text-[#D1D5DB] hover:text-white hover:bg-white/[0.04]',
  ].join(' ');

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const dashboard = await adminService.getDashboard();
        if (active) {
          setPendingApprovals(dashboard.stats.pendingOfficerActions);
        }
      } catch {
        if (active) {
          setPendingApprovals(null);
        }
      }
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 15000);

    const refreshListener = () => {
      void load();
    };

    window.addEventListener('admin:refresh', refreshListener);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('admin:refresh', refreshListener);
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-[#050505] text-white">
      <aside className="w-[280px] shrink-0 flex flex-col bg-[#0b0b0b] border-r border-white/[0.08]">
        <div className="relative overflow-hidden border-b border-white/[0.08] px-6 py-6">
          <div className="absolute inset-x-0 top-0 flex h-[3px]">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[#F97316]/15 flex items-center justify-center border border-[#F97316]/30">
              <Shield className="w-5 h-5 text-[#F97316]" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase leading-tight">
                Admin Panel
              </div>
              <div className="text-sm font-extrabold tracking-tight text-white mt-0.5">NyayaSetu</div>
              <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#F97316]/80 mt-1">
                MHA Operations
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-0.5">
          <NavLink to="/admin" end className={navCls}>
            <LayoutDashboard className="w-4 h-4 shrink-0" strokeWidth={2} />
            Overview
          </NavLink>
          <NavLink to="/admin/officers" className={navCls}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <UserCheck className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span className="truncate">Officer approvals</span>
              <span className="ml-auto flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" aria-hidden />
                <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                  {pendingApprovals ?? '—'}
                </span>
              </span>
            </div>
          </NavLink>
          <NavLink to="/admin/stations" className={navCls}>
            <Building2 className="w-4 h-4 shrink-0" strokeWidth={2} />
            Stations
          </NavLink>
          <NavLink to="/admin/bns" className={navCls}>
            <BookOpen className="w-4 h-4 shrink-0" strokeWidth={2} />
            BNS catalog
          </NavLink>
        </nav>

        <div className="p-4 border-t border-white/[0.08] space-y-2">
          {user?.name && (
            <p className="text-xs text-[#9CA3AF] px-2">
              Signed in as <span className="text-white font-semibold">{user.name}</span>
            </p>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-[#D1D5DB] border border-white/[0.12] rounded-sm hover:bg-white/[0.05] hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
        <header className="relative h-12 shrink-0 flex items-center justify-end px-8 border-b border-white/[0.08] bg-[#050505]">
          <div className="absolute inset-x-0 top-0 flex h-px opacity-70">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#D1D5DB] uppercase">
            Admin · MHA · Government of India
          </span>
        </header>
        <main className="flex-1 overflow-auto bg-[#050505]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
