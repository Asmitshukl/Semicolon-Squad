import type { MockFIR } from '../../data/officerMock';

export const BNSSectionPanel = ({ fir }: { fir: MockFIR }) => {
  const sections = fir.sectionMappings.length
    ? fir.sectionMappings
    : [
        {
          sectionNumber: fir.bnsCode,
          sectionTitle: fir.bnsTitle,
          ipcEquivalent: fir.ipcEquiv === 'N/A' ? null : fir.ipcEquiv,
          ipcTitle: null,
          reasoning: null,
          description: null,
          cognizable: fir.cognizable === 'Cognizable',
          bailable: fir.bailable === 'Bailable',
        },
      ];

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div
          key={`${section.sectionNumber}-${section.ipcEquivalent ?? 'na'}`}
          className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-4"
        >
          <p className="text-white font-bold">
            BNS {section.sectionNumber} - {section.sectionTitle}
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            IPC Equivalent:{' '}
            {section.ipcEquivalent
              ? `${section.ipcEquivalent}${section.ipcTitle ? ` - ${section.ipcTitle}` : ''}`
              : 'N/A'}
          </p>
          <p className="mt-3 text-sm text-[#9CA3AF]">
            {section.cognizable ? 'Cognizable' : 'Non-Cognizable'} ·{' '}
            {section.bailable ? 'Bailable' : 'Non-Bailable'}
          </p>
          {section.reasoning ? (
            <div className="mt-4 rounded-lg border border-[#F97316]/20 bg-[#0b0b0b] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F97316]">
                Why this section fits
              </p>
              <p className="mt-2 text-sm leading-6 text-[#D1D5DB]">{section.reasoning}</p>
            </div>
          ) : null}
        </div>
      ))}
      <p className="text-[11px] text-[#6B7280]">IPC equivalents shown for officer reference</p>
    </div>
  );
};
