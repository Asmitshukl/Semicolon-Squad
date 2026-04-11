import { useMemo, useState } from 'react';
import { MOCK_FIRS, type Urgency, type FIRStatus } from '../../data/officerMock';
import { FIRTable } from '../../components/officer/FIRTable';

const URGENCIES: (Urgency | 'ALL')[] = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUSES: (FIRStatus | 'ALL')[] = ['ALL', 'AI Ready', 'Under Review', 'Document Generated', 'Signed'];

export const FIRInbox = () => {
  const [urgency, setUrgency] = useState<Urgency | 'ALL'>('ALL');
  const [status, setStatus] = useState<FIRStatus | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    return MOCK_FIRS.filter((f) => {
      if (urgency !== 'ALL' && f.urgency !== urgency) return false;
      if (status !== 'ALL' && f.status !== status) return false;
      return true;
    });
  }, [urgency, status]);

  const page = 1;
  const totalPages = 3;

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white">FIR Inbox</h1>
      <p className="text-[11px] font-bold tracking-[0.18em] text-[#6B7280] uppercase mt-2 mb-8">
        — एफआईआर इनबॉक्स · All FIRs at your station
      </p>

      <div className="flex flex-wrap items-end gap-4 mb-6 text-sm">
        <label className="flex flex-col gap-1 text-[10px] font-bold tracking-widest text-[#6B7280] uppercase">
          Urgency
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as Urgency | 'ALL')}
            className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-white text-sm font-semibold min-w-[140px]"
          >
            {URGENCIES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold tracking-widest text-[#6B7280] uppercase">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FIRStatus | 'ALL')}
            className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-white text-sm font-semibold min-w-[180px]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold tracking-widest text-[#6B7280] uppercase">
          Date range
          <input
            type="text"
            placeholder="DD/MM/YYYY — DD/MM/YYYY"
            className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-white text-sm w-[220px]"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setUrgency('ALL');
            setStatus('ALL');
          }}
          className="text-xs font-bold text-[#6B7280] hover:text-[#F97316] uppercase tracking-wide mb-2"
        >
          Clear
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#6B7280] py-8">No FIRs match the current filters.</p>
      ) : (
        <FIRTable rows={filtered} page={page} totalPages={totalPages} />
      )}
    </div>
  );
};

export default FIRInbox;
