import { Link } from 'react-router-dom';
import type { MockFIR } from '../../data/officerMock';
import { FIRCard } from './FIRCard';

export const UrgencyQueue = ({ items }: { items: MockFIR[] }) => (
  <section>
    <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase mb-1">— प्राथमिकता · URGENCY QUEUE</p>
    <p className="text-xs text-[#6B7280] mb-6">FIRs requiring attention, sorted by severity</p>
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((f) => (
        <FIRCard key={f.id} fir={f} />
      ))}
    </div>
    <div className="mt-6">
      <Link to="/officer/fir" className="text-sm font-semibold text-[#6B7280] hover:text-[#F97316]">
        View all FIRs →
      </Link>
    </div>
  </section>
);
