import { useNavigate } from 'react-router-dom';
import type { MockFIR, Urgency } from '../../data/officerMock';

const border = (u: Urgency) => {
  if (u === 'CRITICAL') return 'border-l-[#DC2626]';
  if (u === 'HIGH') return 'border-l-[#F97316]';
  if (u === 'MEDIUM') return 'border-l-[#D97706]';
  return 'border-l-[#16A34A]';
};

const badge = (u: Urgency) => {
  if (u === 'CRITICAL') return 'bg-[#DC2626]/15 text-[#FCA5A5] border border-[#DC2626]/40';
  if (u === 'HIGH') return 'bg-[#F97316]/15 text-[#FDBA74] border border-[#F97316]/35';
  if (u === 'MEDIUM') return 'bg-[#D97706]/15 text-[#FCD34D] border border-[#D97706]/35';
  return 'bg-[#16A34A]/15 text-[#86EFAC] border border-[#16A34A]/35';
};

export const FIRCard = ({ fir }: { fir: MockFIR }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/officer/fir/${fir.id}`)}
      className={`w-full text-left rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] border-l-[4px] ${border(
        fir.urgency,
      )} p-5 hover:bg-[rgba(255,255,255,0.06)] transition-colors`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <span className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${badge(fir.urgency)}`}>
          {fir.urgency}
        </span>
        <div className="flex flex-wrap items-center gap-3 text-right ml-auto">
          <span className="font-mono text-sm font-bold text-[#F97316]">{fir.firNo}</span>
          <span className="font-mono text-xs text-[#6B7280]">{fir.received.split(',')[1]?.trim() ?? fir.received}</span>
        </div>
      </div>
      <p className="text-white font-bold text-sm mb-1">
        BNS {fir.bnsCode} — {fir.bnsTitle}{' '}
        <span className="text-[#6B7280] font-semibold">IPC {fir.ipcEquiv} equivalent</span>
      </p>
      <p className="text-sm text-[#9CA3AF] mb-4">{fir.location}</p>
      <p className="text-xs text-[#6B7280] mb-4">AI Summary: {fir.aiSummaryLine}</p>
      <div className="flex justify-end">
        <span className="inline-flex items-center text-sm font-bold text-[#F97316]">Review & Generate Document →</span>
      </div>
    </button>
  );
};
