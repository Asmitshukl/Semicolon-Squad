import { useCallback, useEffect, useRef, useState } from 'react';
import { UrgencyQueue } from '../../components/officer/UrgencyQueue';
import { officerService } from '../../services/officerService';
import type { MockFIR } from '../../data/officerMock';
import { RefreshCw } from 'lucide-react';

const OPERATIONS_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80';

const POLL_INTERVAL_MS = 30_000; // 30 s

type DashboardStat = { value: string; label: string; labelHi: string };

const urgencyOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export const OfficerDashboard = () => {
  const [showHeroImage, setShowHeroImage] = useState(true);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [queueFirs, setQueueFirs] = useState<MockFIR[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<number | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await officerService.getDashboard();
      setStats(data.stats);
      // Sort urgency queue: CRITICAL → HIGH → MEDIUM → LOW
      const sorted = [...data.queue].sort(
        (a, b) => (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9),
      );
      setQueueFirs(sorted);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void load(false);
  }, [load]);

  // Auto-refresh every 30 s
  useEffect(() => {
    intervalRef.current = window.setInterval(() => void load(true), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current != null) window.clearInterval(intervalRef.current);
    };
  }, [load]);

  const urgencyColor = (u: string) => {
    if (u === '0' || u === 'CRITICAL') return 'text-[#DC2626]';
    if (u === 'HIGH') return 'text-[#F97316]';
    return 'text-white';
  };

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
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#6B7280] uppercase">
                — Live Dashboard · लाइव डैशबोर्ड
              </p>
              {lastUpdated && (
                <p className="text-[10px] text-[#4B5563] mt-1 font-mono">
                  Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
                  {' '}· Auto-refreshes every 30s
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={refreshing || loading}
              onClick={() => void load(true)}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] hover:bg-white/[0.08] disabled:opacity-50 transition-all"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#F97316]' : ''}`}
                strokeWidth={2.5}
              />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-y-8 lg:grid-cols-4 lg:gap-y-0">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`text-center lg:px-8 ${i > 0 ? 'border-l border-white/[0.08]' : ''}`}
                  >
                    <div className="h-14 w-20 mx-auto rounded-lg bg-white/[0.05] animate-pulse" />
                    <div className="h-3 w-24 mx-auto mt-3 rounded bg-white/[0.05] animate-pulse" />
                  </div>
                ))
              : stats.map((s, i) => (
                  <div
                    key={s.label}
                    className={`text-center lg:px-8 ${i > 0 ? 'border-l border-white/[0.08]' : ''}`}
                  >
                    <div
                      className={`font-extrabold leading-none tabular-nums transition-all ${
                        i === 0 ? 'text-[56px]' : 'text-[48px]'
                      } ${i === 0 && parseInt(s.value) > 0 ? urgencyColor(s.value) : 'text-white'}`}
                    >
                      {s.value}
                    </div>
                    <p className="mt-2 text-[11px] font-bold tracking-[0.12em] text-[#6B7280] uppercase">
                      {s.label}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-[#6B7280]">{s.labelHi}</p>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {error ? (
        <div className="mb-6 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 px-4 py-3 text-sm text-[#FCA5A5]">
          {error}
        </div>
      ) : null}

      {/* Urgency queue */}
      {!loading && queueFirs.length === 0 && !error ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-10 text-center">
          <p className="text-[#6B7280] text-sm">No FIRs in the urgency queue.</p>
          <p className="text-[#4B5563] text-xs mt-1">New FIRs will appear here automatically.</p>
        </div>
      ) : (
        <UrgencyQueue items={queueFirs} />
      )}
    </div>
  );
};

export default OfficerDashboard;
