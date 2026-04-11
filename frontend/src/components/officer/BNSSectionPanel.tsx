import type { MockFIR } from '../../data/officerMock';

export const BNSSectionPanel = ({ fir }: { fir: MockFIR }) => (
  <div className="space-y-4">
    <div className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-4">
      <p className="text-white font-bold">
        BNS {fir.bnsCode} — {fir.bnsTitle}
      </p>
      <p className="text-xs text-[#6B7280] mt-1">IPC Equivalent: {fir.ipcEquiv}</p>
      <p className="text-sm text-[#9CA3AF] mt-3">
        {fir.punishmentLine} · {fir.cognizable} · {fir.bailable}
      </p>
    </div>
    <p className="text-[11px] text-[#6B7280]">IPC equivalents shown for officer reference</p>
  </div>
);
