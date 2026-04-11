import { Fragment, useState } from 'react';
import { MOCK_VOICE_GLOBAL } from '../../data/officerMock';
import { VoiceRecorder } from '../../components/officer/VoiceRecorder';

export const VoiceStatements = () => {
  const [rows, setRows] = useState(MOCK_VOICE_GLOBAL);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [firFilter, setFirFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'verified' | 'unverified'>('ALL');

  const filtered = rows.filter((r) => {
    if (firFilter && !r.firNo.toLowerCase().includes(firFilter.toLowerCase())) return false;
    if (statusFilter === 'verified' && !r.verified) return false;
    if (statusFilter === 'unverified' && r.verified) return false;
    return true;
  });

  const markVerified = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, verified: true } : r)));
    setConfirmId(null);
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white">Voice Statements</h1>
      <p className="text-[11px] font-bold tracking-[0.18em] text-[#6B7280] uppercase mt-2 mb-8">
        — आवाज़ बयान · Record and verify victim statements
      </p>

      <VoiceRecorder />

      <div className="flex flex-wrap gap-4 mb-6 mt-10">
        <input
          value={firFilter}
          onChange={(e) => setFirFilter(e.target.value)}
          placeholder="FIR number"
          className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm font-mono text-[#F97316] placeholder:text-[#4B5563] min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white"
        >
          <option value="ALL">All statuses</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)]">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              {['FIR NO', 'LANGUAGE', 'DURATION', 'RECORDED', 'STATUS', 'ACTIONS'].map((h) => (
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
            {filtered.map((r) => (
              <Fragment key={r.id}>
                <tr className="border-b border-white/[0.06] hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-mono text-sm font-bold text-[#F97316]">{r.firNo}</td>
                  <td className="px-4 py-3 text-white font-semibold">{r.language}</td>
                  <td className="px-4 py-3 font-mono text-[#9CA3AF]">{r.duration}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{r.recordedAt}</td>
                  <td className={`px-4 py-3 text-[11px] font-bold uppercase ${r.verified ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
                    {r.verified ? 'Verified' : 'Unverified'}
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <button type="button" className="text-xs font-bold text-[#F97316] hover:underline">
                      Play
                    </button>
                    {!r.verified && (
                      <button
                        type="button"
                        onClick={() => setConfirmId(confirmId === r.id ? null : r.id)}
                        className="text-xs font-bold text-[#F97316] hover:underline"
                      >
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
                {confirmId === r.id && (
                  <tr className="bg-white/[0.02]">
                    <td colSpan={6} className="px-4 py-4">
                      <p className="text-sm text-[#D1D5DB] mb-3">Mark this recording as verified?</p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="rounded-sm border border-white/[0.12] px-4 py-2 text-xs font-bold text-[#9CA3AF] uppercase"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => markVerified(r.id)}
                          className="rounded-sm bg-[#16A34A] px-4 py-2 text-xs font-extrabold text-white uppercase tracking-wide"
                        >
                          ✓ Mark Verified
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VoiceStatements;
