import { useEffect, useState } from 'react';
import { UrgencyQueue } from '../../components/officer/UrgencyQueue';
import { officerService } from '../../services/officerService';
import type { MockFIR } from '../../data/officerMock';

const OPERATIONS_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80';

type DashboardStat = { value: string; label: string; labelHi: string };

export const OfficerDashboard = () => {
  const [showHeroImage, setShowHeroImage] = useState(true);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [queueFirs, setQueueFirs] = useState<MockFIR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void officerService
      .getDashboard()
      .then((data) => {
        if (!active) return;
        setStats(data.stats);
        setQueueFirs(data.queue);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <section className="relative mb-12 overflow-hidden">
        {showHeroImage ? (
          <div className="absolute inset-0 z-0">
            <img
              src={OPERATIONS_ROOM_IMAGE}
              alt=""
              className="h-full w-full object-cover opacity-[0.07] grayscale"
              onError={() => setShowHeroImage(false)}
            />
          </div>
        ) : null}

        <div className="relative z-[1] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="grid grid-cols-2 gap-y-8 lg:grid-cols-4 lg:gap-y-0">
            {stats.map((s, i) => (
              <div key={s.label} className={`text-center lg:px-8 ${i > 0 ? 'border-l border-white/[0.08]' : ''}`}>
                <div
                  className={`font-extrabold leading-none text-white tabular-nums ${
                    i === 0 ? 'text-[56px]' : 'text-[48px]'
                  }`}
                >
                  {loading ? '—' : s.value}
                </div>
                <p className="mt-2 text-[11px] font-bold tracking-[0.12em] text-[#6B7280] uppercase">{s.label}</p>
                <p className="mt-1 text-[10px] font-semibold text-[#6B7280]">{s.labelHi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? <p className="mb-6 text-sm text-[#FCA5A5]">{error}</p> : null}
      <UrgencyQueue items={queueFirs} />
    </div>
  );
};

export default OfficerDashboard;
