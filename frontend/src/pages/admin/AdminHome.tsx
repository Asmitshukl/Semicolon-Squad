import { useEffect, useState } from 'react';
import { adminService, type AdminDashboardResponse } from '../../services/adminService';

export const AdminHome = () => {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await adminService.getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin dashboard.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = dashboard?.stats;

  return (
    <div className="p-8 lg:p-10 max-w-[1480px] text-white">
      <div className="mb-10">
        <p className="text-[11px] font-bold tracking-[0.22em] text-[#9CA3AF] uppercase mb-2">Command overview</p>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">National operations</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#D1D5DB]">
          Live command dashboard for officer approvals, station coverage, and FIR intake across the platform.
        </p>
      </div>

      {error && <div className="mb-6 text-red-300 text-sm">{error}</div>}

      <div className="relative mb-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="absolute inset-x-0 top-0 flex h-[3px]">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 px-6 py-8 lg:px-8 lg:py-10">
          {[
            ['Pending officer actions', stats?.pendingOfficerActions ?? '—'],
            ['Police stations (synced)', stats?.policeStations ?? '—'],
            ['FIRs filed (24h)', stats?.firsFiled24h ?? '—'],
            ['BNS sections live', stats?.bnsSectionsLive ?? '—'],
          ].map(([label, value], index) => (
            <div key={label} className={`text-center lg:px-6 ${index > 0 ? 'lg:border-l lg:border-white/[0.08]' : ''}`}>
              <div className="text-[46px] lg:text-[56px] font-extrabold leading-none tracking-tight text-white tabular-nums font-mono">
                {value}
              </div>
              <p className="mt-3 text-[11px] font-bold tracking-[0.18em] text-[#D1D5DB] uppercase max-w-[14rem] mx-auto leading-relaxed">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10">
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <p className="text-[11px] font-bold tracking-[0.22em] text-[#9CA3AF] uppercase mb-5">System status</p>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
              <span className="text-[#9CA3AF] uppercase text-[11px] font-bold tracking-widest">Last sync</span>
              <span className="font-mono text-white">{dashboard?.systemStatus?.lastSync ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
              <span className="text-[#9CA3AF] uppercase text-[11px] font-bold tracking-widest">API gateway</span>
              <span className="rounded-sm bg-[#16A34A]/15 text-[#E5F9EC] text-[11px] font-bold px-2 py-0.5 uppercase tracking-wide border border-[#16A34A]/30">
                {dashboard?.systemStatus?.apiGateway ?? 'Nominal'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#9CA3AF] uppercase text-[11px] font-bold tracking-widest">Audit log stream</span>
              <span className="font-mono text-white">{dashboard?.systemStatus?.auditLogStream ?? '—'}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <p className="text-[11px] font-bold tracking-[0.22em] text-[#9CA3AF] uppercase mb-5">Recent officer submissions</p>
          <div className="space-y-3">
            {(dashboard?.recentOfficers ?? []).map((officer) => (
              <div key={officer.id} className="rounded-xl border border-white/[0.08] bg-[#0b0b0b] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{officer.name}</div>
                    <div className="text-sm text-[#D1D5DB]">
                      {officer.stationName} · {officer.badgeNumber}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#FBBF24]">
                    {officer.verificationStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminHome;
