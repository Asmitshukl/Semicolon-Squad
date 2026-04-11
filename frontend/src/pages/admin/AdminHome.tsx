const OVERVIEW_STATS = [
  { label: 'Pending officer actions', value: '03', mono: true },
  { label: 'Police stations (synced)', value: '142', mono: true },
  { label: 'FIRs filed (24h)', value: '—', mono: true },
  { label: 'BNS sections live', value: '358', mono: true },
] as const;

const formatNow = () =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date());

export const AdminHome = () => {
  const stamped = formatNow();

  return (
    <div className="p-8 lg:p-10 max-w-[1400px]">
      <div className="mb-10">
        <p className="text-[11px] font-bold tracking-[0.22em] text-[#6B7280] uppercase mb-2">Command overview</p>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">National operations</h1>
      </div>

      {/* Stats: raw on background, no cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14 mb-12">
        {OVERVIEW_STATS.map((s) => (
          <div key={s.label}>
            <div
              className={`text-[48px] lg:text-[56px] font-extrabold leading-none tracking-tight text-white tabular-nums ${
                s.mono ? 'font-mono' : ''
              }`}
            >
              {s.value}
            </div>
            <p className="mt-3 text-[11px] font-bold tracking-[0.18em] text-[#6B7280] uppercase max-w-[12rem] leading-relaxed">
              {s.label}
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
              <span className="font-mono text-[#E5E7EB]">{stamped}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
              <span className="text-[#6B7280] uppercase text-[11px] font-bold tracking-widest">API gateway</span>
              <span className="rounded-sm bg-[#16A34A]/15 text-[#4ADE80] text-[11px] font-bold px-2 py-0.5 uppercase tracking-wide">
                Nominal
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#6B7280] uppercase text-[11px] font-bold tracking-widest">Audit log stream</span>
              <span className="font-mono text-[#E5E7EB]">CCTNS-LINK-READY</span>
            </div>
          </div>
        </section>

        <section>
          <p className="text-[11px] font-bold tracking-[0.22em] text-[#6B7280] uppercase mb-4">Administrative duty</p>
          <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6">
            Officer verification queue requires action. Station registry and BNS catalog are available from the command
            rail.
          </p>
          <hr className="border-0 h-px bg-white/[0.08] mb-6" />
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase mb-3">Next actions</p>
          <ul className="text-sm text-[#D1D5DB] space-y-2 list-disc list-inside marker:text-[#F97316]">
            <li>Review pending officer registrations</li>
            <li>Validate station master data against CCTNS codes</li>
            <li>Confirm BNS section mappings after legislative updates</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AdminHome;
