import { useEffect, type CSSProperties } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useClassification } from '../../features/victim/classification/useClassification';

export const VictimClassifyPage = () => {
  const location = useLocation();
  const statementId = (location.state as { statementId?: string } | null)?.statementId;
  const { classification, resolution, rights, isLoading, error, classify } = useClassification();

  useEffect(() => {
    void classify(statementId);
  }, [classify, statementId]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', padding: '32px 20px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <p style={{ color: '#f97316', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Crime Classifier
        </p>
        <h1 style={{ fontSize: 32, margin: '8px 0 20px' }}>Likely BNS mapping and victim guidance</h1>
        {isLoading && <div>Analyzing your statement...</div>}
        {error && <div style={{ color: '#fca5a5' }}>{error}</div>}
        {classification && (
          <div style={{ display: 'grid', gap: 20 }}>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>
                BNS {classification.bnsSection.sectionNumber}: {classification.bnsSection.sectionTitle}
              </h2>
              <p style={{ color: '#cbd5e1' }}>{classification.bnsSection.description}</p>
              <p style={{ color: '#f97316' }}>
                Confidence: {Math.round(classification.confidenceScore * 100)}% | Urgency: {classification.urgencyLevel}
              </p>
              <p style={{ color: '#93c5fd' }}>{classification.urgencyReason}</p>
            </section>

            {resolution && (
              <section style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Expected resolution</h3>
                <p style={{ color: '#cbd5e1' }}>Punishment range: {resolution.punishmentRange}</p>
                <p style={{ color: '#cbd5e1' }}>Fine range: {resolution.fineRange}</p>
                <p style={{ color: '#fde68a' }}>{resolution.compensationNote}</p>
                <ul style={{ color: '#cbd5e1', paddingLeft: 18 }}>
                  {(resolution.expectedNextSteps ?? []).map((item: string) => (
                    <li key={item} style={{ marginBottom: 8 }}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {rights && (
              <section style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Immediate victim rights</h3>
                <ul style={{ color: '#cbd5e1', paddingLeft: 18 }}>
                  {(rights.rights ?? []).map((right: any) => (
                    <li key={right.title} style={{ marginBottom: 8 }}>
                      <strong>{right.title}</strong>: {right.detail}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 12 }}>
                  <Link to="/victim/station" style={{ color: '#93c5fd' }}>Find nearest police station</Link>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const cardStyle: CSSProperties = {
  background: '#171717',
  borderRadius: 16,
  padding: 20,
  border: '1px solid #262626',
};

export default VictimClassifyPage;
