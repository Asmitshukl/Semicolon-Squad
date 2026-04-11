import { useEffect, useState } from 'react';
import { stationService } from '../../services/stationService';

export const VictimStationPage = () => {
  const [query, setQuery] = useState('');
  const [stations, setStations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadStations = async (value?: string) => {
    try {
      setError(null);
      const data = await stationService.list(value);
      setStations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load stations.');
    }
  };

  useEffect(() => {
    void loadStations();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', padding: '32px 20px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <p style={{ color: '#f97316', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Station Finder
        </p>
        <h1 style={{ fontSize: 32, margin: '8px 0 16px' }}>Nearest police station and online FIR portal</h1>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by state, district, or station code"
            style={{ flex: 1, background: '#171717', color: '#fff', border: '1px solid #262626', borderRadius: 12, padding: 12 }}
          />
          <button onClick={() => void loadStations(query)} style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 18px' }}>
            Search
          </button>
        </div>
        {error && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'grid', gap: 16 }}>
          {stations.map((station) => (
            <div key={station.id} style={{ background: '#171717', borderRadius: 16, padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>{station.name}</h3>
              <p style={{ color: '#cbd5e1' }}>
                {station.address}, {station.district}, {station.state} - {station.pincode}
              </p>
              <p style={{ color: '#93c5fd' }}>Station code: {station.stationCode} | Phone: {station.phone}</p>
              <p style={{ color: '#facc15' }}>{station.jurisdictionArea}</p>
              {station.onlineFirPortal && (
                <a href={station.onlineFirPortal} target="_blank" rel="noreferrer" style={{ color: '#86efac' }}>
                  State online FIR portal
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VictimStationPage;
