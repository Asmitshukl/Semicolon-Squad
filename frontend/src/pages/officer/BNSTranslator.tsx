import { useEffect, useMemo, useState } from 'react';
import { BNSTranslatorSearch } from '../../components/officer/BNSTranslatorSearch';
import { BNSCompareCard } from '../../components/officer/BNSCompareCard';
import { officerService } from '../../services/officerService';

type SectionOption = { sectionNumber: string; sectionTitle: string };

type ResolvedSection = {
  sectionNumber: string;
  bnsTitle: string;
  detail: string;
  ipc: string;
  ipcTitle: string;
  cog: string;
  bail: string;
};

const toResolvedSection = (data: {
  bnsSection: {
    sectionNumber: string;
    sectionTitle: string;
    maxImprisonmentMonths?: number | null;
    isLifeOrDeath?: boolean;
    isCognizable?: boolean;
    isBailable?: boolean;
  };
  ipcEquivalent: string | null;
  ipcTitle: string | null;
}): ResolvedSection => ({
  sectionNumber: data.bnsSection.sectionNumber,
  bnsTitle: data.bnsSection.sectionTitle,
  detail: data.bnsSection.isLifeOrDeath
    ? 'Life imprisonment or death'
    : data.bnsSection.maxImprisonmentMonths
      ? `Punishment up to ${Math.max(1, Math.floor(data.bnsSection.maxImprisonmentMonths / 12) || 1)} year(s)`
      : 'Punishment as prescribed',
  ipc: data.ipcEquivalent || 'N/A',
  ipcTitle: data.ipcTitle || 'No direct IPC equivalent',
  cog: data.bnsSection.isCognizable ? 'Cognizable' : 'Non-Cognizable',
  bail: data.bnsSection.isBailable ? 'Bailable' : 'Non-Bailable',
});

const labelForKey = (entry: SectionOption) => `§${entry.sectionNumber} ${entry.sectionTitle}`;

export const BNSTranslator = () => {
  const [activeKey, setActiveKey] = useState('103');
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState<SectionOption[]>([]);
  const [resolved, setResolved] = useState<ResolvedSection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void officerService
      .getBnsBySectionNumber(activeKey)
      .then((data) => {
        setResolved(toResolvedSection(data));
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load BNS section.');
      });
  }, [activeKey]);

  useEffect(() => {
    if (!q.trim()) return;

    const timeoutId = window.setTimeout(() => {
      void officerService
        .searchBns(q)
        .then((results) => {
          setRecent(results.map((result) => ({ sectionNumber: result.sectionNumber, sectionTitle: result.sectionTitle })));
          if (results[0]) {
            setActiveKey(results[0].sectionNumber);
          }
          setError(null);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Search failed.');
        });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [q]);

  const chips = useMemo(() => (recent.length > 0 ? recent.slice(0, 4) : [{ sectionNumber: activeKey, sectionTitle: resolved?.bnsTitle || 'Current section' }]), [activeKey, recent, resolved?.bnsTitle]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white">BNS ↔ IPC Translator</h1>
      <p className="text-[11px] font-bold tracking-[0.18em] text-[#6B7280] uppercase mt-2 mb-8">
        — कानून अनुवादक · Search any section instantly
      </p>

      <BNSTranslatorSearch value={q} onChange={setQ} />
      {error ? <p className="mt-4 text-sm text-[#FCA5A5]">{error}</p> : null}

      {resolved ? (
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <BNSCompareCard
            side="bns"
            code={`BNS §${resolved.sectionNumber}`}
            title={resolved.bnsTitle}
            detail={resolved.detail}
            cog={resolved.cog}
            bail={resolved.bail}
          />
          <BNSCompareCard
            side="ipc"
            code={`IPC ${resolved.ipc}`}
            title={resolved.ipcTitle}
            detail={resolved.detail}
            cog={resolved.cog}
            bail={resolved.bail}
          />
        </div>
      ) : null}

      <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase mt-12 mb-3">Recently searched</p>
      <div className="flex flex-wrap gap-2">
        {chips.map((entry) => (
          <button
            key={entry.sectionNumber}
            type="button"
            onClick={() => {
              setActiveKey(entry.sectionNumber);
              setQ('');
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeKey === entry.sectionNumber && !q.trim()
                ? 'border-[#F97316] text-[#F97316] bg-[#F97316]/10'
                : 'border-white/[0.1] text-[#9CA3AF] hover:border-white/[0.2]'
            }`}
          >
            {labelForKey(entry)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BNSTranslator;
