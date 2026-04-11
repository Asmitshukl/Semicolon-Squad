import { DASHBOARD_STATS, MOCK_FIRS } from '../../data/officerMock';
import { UrgencyQueue } from '../../components/officer/UrgencyQueue';

const queueFirs = MOCK_FIRS.slice(0, 4);

export const OfficerDashboard = () => (
  <div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-white/[0.08] mb-10">
      {DASHBOARD_STATS.map((s, i) => (
        <div key={s.label} className={`text-center lg:px-8 ${i === 0 ? '' : ''}`}>
          <div className="text-[48px] lg:text-[56px] font-extrabold leading-none text-white tabular-nums">{s.value}</div>
          <p className="mt-2 text-[11px] font-bold tracking-[0.12em] text-[#6B7280] uppercase">{s.label}</p>
          <p className="mt-1 text-[10px] text-[#6B7280] font-semibold">{s.labelHi}</p>
        </div>
      ))}
    </div>

    <hr className="border-0 h-px bg-white/[0.08] mb-12" />

    <UrgencyQueue items={queueFirs} />
  </div>
);

export default OfficerDashboard;
