import { Link } from 'react-router-dom';
import type { MockFIR, Urgency } from '../../data/officerMock';

const dot = (u: Urgency) => {
  if (u === 'CRITICAL') return 'bg-[#DC2626]';
  if (u === 'HIGH') return 'bg-[#F97316]';
  if (u === 'MEDIUM') return 'bg-[#D97706]';
  return 'bg-[#16A34A]';
};

export const FIRTable = ({ rows, page, totalPages }: { rows: MockFIR[]; page: number; totalPages: number }) => (
  <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)]">
    <table className="w-full min-w-[720px] text-sm">
      <thead>
        <tr className="border-b border-white/[0.08]">
          {['FIR NO', 'BNS SECTION', 'URGENCY', 'STATUS', 'RECEIVED', ''].map((h) => (
            <th
              key={h}
              className="text-left px-4 py-3 text-[10px] font-bold tracking-[0.14em] text-[#6B7280] uppercase"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-white/[0.06] hover:bg-white/[0.03]">
            <td className="px-4 py-3">
              <Link to={`/officer/fir/${r.id}`} className="font-mono text-sm font-bold text-[#F97316] hover:underline">
                {r.firNo}
              </Link>
            </td>
            <td className="px-4 py-3 text-white font-semibold">
              {r.bnsCode} — {r.bnsTitle}
            </td>
            <td className="px-4 py-3">
              <span className={`inline-block w-2.5 h-2.5 rounded-sm ${dot(r.urgency)}`} title={r.urgency} />
            </td>
            <td className="px-4 py-3 text-[#9CA3AF]">{r.status}</td>
            <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{r.received}</td>
            <td className="px-4 py-3 text-right">
              <Link to={`/officer/fir/${r.id}`} className="text-sm font-bold text-[#F97316]">
                Open
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="flex items-center justify-between px-4 py-3 text-xs text-[#6B7280] font-mono border-t border-white/[0.06]">
      <span>
        Page {page} of {totalPages}
      </span>
      <span className="flex gap-4">
        <button type="button" className="hover:text-white disabled:opacity-30" disabled={page <= 1}>
          ←
        </button>
        <button type="button" className="hover:text-white disabled:opacity-30" disabled={page >= totalPages}>
          →
        </button>
      </span>
    </div>
  </div>
);
