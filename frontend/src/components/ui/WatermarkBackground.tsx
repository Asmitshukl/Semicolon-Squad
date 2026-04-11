const AshokaChakra = ({ isDark }: { isDark: boolean }) => {
  const CX = 200, CY = 200;
  const R_OUTER = 185;
  const R_SPOKE_OUTER = 168;
  const R_SPOKE_INNER = 28;
  const R_HUB = 22;
  const SPOKES = 24;
  const c = isDark ? "white" : "black";

  const spokes = Array.from({ length: SPOKES }, (_, i) => {
    const angleDeg = (i * 360) / SPOKES - 90; 
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x1: CX + R_SPOKE_INNER * Math.cos(rad),
      y1: CY + R_SPOKE_INNER * Math.sin(rad),
      x2: CX + R_SPOKE_OUTER * Math.cos(rad),
      y2: CY + R_SPOKE_OUTER * Math.sin(rad),
    };
  });

  return (
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      <circle cx={CX} cy={CY} r={R_OUTER} stroke={c} strokeWidth="10" />
      <circle cx={CX} cy={CY} r={R_OUTER - 14} stroke={c} strokeWidth="2" strokeDasharray="2 6" />
      {spokes.map(({ x1, y1, x2, y2 }, i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="3.5" strokeLinecap="round" />
      ))}
      <circle cx={CX} cy={CY} r={R_HUB} stroke={c} strokeWidth="5" fill={c} fillOpacity="0.1" />
      <circle cx={CX} cy={CY} r={10} stroke={c} strokeWidth="2" fill={c} fillOpacity="0.2" />
    </svg>
  );
};

const ScalesOfJustice = ({ isDark }: { isDark: boolean }) => {
  const c = isDark ? "white" : "black";
  return (
  <svg viewBox="0 0 420 480" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
    <circle cx="210" cy="36" r="10" stroke={c} strokeWidth="2" />
    <line x1="210" y1="46" x2="210" y2="64" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
    <rect x="205" y="64" width="10" height="310" rx="3" stroke={c} strokeWidth="1.5" />
    <rect x="198" y="190" width="24" height="7" rx="2" stroke={c} strokeWidth="1.2" />
    <rect x="198" y="260" width="24" height="7" rx="2" stroke={c} strokeWidth="1.2" />
    <circle cx="210" cy="106" r="18" stroke={c} strokeWidth="2.5" fill={c} fillOpacity="0.05" />
    <circle cx="210" cy="106" r="7" stroke={c} strokeWidth="1.5" />
    <path d="M 30 100 Q 120 96 210 100 Q 300 104 390 108" stroke={c} strokeWidth="4" strokeLinecap="round" />
    <circle cx="30" cy="100" r="7" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.08" />
    <circle cx="390" cy="108" r="7" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.08" />
    <line x1="30" y1="107" x2="30" y2="278" stroke={c} strokeWidth="1.8" strokeDasharray="6 5" strokeLinecap="round" />
    <line x1="390" y1="115" x2="390" y2="296" stroke={c} strokeWidth="1.8" strokeDasharray="6 5" strokeLinecap="round" />
    <path d="M -10 278 Q 30 300 70 278" stroke={c} strokeWidth="2.8" strokeLinecap="round" />
    <line x1="-10" y1="272" x2="-10" y2="278" stroke={c} strokeWidth="2" />
    <line x1="70" y1="272" x2="70" y2="278" stroke={c} strokeWidth="2" />
    <path d="M 348 296 Q 390 318 432 296" stroke={c} strokeWidth="2.8" strokeLinecap="round" />
    <line x1="348" y1="290" x2="348" y2="296" stroke={c} strokeWidth="2" />
    <line x1="432" y1="290" x2="432" y2="296" stroke={c} strokeWidth="2" />
    <rect x="184" y="374" width="52" height="11" rx="3" stroke={c} strokeWidth="1.8" />
    <rect x="164" y="385" width="92" height="11" rx="3" stroke={c} strokeWidth="1.5" />
    <rect x="138" y="396" width="144" height="13" rx="4" stroke={c} strokeWidth="1.2" />
    <ellipse cx="210" cy="414" rx="114" ry="9" stroke={c} strokeWidth="1" />
  </svg>
)};

export const WatermarkBackground = ({ isDark }: { isDark: boolean }) => (
  <>
    {/* Ashoka Chakra — kept subtle so dashboard content stays readable */}
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0"
         style={{ opacity: isDark ? 0.018 : 0.012, left: '-12%', top: '2%' }}>
      <div style={{ width: '52vw', height: '52vw', minWidth: 320, maxWidth: 640 }}>
        <AshokaChakra isDark={isDark} />
      </div>
    </div>

    {/* Scales of Justice */}
    <div className="fixed pointer-events-none select-none z-0"
         style={{ bottom: '-8%', right: '6%', opacity: isDark ? 0.022 : 0.015, width: '22vw', minWidth: 220, maxWidth: 340 }}>
      <ScalesOfJustice isDark={isDark} />
    </div>
  </>
);
