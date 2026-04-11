import { useEffect, useState } from 'react';
import { bnsService } from '../../services/bnsService';

export const VictimRightsPage = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void bnsService
      .getRights()
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Unable to load rights information.'),
      );
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', padding: '32px 20px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <p style={{ color: '#f97316', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Victim Rights
        </p>
        <h1 style={{ fontSize: 32, margin: '8px 0 20px' }}>Know your BNSS rights and next steps</h1>
        {error && <div style={{ color: '#fca5a5', marginBottom: 20 }}>{error}</div>}
        {data?.section && (
          <div style={{ background: '#171717', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <h2 style={{ marginTop: 0 }}>
              BNS {data.section.number}: {data.section.title}
            </h2>
            <p style={{ color: '#cbd5e1' }}>{data.section.victimsRightsNote}</p>
            <p style={{ color: '#facc15' }}>{data.section.compensationNote}</p>
          </div>
        )}
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {(data?.rights ?? []).map((right: any) => (
            <div key={right.title} style={{ background: '#171717', borderRadius: 16, padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>{right.title}</h3>
              <p style={{ color: '#f97316', fontSize: 13 }}>{right.basis}</p>
              <p style={{ color: '#cbd5e1' }}>{right.detail}</p>
            </div>
          ))}
        </div>
        <div style={{ background: '#111827', borderRadius: 16, padding: 20, marginTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>Pre-FIR checklist</h3>
          <ul style={{ color: '#cbd5e1', paddingLeft: 18 }}>
            {(data?.preFirChecklist ?? []).map((item: string) => (
              <li key={item} style={{ marginBottom: 8 }}>{item}</li>
            ))}
          </ul>
          <p style={{ color: '#93c5fd' }}>{data?.zeroFirGuidance}</p>
        </div>
      </div>
    </div>
  );
};

export default VictimRightsPage;
