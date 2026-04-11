import { OFFICER } from '../../data/officerMock';

export const OfficerProfile = () => (
  <div>
    <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase mb-2">— प्रोफ़ाइल · OFFICER PROFILE</p>
    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-12">{OFFICER.name}</h1>

    <div className="grid lg:grid-cols-[60fr_40fr] gap-12">
      <div className="space-y-4 text-sm">
        {(
          [
            ['Badge Number', OFFICER.badge],
            ['Rank', OFFICER.rank],
            ['Department', OFFICER.department],
            ['Station', OFFICER.station],
            ['District', OFFICER.district],
            ['CCTNS ID', OFFICER.cctnsId],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-3">
            <dt className="text-[#6B7280] w-40 shrink-0">{k}:</dt>
            <dd className={`text-white font-semibold ${k.includes('ID') || k.includes('Badge') ? 'font-mono' : ''}`}>{v}</dd>
          </div>
        ))}

        <div className="pt-6">
          <div className="inline-block rounded-sm bg-[#16A34A]/15 border border-[#16A34A]/40 px-4 py-3">
            <p className="text-lg font-extrabold text-[#4ADE80] tracking-wide">✓ VERIFIED</p>
            <p className="text-xs text-[#6B7280] mt-2">Verified by Admin on {OFFICER.verifiedAt}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="grid gap-8 mb-10">
          <div>
            <div className="text-[48px] font-extrabold text-white tabular-nums leading-none">{OFFICER.docsGenerated}</div>
            <p className="mt-2 text-[11px] font-bold tracking-[0.12em] text-[#6B7280] uppercase">Documents Generated</p>
            <p className="text-[10px] text-[#6B7280] mt-1">दस्तावेज़ निर्मित</p>
          </div>
          <div>
            <div className="text-[48px] font-extrabold text-white tabular-nums leading-none">{OFFICER.firsHandled}</div>
            <p className="mt-2 text-[11px] font-bold tracking-[0.12em] text-[#6B7280] uppercase">FIRs Handled</p>
            <p className="text-[10px] text-[#6B7280] mt-1">संभाले गए एफआईआर</p>
          </div>
          <div>
            <div className="text-[48px] font-extrabold text-white tabular-nums leading-none">{OFFICER.voiceVerified}</div>
            <p className="mt-2 text-[11px] font-bold tracking-[0.12em] text-[#6B7280] uppercase">Voice Statements Verified</p>
            <p className="text-[10px] text-[#6B7280] mt-1">आवाज़ सत्यापित</p>
          </div>
        </div>

        <label className="block text-[10px] font-bold tracking-widest text-[#6B7280] uppercase mb-2">Language preference</label>
        <select className="w-full rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white mb-8">
          <option>English</option>
          <option>हिन्दी</option>
        </select>

        <button type="button" className="text-xs font-semibold text-[#6B7280] hover:text-[#F97316]">
          Request Re-verification
        </button>
      </div>
    </div>
  </div>
);

export default OfficerProfile;
