type Side = 'bns' | 'ipc';

export const BNSCompareCard = ({
  side,
  code,
  title,
  detail,
  cog,
  bail,
}: {
  side: Side;
  code: string;
  title: string;
  detail: string;
  cog: string;
  bail: string;
}) => (
  <div
    className={`rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-6 border-l-4 ${
      side === 'bns' ? 'border-l-[#F97316]' : 'border-l-[#6B7280]'
    }`}
  >
    <span
      className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide mb-3 ${
        side === 'bns' ? 'bg-[#F97316]/15 text-[#FDBA74]' : 'bg-white/[0.06] text-[#9CA3AF]'
      }`}
    >
      {side === 'bns' ? 'Current law' : 'Repealed'}
    </span>
    <p className="font-mono text-lg font-bold text-[#F97316]">{code}</p>
    <p className="text-lg font-extrabold text-white mt-1">{title}</p>
    <p className="text-sm text-[#9CA3AF] mt-4">{detail}</p>
    <p className="text-xs text-[#6B7280] mt-4">
      {cog} · {bail}
    </p>
  </div>
);
