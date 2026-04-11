import { Mic } from 'lucide-react';
import type { VoiceRec } from '../../data/officerMock';

type Props = {
  items: VoiceRec[];
  onVerify?: (id: string) => void;
};

export const VoiceRecordingList = ({ items, onVerify }: Props) => (
  <div className="space-y-3">
    {items.map((r) => (
      <div
        key={r.id}
        className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] px-4 py-3"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Mic className="w-4 h-4 text-[#6B7280] shrink-0" strokeWidth={2} />
          <span className="text-sm font-semibold text-white">{r.label}</span>
          <span className="font-mono text-xs text-[#9CA3AF]">{r.duration}</span>
          <span className="rounded-sm border border-white/[0.1] px-1.5 py-0.5 text-[10px] font-bold text-[#6B7280] uppercase">
            {r.language}
          </span>
          <span className={`text-[11px] font-bold uppercase ${r.verified ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
            {r.verified ? 'Verified' : 'Unverified'}
          </span>
          <span className="ml-auto flex gap-3 text-xs font-bold">
            {r.audioUrl ? (
              <audio controls preload="none" className="h-8">
                <source src={r.audioUrl} />
              </audio>
            ) : null}
            {!r.verified && onVerify && (
              <button type="button" onClick={() => onVerify(r.id)} className="text-[#F97316] hover:underline">
                Verify
              </button>
            )}
          </span>
        </div>
        {r.transcript ? <p className="mt-3 text-sm leading-6 text-[#D1D5DB]">{r.transcript}</p> : null}
      </div>
    ))}
    <button type="button" className="text-sm font-semibold text-[#6B7280] hover:text-[#F97316]">
      Add New Recording
    </button>
  </div>
);
