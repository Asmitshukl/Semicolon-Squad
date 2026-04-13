import React from 'react';

export const StatsBar: React.FC = () => {
  return (
    <section className="bg-transparent border-y border-white/[0.06] py-16 px-8 relative z-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-slate-500 text-xs font-bold tracking-[0.2em] uppercase mb-10">
          — LIVE PLATFORM STATISTICS
        </h2>
        
        <div className="flex flex-col md:flex-row gap-10 md:gap-0 justify-between md:divide-x divide-white/[0.08]">
          {[
            { n: '1,247', enl: 'FIRs Today', hil: 'आज की FIR' },
            { n: '358', enl: 'BNS Sections', hil: 'BNS धाराएं' },
            { n: '89', enl: 'Officers Online', hil: 'अधिकारी ऑनलाइन' },
            { n: '2', enl: 'Languages', hil: 'भाषाएं' }
          ].map((s, i) => (
            <div key={i} className={`flex flex-col flex-1 ${i !== 0 ? 'md:pl-10' : ''}`}>
              <span className="text-white text-[52px] font-bold leading-[1.1] mb-2">{s.n}</span>
              <span className="text-slate-400 text-xs tracking-widest uppercase mb-1">{s.enl}</span>
              <span className="text-slate-500 text-[11px] font-medium">{s.hil}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
