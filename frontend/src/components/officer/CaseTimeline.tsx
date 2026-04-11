import type { TimelineEntry } from '../../data/officerMock';

export const CaseTimeline = ({ entries }: { entries: TimelineEntry[] }) => (
  <div className="space-y-4 pl-1">
    {entries.map((e, i) => (
      <div key={i} className="flex gap-3">
        <div className="flex flex-col items-center pt-1">
          <span className="w-2 h-2 rounded-sm bg-[#F97316]" />
          {i < entries.length - 1 && <span className="w-px flex-1 min-h-[20px] bg-white/[0.08] mt-1" />}
        </div>
        <div>
          <p className="text-sm text-[#D1D5DB]">{e.action}</p>
          <p className="text-xs font-mono text-[#6B7280] mt-0.5">{e.time}</p>
        </div>
      </div>
    ))}
  </div>
);
