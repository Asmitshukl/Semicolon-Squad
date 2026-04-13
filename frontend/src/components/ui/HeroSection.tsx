import React from 'react';
import { Link } from 'react-router-dom';
import { AshokaChakraSVG } from '../ui/AshokaChakraSVG';
import { Scale, ShieldCheck, Mic, FileText, Brain } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full min-h-[calc(100vh-100px)] flex flex-col md:flex-row overflow-hidden bg-transparent">
      <style>{`
        @keyframes spin-cw {
          from { transform: rotate(0deg) translateX(var(--r)) rotate(0deg); }
          to { transform: rotate(360deg) translateX(var(--r)) rotate(-360deg); }
        }
        @keyframes spin-ccw {
          from { transform: rotate(0deg) translateX(var(--r)) rotate(0deg); }
          to { transform: rotate(-360deg) translateX(var(--r)) rotate(360deg); }
        }
      `}</style>
      
      {/* LEFT SIDE (50%) */}
      <div className="w-full md:w-1/2 relative px-8 flex flex-col justify-center py-20 z-10 bg-gradient-to-r from-[#12100E] via-[#12100E]/80 to-transparent animate-slide-up">
        
        <div className="max-w-xl xl:pl-12">
          <div className="flex items-center gap-3 mb-8">
             <div className="h-[2px] w-6 bg-gradient-to-r from-[#FFEA7E] to-[#D2701A]"></div>
             <span className="text-[#A39D95] text-xs font-bold tracking-[0.25em] uppercase drop-shadow-md">न्याय · DIGITAL JUSTICE SYSTEM</span>
          </div>

          <h1 className="text-[72px] md:text-[84px] font-bold leading-[1.0] mb-8 tracking-tight flex flex-col drop-shadow-[0_12px_16px_rgba(0,0,0,0.9)]">
            <span className="text-[#FFFFFF]">न्याय आपकी</span>
            <span className="bg-gradient-to-b from-[#FFE373] via-[#F2A33A] to-[#D6711C] text-transparent bg-clip-text pb-2 px-1 -ml-1">
              उंगलियों पर।
            </span>
          </h1>
          
          <p className="text-[#B5AFA6] text-[17px] max-w-[440px] mb-12 leading-relaxed font-medium drop-shadow-md bg-[#12100E]/40 p-1 rounded-sm">
            India's first AI-powered FIR platform. Know your rights,
            prepare your complaint, and connect with justice — before
            you even reach the police station.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-12">
            <Link 
              to="/register/victim"
              className="bg-gradient-to-b from-[#FFEA7E] via-[#F2A63B] to-[#D2701A] text-[#12100E] rounded-sm px-8 py-3.5 text-sm font-black tracking-widest uppercase hover:opacity-90 transition-opacity drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] shadow-lg shadow-[#D6711C]/20"
            >
              GET STARTED →
            </Link>
            <Link 
              to="/login"
              className="text-[#E5E5E0] border border-white/10 bg-white/5 backdrop-blur-sm rounded-sm px-8 py-3.5 text-sm font-black tracking-widest uppercase hover:bg-white/10 transition-colors shadow-lg"
            >
              OFFICER LOGIN
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[#8A857D] text-[12px] font-medium tracking-wide drop-shadow-sm">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#10B981]"></span>
              End-to-end encrypted
            </span>
            <span className="opacity-40">·</span>
            <span>BNS 2024 Compliant</span>
            <span className="opacity-40">·</span>
            <span>6 Regional Languages</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (50%) — ORBITAL ANIMATION */}
      <div className="w-full md:w-1/2 relative bg-transparent flex items-center justify-center min-h-[500px] md:min-h-full overflow-hidden z-10 animate-fade-in" style={{ animationDuration: '1.5s' }}>
        
        <div className="relative w-[500px] h-[500px] scale-[0.6] sm:scale-75 lg:scale-100 flex items-center justify-center">
          
          {/* Static Trails */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none text-white/[0.08]">
            <circle cx="250" cy="250" r="165" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx="250" cy="250" r="265" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
          </svg>

          {/* Center Chakra */}
          <div className="absolute z-10 w-[110px] h-[110px] opacity-95 animate-[spin_40s_linear_infinite]" style={{ filter: 'drop-shadow(0 0 35px rgba(230,134,37,0.75))' }}>
            <AshokaChakraSVG className="w-full h-full stroke-2" stroke="url(#gold-grad)" />
          </div>

          {/* ORBIT RING 1 (r=165px, cw, 22s) */}
          <div className="absolute w-full h-full pointer-events-none z-20">
             <div 
               className="absolute top-1/2 left-1/2 w-[44px] h-[44px] -ml-[22px] -mt-[22px] rounded-full bg-[#12100E] border border-white/10 flex flex-col items-center justify-center overflow-hidden animate-[spin-cw_22s_linear_infinite] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
               style={{ '--r': '165px' } as React.CSSProperties}
             >
                <div className="w-full h-1/3 bg-[#FF6B00]"></div>
                <div className="w-full h-1/3 bg-[#FAFAFA] relative flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#12100E] border-[0.5px] border-[#F2A63B]"></div>
                </div>
                <div className="w-full h-1/3 bg-[#138808]"></div>
             </div>
             <div 
               className="absolute top-1/2 left-1/2 w-[44px] h-[44px] -ml-[22px] -mt-[22px] rounded-full bg-[#12100E] border border-white/10 flex items-center justify-center animate-[spin-cw_22s_linear_infinite] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
               style={{ '--r': '165px', animationDelay: '-7.33s' } as React.CSSProperties}
             >
                <Scale className="w-[18px] h-[18px]" stroke="url(#gold-grad)" />
             </div>
             <div 
               className="absolute top-1/2 left-1/2 w-[44px] h-[44px] -ml-[22px] -mt-[22px] rounded-full bg-[#12100E] border border-white/10 flex items-center justify-center animate-[spin-cw_22s_linear_infinite] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
               style={{ '--r': '165px', animationDelay: '-14.66s' } as React.CSSProperties}
             >
                <span className="bg-gradient-to-b from-[#FFE373] via-[#F2A33A] to-[#D6711C] text-transparent bg-clip-text font-mono text-[20px] font-bold leading-none">§</span>
             </div>
          </div>

          {/* ORBIT RING 2 (r=265px, ccw, 38s) */}
          <div className="absolute w-full h-full pointer-events-none z-20">
             <div 
               className="absolute top-1/2 left-1/2 w-[36px] h-[36px] -ml-[18px] -mt-[18px] rounded-full bg-[#12100E] border border-white/10 flex items-center justify-center animate-[spin-ccw_38s_linear_infinite] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
               style={{ '--r': '265px', animationDelay: '0s' } as React.CSSProperties}
             >
                <ShieldCheck className="w-[16px] h-[16px] text-green-500" />
             </div>
             <div 
               className="absolute top-1/2 left-1/2 w-[36px] h-[36px] -ml-[18px] -mt-[18px] rounded-full bg-[#12100E] border border-white/10 flex items-center justify-center animate-[spin-ccw_38s_linear_infinite] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
               style={{ '--r': '265px', animationDelay: '-7.6s' } as React.CSSProperties}
             >
                <Mic className="w-[16px] h-[16px]" stroke="url(#gold-grad)" />
             </div>
             <div 
               className="absolute top-1/2 left-1/2 w-[36px] h-[36px] -ml-[18px] -mt-[18px] rounded-full bg-[#12100E] border border-white/10 flex items-center justify-center animate-[spin-ccw_38s_linear_infinite] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
               style={{ '--r': '265px', animationDelay: '-15.2s' } as React.CSSProperties}
             >
                <span className="bg-gradient-to-b from-[#FFE373] via-[#F2A33A] to-[#D6711C] text-transparent bg-clip-text font-mono text-[10px] tracking-wider font-bold">BNS</span>
             </div>
             <div 
               className="absolute top-1/2 left-1/2 w-[36px] h-[36px] -ml-[18px] -mt-[18px] rounded-full bg-[#12100E] border border-white/10 flex items-center justify-center animate-[spin-ccw_38s_linear_infinite] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
               style={{ '--r': '265px', animationDelay: '-22.8s' } as React.CSSProperties}
             >
                <FileText className="w-[16px] h-[16px]" stroke="url(#gold-grad)" />
             </div>
             <div 
               className="absolute top-1/2 left-1/2 w-[36px] h-[36px] -ml-[18px] -mt-[18px] rounded-full bg-[#12100E] border border-white/10 flex items-center justify-center animate-[spin-ccw_38s_linear_infinite] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
               style={{ '--r': '265px', animationDelay: '-30.4s' } as React.CSSProperties}
             >
                <img src="/images/national_emblem.jpg" alt="Emblem" className="w-[18px] h-[18px] object-contain opacity-90" style={{ filter: 'sepia(1) saturate(3) hue-rotate(-15deg) brightness(1.2)' }} />
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
