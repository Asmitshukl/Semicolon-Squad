const ROWS = [
  { id: 'OFF-2024-0891', name: 'Rajesh Kumar', station: 'PS Connaught Place', status: 'PENDING' as const, submitted: '12 Apr 2024, 09:41:03 AM' },
  { id: 'OFF-2024-0892', name: 'Priya Sharma', station: 'PS Bandra', status: 'VERIFIED' as const, submitted: '11 Apr 2024, 04:22:18 PM' },
  { id: 'OFF-2024-0893', name: 'Amit Verma', station: 'PS Whitefield', status: 'REJECTED' as const, submitted: '10 Apr 2024, 11:05:00 AM' },
];

const statusBorder = (s: (typeof ROWS)[number]['status']) => {
  if (s === 'PENDING') return 'border-l-[3px] border-l-amber-500';
  if (s === 'VERIFIED') return 'border-l-[3px] border-l-[#16A34A]';
  return 'border-l-[3px] border-l-[#DC2626]';
};

export const AdminOfficerPage = () => (
  <div className="p-8 lg:p-10 max-w-[1400px]">
    <p className="text-[11px] font-bold tracking-[0.22em] text-[#6B7280] uppercase mb-2">Officer registry</p>
    <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Approvals queue</h1>
    <p className="text-sm text-[#6B7280] mb-10 max-w-2xl">
      Destructive actions require confirmation in production. Below is representative layout data.
    </p>

    <hr className="border-0 h-px bg-white/[0.08] mb-6" />

    <div className="overflow-x-auto border border-white/[0.08] rounded-sm">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-white/[0.08] text-[10px] font-bold tracking-[0.15em] text-[#6B7280] uppercase">
            <th className="px-4 py-3">Officer id</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Station</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-mono text-[#E5E7EB]">{r.id}</td>
              <td className="px-4 py-3 text-white font-semibold">{r.name}</td>
              <td className="px-4 py-3 text-[#9CA3AF]">{r.station}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-white/[0.04] border border-white/[0.1] ${statusBorder(r.status)}`}
                >
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">{r.submitted}</td>
              <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide bg-[#16A34A] text-white rounded-sm hover:bg-[#15803d]"
                >
                  ✓ Approve officer
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide border border-[#DC2626] text-[#F87171] rounded-sm hover:bg-[#DC2626]/10"
                >
                  ✕ Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminOfficerPage;
