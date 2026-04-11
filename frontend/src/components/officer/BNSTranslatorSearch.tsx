import { Search } from 'lucide-react';

export const BNSTranslatorSearch = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="relative">
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search by keyword, BNS number, or IPC number..."
      className="w-full rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] py-4 pl-4 pr-12 text-sm text-white placeholder:text-[#4B5563]"
    />
    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F97316]" strokeWidth={2} />
  </div>
);
