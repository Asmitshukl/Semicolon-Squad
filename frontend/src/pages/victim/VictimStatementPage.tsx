import { useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStatement } from '../../features/victim/statement/useStatement';

export const VictimStatementPage = () => {
  const navigate = useNavigate();
  const { latestStatement, isLoading, error, saveStatement } = useStatement();
  const [rawText, setRawText] = useState(latestStatement?.rawText ?? '');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [witnessDetails, setWitnessDetails] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const created = await saveStatement({
      rawText,
      incidentDate,
      incidentTime,
      incidentLocation,
      witnessDetails,
      language: 'en',
    });
    navigate('/victim/classify', { state: { statementId: created.id } });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', padding: '32px 20px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <p style={{ color: '#f97316', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Statement Prep
        </p>
        <h1 style={{ fontSize: 32, margin: '8px 0 10px' }}>Describe what happened</h1>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>
          We will help you prepare your complaint, classify the likely BNS section, and explain your rights before you visit the police station.
        </p>
        {error && <div style={{ color: '#fca5a5', marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            placeholder="Describe the incident in your own words..."
            style={{ background: '#171717', color: '#fff', borderRadius: 16, padding: 16, border: '1px solid #262626' }}
          />
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} style={fieldStyle} />
            <input type="time" value={incidentTime} onChange={(e) => setIncidentTime(e.target.value)} style={fieldStyle} />
            <input type="text" value={incidentLocation} onChange={(e) => setIncidentLocation(e.target.value)} placeholder="Incident location" style={fieldStyle} />
          </div>
          <textarea
            value={witnessDetails}
            onChange={(e) => setWitnessDetails(e.target.value)}
            rows={3}
            placeholder="Witness names or details"
            style={{ background: '#171717', color: '#fff', borderRadius: 16, padding: 16, border: '1px solid #262626' }}
          />
          <button type="submit" disabled={isLoading} style={buttonStyle}>
            {isLoading ? 'Saving...' : 'Save and classify'}
          </button>
        </form>
        {latestStatement && (
          <div style={{ marginTop: 24, background: '#111827', borderRadius: 16, padding: 18 }}>
            <h2 style={{ marginTop: 0 }}>Latest saved statement</h2>
            <p style={{ color: '#cbd5e1' }}>{latestStatement.rawText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const fieldStyle: CSSProperties = {
  background: '#171717',
  color: '#fff',
  borderRadius: 12,
  padding: 12,
  border: '1px solid #262626',
};

const buttonStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '14px 18px',
  fontWeight: 700,
  cursor: 'pointer',
};

export default VictimStatementPage;
