import { useEffect, useState } from 'react';
import { officerService } from '../../services/officerService';

type OfficerProfileData = Awaited<ReturnType<typeof officerService.getProfile>>;

export const OfficerProfile = () => {
  const [profile, setProfile] = useState<OfficerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void officerService
      .getProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load officer profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase mb-2">— प्रोफ़ाइल · OFFICER PROFILE</p>
      <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-12">{profile?.user.name ?? 'Officer profile'}</h1>

      {loading ? <p className="text-sm text-[#6B7280]">Loading profile...</p> : null}
      {error ? <p className="text-sm text-[#FCA5A5]">{error}</p> : null}

      {profile ? (
        <div className="grid lg:grid-cols-[60fr_40fr] gap-12">
          <div className="space-y-4 text-sm">
            {(
              [
                ['Badge Number', profile.badgeNumber],
                ['Rank', profile.rank],
                ['Department', profile.department],
                ['Station', profile.station.name],
                ['District', profile.station.district],
                ['CCTNS ID', profile.cctnsId ?? 'Pending'],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-3">
                <dt className="text-[#6B7280] w-40 shrink-0">{k}:</dt>
                <dd className={`text-white font-semibold ${k.includes('ID') || k.includes('Badge') ? 'font-mono' : ''}`}>{v}</dd>
              </div>
            ))}

            <div className="pt-6">
              <div className="inline-block rounded-sm bg-[#16A34A]/15 border border-[#16A34A]/40 px-4 py-3">
                <p className="text-lg font-extrabold text-[#4ADE80] tracking-wide">✓ {profile.verificationStatus}</p>
                <p className="text-xs text-[#6B7280] mt-2">
                  Verified on {profile.verifiedAt ? new Date(profile.verifiedAt).toLocaleString('en-GB') : 'Pending'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="grid gap-8 mb-10">
              <div>
                <div className="text-[48px] font-extrabold text-white tabular-nums leading-none">{profile.stats.docsGenerated}</div>
                <p className="mt-2 text-[11px] font-bold tracking-[0.12em] text-[#6B7280] uppercase">Documents Generated</p>
                <p className="text-[10px] text-[#6B7280] mt-1">दस्तावेज़ निर्मित</p>
              </div>
              <div>
                <div className="text-[48px] font-extrabold text-white tabular-nums leading-none">{profile.stats.firsHandled}</div>
                <p className="mt-2 text-[11px] font-bold tracking-[0.12em] text-[#6B7280] uppercase">FIRs Handled</p>
                <p className="text-[10px] text-[#6B7280] mt-1">संभाले गए एफआईआर</p>
              </div>
              <div>
                <div className="text-[48px] font-extrabold text-white tabular-nums leading-none">{profile.stats.voiceVerified}</div>
                <p className="mt-2 text-[11px] font-bold tracking-[0.12em] text-[#6B7280] uppercase">Voice Statements Verified</p>
                <p className="text-[10px] text-[#6B7280] mt-1">आवाज़ सत्यापित</p>
              </div>
            </div>

            <label className="block text-[10px] font-bold tracking-widest text-[#6B7280] uppercase mb-2">Language preference</label>
            <div className="w-full rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white mb-8">
              {profile.user.preferredLang}
            </div>

            <button type="button" className="text-xs font-semibold text-[#6B7280] hover:text-[#F97316]">
              Request Re-verification
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default OfficerProfile;
