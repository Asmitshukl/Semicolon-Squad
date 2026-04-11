import { useState, useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { WaveformDisplay } from './WaveformDisplay';

const MOCK_TRANSCRIPT =
  '[Auto-transcribed] Complainant states incident occurred near inner circle; two persons involved; requests FIR.';

export const VoiceRecorder = () => {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [time, setTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const tick = useRef<number | null>(null);

  useEffect(() => {
    if (!recording) {
      if (tick.current) window.clearInterval(tick.current);
      tick.current = null;
      return;
    }
    tick.current = window.setInterval(() => setTime((t) => t + 1), 1000);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, [recording]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `00:${m}:${sec}`;
  };

  const startRec = () => {
    setTime(0);
    setStopped(false);
    setTranscript('');
    setRecording(true);
  };

  const stopRec = () => {
    setRecording(false);
    setStopped(true);
    setTranscript(MOCK_TRANSCRIPT);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            if (open) {
              setRecording(false);
              setStopped(false);
              setTime(0);
              setTranscript('');
            }
          }}
          className="rounded-xl bg-[#F97316] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-[#ea580c]"
        >
          New Recording
        </button>
      </div>

      {open && (
        <div className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-6 space-y-5">
          <div className="flex flex-wrap gap-4">
            <input
              placeholder="FIR number e.g. #2024-DL-00892"
              className="flex-1 min-w-[200px] rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-sm font-mono text-[#F97316] placeholder:text-[#4B5563]"
            />
            <select className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-sm text-white">
              {['EN', 'HI', 'MR', 'TA', 'TE', 'BH'].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center gap-4 py-4">
            <button
              type="button"
              onClick={recording ? stopRec : startRec}
              className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-colors ${
                recording ? 'bg-[#DC2626] border-[#DC2626] text-white' : 'bg-white/[0.06] border-white/[0.12] text-[#F97316]'
              }`}
            >
              <Mic className="w-9 h-9" strokeWidth={2} />
            </button>
            <WaveformDisplay active={recording} />
            <p className="font-mono text-lg text-white tabular-nums">{fmt(time)}</p>
            {recording && (
              <button type="button" onClick={stopRec} className="text-xs font-bold text-[#DC2626] uppercase tracking-wide">
                Stop Recording
              </button>
            )}
          </div>

          {stopped && (
            <div>
              <label className="block text-xs text-[#6B7280] mb-2">Transcript (review & edit)</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-sm text-[#D1D5DB]"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  className="rounded-xl bg-[#F97316] px-4 py-2 text-xs font-extrabold uppercase text-white hover:bg-[#ea580c]"
                >
                  Save & Link to FIR
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
