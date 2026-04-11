import { useState, type FormEvent } from 'react';
import { useTracker } from '../../features/victim/tracker/useTracker';

export const VictimTrackerPage = () => {
  const { cases, trackedCase, error, isLoading, trackCase } = useTracker();
  const [acknowledgmentNo, setAcknowledgmentNo] = useState('');

  const handleTrack = async (event: FormEvent) => {
    event.preventDefault();
    if (acknowledgmentNo.trim()) {
      await trackCase(acknowledgmentNo.trim());
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', padding: '32px 20px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <p style={{ color: '#f97316', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Case Tracker
        </p>
        <h1 style={{ fontSize: 32, margin: '8px 0 16px' }}>Track your FIR and acknowledgments</h1>
        <form onSubmit={handleTrack} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input
            value={acknowledgmentNo}
            onChange={(e) => setAcknowledgmentNo(e.target.value)}
            placeholder="Enter acknowledgment number"
            style={{ flex: 1, background: '#171717', color: '#fff', border: '1px solid #262626', borderRadius: 12, padding: 12 }}
          />
          <button type="submit" style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 18px' }}>
            Track
          </button>
        </form>
        {isLoading && <div>Loading...</div>}
        {error && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>}

        {trackedCase && (
          <div style={{ background: '#111827', borderRadius: 16, padding: 18, marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}>{trackedCase.acknowledgmentNo}</h3>
            <p style={{ color: '#cbd5e1' }}>{trackedCase.status} at {trackedCase.station?.name}</p>
            <ul style={{ color: '#cbd5e1', paddingLeft: 18 }}>
              {(trackedCase.caseUpdates ?? []).map((update: any) => (
                <li key={update.id}>{update.status}{update.note ? ` - ${update.note}` : ''}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: 'grid', gap: 16 }}>
          {cases.map((item) => (
            <div key={item.id} style={{ background: '#171717', borderRadius: 16, padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>{item.firNumber ?? item.acknowledgmentNo ?? 'Draft FIR'}</h3>
              <p style={{ color: '#cbd5e1' }}>{item.status} | {item.station?.name}</p>
              <p style={{ color: '#93c5fd' }}>{item.incidentLocation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VictimTrackerPage;
