import { useState, useEffect } from 'react';

export const AISummaryEditor = ({ initial }: { initial: string }) => {
  const [text, setText] = useState(initial);
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    setText(initial);
    setEdited(false);
  }, [initial]);

  const onChange = (v: string) => {
    setText(v);
    setEdited(v !== initial);
  };

  return (
    <div>
      <label className="block text-xs text-[#6B7280] mb-2">Review and edit before generating document</label>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        className="w-full rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-white placeholder:text-[#4B5563] focus:outline-none focus:ring-1 focus:ring-[#F97316]/50"
      />
      <div className="flex justify-between items-center mt-2">
        <p className="text-[11px] text-[#6B7280]">
          {edited ? 'Edited by SI Rajesh Kumar · 09:52:00 AM' : 'Last edited by AI · Not yet reviewed'}
        </p>
        <span className="text-[11px] font-mono text-[#6B7280]">{text.length} chars</span>
      </div>
    </div>
  );
};
