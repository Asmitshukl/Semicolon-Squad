/** Animated bars while “recording” — mock visual only */
export const WaveformDisplay = ({ active }: { active: boolean }) => (
  <div className="flex items-end justify-center gap-0.5 h-10">
    {Array.from({ length: 24 }, (_, i) => (
      <span
        key={i}
        className="w-1 rounded-sm bg-[#F97316]/80"
        style={{
          height: active ? `${8 + ((i * 17) % 24)}px` : '4px',
          animation: active ? `pulse-bar 0.6s ease-in-out ${i * 0.04}s infinite alternate` : undefined,
        }}
      />
    ))}
    <style>{`
      @keyframes pulse-bar {
        from { transform: scaleY(0.35); opacity: 0.5; }
        to { transform: scaleY(1); opacity: 1; }
      }
    `}</style>
  </div>
);
