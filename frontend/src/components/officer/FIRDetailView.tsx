import type { MockFIR, VoiceRec } from '../../data/officerMock';
import { AISummaryEditor } from './AISummaryEditor';
import { BNSSectionPanel } from './BNSSectionPanel';
import { VoiceRecordingList } from './VoiceRecordingList';
import { CaseTimeline } from './CaseTimeline';

/** Two-column FIR workspace: victim/AI left; BNS, voice, timeline right */
export const FIRDetailView = ({ fir, voices }: { fir: MockFIR; voices: VoiceRec[] }) => (
  <div className="grid lg:grid-cols-[55fr_45fr] gap-10">
    <div className="space-y-10">
      <section>
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase mb-4">— पीड़ित विवरण · VICTIM STATEMENT</p>
        <dl className="space-y-2 text-sm">
          {(
            [
              ['Name', fir.victimName],
              ['Phone', fir.victimPhone],
              ['Incident Date', fir.incidentDate],
              ['Location', fir.location],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex flex-wrap gap-2">
              <dt className="text-[#6B7280] w-32 shrink-0">{k}:</dt>
              <dd className="text-white font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-4 max-h-48 overflow-y-auto">
          <p className="text-sm text-[#9CA3AF] italic leading-relaxed">{fir.statement}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {fir.statementTags.map((t) => (
              <span key={t} className="rounded-sm border border-white/[0.1] px-2 py-0.5 text-[10px] font-bold text-[#6B7280] uppercase">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section>
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase mb-4">— AI सारांश · AI GENERATED SUMMARY</p>
        <AISummaryEditor initial={fir.aiSummaryDefault} />
      </section>
    </div>

    <div className="space-y-10">
      <section>
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase mb-4">— BNS धाराएं · SECTIONS APPLIED</p>
        <BNSSectionPanel fir={fir} />
      </section>

      <section>
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase mb-4">— आवाज़ रिकॉर्डिंग · VOICE RECORDINGS</p>
        <VoiceRecordingList items={voices} />
      </section>

      <section>
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase mb-4">— केस टाइमलाइन · CASE TIMELINE</p>
        <CaseTimeline entries={fir.timeline} />
      </section>
    </div>
  </div>
);
