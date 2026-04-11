/** Small Ashoka-style wheel for officer navbar */
export const ChakraMini = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden>
    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="5" className="text-[#F97316]" />
    {Array.from({ length: 24 }, (_, i) => {
      const rad = ((i * 360) / 24 - 90) * (Math.PI / 180);
      return (
        <line
          key={i}
          x1={50 + 14 * Math.cos(rad)}
          y1={50 + 14 * Math.sin(rad)}
          x2={50 + 40 * Math.cos(rad)}
          y2={50 + 40 * Math.sin(rad)}
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-[#F97316]"
        />
      );
    })}
    <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="3" className="text-[#F97316]" />
  </svg>
);
