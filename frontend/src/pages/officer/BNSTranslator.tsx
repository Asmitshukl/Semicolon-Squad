import { useMemo, useState } from 'react';
import { BNS_IPC_MAP, RECENT_BNS_KEYS } from '../../data/officerMock';
import { BNSTranslatorSearch } from '../../components/officer/BNSTranslatorSearch';
import { BNSCompareCard } from '../../components/officer/BNSCompareCard';

const labelForKey = (k: string) => {
  const d = BNS_IPC_MAP[k];
  if (!d) return `§${k}`;
  return `§${k} ${d.bnsTitle}`;
};

export const BNSTranslator = () => {
  const [activeKey, setActiveKey] = useState('103');
  const [q, setQ] = useState('');

  const resolved = useMemo(() => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return activeKey;
    const entry = Object.entries(BNS_IPC_MAP).find(
      ([key, v]) =>
        key === trimmed.replace(/\D/g, '') ||
        trimmed.includes(key) ||
        v.bnsTitle.toLowerCase().includes(trimmed) ||
        v.ipc.replace(/\D/g, '').includes(trimmed.replace(/\D/g, '')),
    );
    return entry?.[0] ?? activeKey;
  }, [q, activeKey]);

  const d = BNS_IPC_MAP[resolved] ?? BNS_IPC_MAP['103'];

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white">BNS ↔ IPC Translator</h1>
      <p className="text-[11px] font-bold tracking-[0.18em] text-[#6B7280] uppercase mt-2 mb-8">
        — कानून अनुवादक · Search any section instantly
      </p>

      <BNSTranslatorSearch value={q} onChange={setQ} />

      <div className="grid md:grid-cols-2 gap-6 mt-10">
        <BNSCompareCard
          side="bns"
          code={`BNS §${resolved}`}
          title={d.bnsTitle}
          detail={d.detail}
          cog={d.cog}
          bail={d.bail}
        />
        <BNSCompareCard
          side="ipc"
          code={`IPC ${d.ipc}`}
          title={d.ipcTitle}
          detail={d.detail}
          cog={d.cog}
          bail={d.bail}
        />
      </div>

      <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase mt-12 mb-3">Recently searched</p>
      <div className="flex flex-wrap gap-2">
        {RECENT_BNS_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setActiveKey(k);
              setQ('');
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeKey === k && !q.trim()
                ? 'border-[#F97316] text-[#F97316] bg-[#F97316]/10'
                : 'border-white/[0.1] text-[#9CA3AF] hover:border-white/[0.2]'
            }`}
          >
            {labelForKey(k)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BNSTranslator;
