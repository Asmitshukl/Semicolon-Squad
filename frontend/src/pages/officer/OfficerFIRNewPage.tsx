import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { officerService } from '../../services/officerService';
import type { MockFIR } from '../../data/officerMock';

export const OfficerFIRNewPage = () => {
  const [firs, setFirs] = useState<MockFIR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void officerService
      .listFirs()
      .then((items) => {
        if (!active) return;
        setFirs(items);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load FIR workflow queue.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B7280]">New FIR Workflow</p>
        <h1 className="mb-4 text-2xl font-extrabold text-white">Officer desk workflow</h1>
        <p className="max-w-3xl text-sm text-[#9CA3AF]">
          Use this sequence for each complaint: review the incoming victim statement, capture or verify the voice
          statement, confirm BNS and IPC mapping, then open the FIR detail page to generate the signed PDF and trigger
          victim notifications.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['1. Review queue', 'Open victim-submitted FIRs and pick the case to process.', '/officer/fir'],
          ['2. Record statement', 'Capture audio, watch the transcript, and link it to the FIR.', '/officer/voice'],
          ['3. Check sections', 'Use the BNS to IPC translator before finalizing sections.', '/officer/bns'],
          ['4. Generate PDF', 'Open FIR detail and download the final signed document.', '/officer/fir'],
        ].map(([title, copy, href]) => (
          <Link
            key={title}
            to={href}
            className="rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-5 transition hover:border-[#F97316]/50 hover:bg-[rgba(249,115,22,0.08)]"
          >
            <h2 className="mb-2 text-sm font-bold text-white">{title}</h2>
            <p className="text-sm text-[#9CA3AF]">{copy}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">Cases ready for officer action</h2>
          <Link to="/officer/fir" className="text-sm font-semibold text-[#F97316] hover:underline">
            Open full inbox
          </Link>
        </div>

        {loading ? <p className="text-sm text-[#6B7280]">Loading workflow queue...</p> : null}
        {error ? <p className="text-sm text-[#FCA5A5]">{error}</p> : null}
        {!loading && !error ? (
          <div className="space-y-3">
            {firs.slice(0, 5).map((fir) => (
              <div
                key={fir.id}
                className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-mono text-sm font-bold text-[#F97316]">{fir.firNo}</p>
                  <p className="text-sm text-white">
                    {fir.bnsCode} - {fir.bnsTitle}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {fir.victimName} | {fir.location} | {fir.urgency}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    to={`/officer/fir/${fir.id}`}
                    className="rounded-xl border border-white/[0.1] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:border-[#F97316]"
                  >
                    Open FIR
                  </Link>
                  <Link
                    to="/officer/voice"
                    className="rounded-xl bg-[#F97316] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-[#ea580c]"
                  >
                    Record voice
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default OfficerFIRNewPage;
