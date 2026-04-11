import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { DocumentGenerator } from '../../components/officer/DocumentGenerator';
import { FIRDetailView } from '../../components/officer/FIRDetailView';
import { officerService } from '../../services/officerService';
import type { MockFIR, VoiceRec } from '../../data/officerMock';

const badge = (u: string) => {
  if (u === 'CRITICAL') return 'bg-[#DC2626]/15 text-[#FCA5A5] border border-[#DC2626]/40';
  if (u === 'HIGH') return 'bg-[#F97316]/15 text-[#FDBA74] border border-[#F97316]/35';
  if (u === 'MEDIUM') return 'bg-[#D97706]/15 text-[#FCD34D] border border-[#D97706]/35';
  return 'bg-[#16A34A]/15 text-[#86EFAC] border border-[#16A34A]/35';
};

export const FIRDetail = () => {
  const { firId } = useParams();
  const [fir, setFir] = useState<MockFIR | null>(null);
  const [voices, setVoices] = useState<VoiceRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firId) {
      setError('Missing FIR id.');
      setLoading(false);
      return;
    }

    let active = true;

    void Promise.all([officerService.getFir(firId), officerService.listVoiceRecordings(firId)])
      .then(([firData, voiceData]) => {
        if (!active) return;
        setFir(firData);
        setVoices(voiceData);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load FIR details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [firId]);

  return (
    <div>
      <Link to="/officer/fir" className="text-sm font-semibold text-[#6B7280] hover:text-[#F97316]">
        ← FIR Inbox
      </Link>

      {loading ? <p className="mt-8 text-sm text-[#6B7280]">Loading FIR details...</p> : null}
      {error ? <p className="mt-8 text-sm text-[#FCA5A5]">{error}</p> : null}

      {fir ? (
        <>
          <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="font-mono text-3xl md:text-4xl font-extrabold text-[#F97316]">{fir.firNo}</h1>
              <p className="text-[#9CA3AF] mt-2 font-semibold">
                {fir.bnsCode} — {fir.bnsTitle} · BNS 2024
              </p>
            </div>
            <div className="text-right space-y-2">
              <span className={`inline-block rounded-sm px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${badge(fir.urgency)}`}>
                {fir.urgency}
              </span>
              <p className="text-xs font-mono text-[#6B7280]">Received {fir.received}</p>
            </div>
          </div>

          <hr className="border-0 h-px bg-white/[0.08] my-10" />
          <FIRDetailView fir={fir} voices={voices} />
          <hr className="border-0 h-px bg-white/[0.08] my-12" />
          <DocumentGenerator fir={fir} />
        </>
      ) : null}
    </div>
  );
};

export default FIRDetail;
