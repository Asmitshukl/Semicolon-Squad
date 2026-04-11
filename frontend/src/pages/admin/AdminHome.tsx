import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

export const AdminHome = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void adminService
      .getDashboard()
      .then(setDashboard)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Unable to load admin dashboard.'),
      );
  }, []);

  const stats = dashboard?.stats;

  return (
    <div className="p-8 lg:p-10 max-w-[1400px] text-white">
      <div className="mb-10">
        <p className="text-[11px] font-bold tracking-[0.22em] text-[#6B7280] uppercase mb-2">Command overview</p>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">National operations</h1>
      </div>

      {error && <div className="mb-6 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14 mb-12">
        {[
          ['Pending officer actions', stats?.pendingOfficerActions ?? '—'],
          ['Police stations (synced)', stats?.policeStations ?? '—'],
          ['FIRs filed (24h)', stats?.firsFiled24h ?? '—'],
          ['BNS sections live', stats?.bnsSectionsLive ?? '—'],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-[48px] lg:text-[56px] font-extrabold leading-none tracking-tight text-white tabular-nums font-mono">
              {value}
            </div>
            <p className="mt-3 text-[11px] font-bold tracking-[0.18em] text-[#6B7280] uppercase max-w-[12rem] leading-relaxed">
              {label}
            </p>
          </div>
        ))}
      </div>

      <hr className="border-0 h-px bg-white/[0.08] mb-10" />

      <div className="grid lg:grid-cols-2 gap-10">
        <section>
          <p className="text-[11px] font-bold tracking-[0.22em] text-[#6B7280] uppercase mb-4">System status</p>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
              <span className="text-[#6B7280] uppercase text-[11px] font-bold tracking-widest">Last sync</span>
              <span className="font-mono text-[#E5E7EB]">{dashboard?.systemStatus?.lastSync ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
              <span className="text-[#6B7280] uppercase text-[11px] font-bold tracking-widest">API gateway</span>
              <span className="rounded-sm bg-[#16A34A]/15 text-[#4ADE80] text-[11px] font-bold px-2 py-0.5 uppercase tracking-wide">
                {dashboard?.systemStatus?.apiGateway ?? 'Nominal'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#6B7280] uppercase text-[11px] font-bold tracking-widest">Audit log stream</span>
              <span className="font-mono text-[#E5E7EB]">{dashboard?.systemStatus?.auditLogStream ?? '—'}</span>
            </div>
          </div>
        </section>

        <section>
          <p className="text-[11px] font-bold tracking-[0.22em] text-[#6B7280] uppercase mb-4">Recent officer submissions</p>
          <div className="space-y-3">
            {(dashboard?.recentOfficers ?? []).map((officer: any) => (
              <div key={officer.id} className="border border-white/[0.08] rounded-sm p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{officer.name}</div>
                    <div className="text-sm text-[#9CA3AF]">
                      {officer.stationName} • {officer.badgeNumber}
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
