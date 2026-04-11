import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStatement } from '../../features/victim/statement/useStatement';
import { StatementVoiceTab } from '../../features/victim/statement/StatementVoiceTab';
import { mlPipelineService } from '../../services/mlPipelineService';

type Tab = 'text' | 'voice';

export const VictimStatementPage = () => {
  const navigate = useNavigate();
  const { latestStatement, isLoading, error, reload } = useStatement();
  const [tab, setTab] = useState<Tab>('text');
  const [rawText, setRawText] = useState('');
  const [language, setLanguage] = useState('hi');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [witnessDetails, setWitnessDetails] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (latestStatement?.rawText) {
      setRawText(latestStatement.rawText as string);
    }
  }, [latestStatement?.id, latestStatement?.rawText]);

  const goClassify = (statementId: string) => {
    void reload();
    navigate('/victim/classify', { state: { statementId } });
  };

  const handleTextSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPageError(null);
    setSaving(true);
    try {
      const result = await mlPipelineService.runText({
        rawText,
        language,
        incidentDate,
        incidentTime,
        incidentLocation,
        witnessDetails,
      });
      goClassify(result.statement.id);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e instanceof Error ? e.message : 'Could not save your statement.');
      setPageError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', padding: '32px 20px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <p style={{ color: '#f97316', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Statement Prep
        </p>
        <h1 style={{ fontSize: 32, margin: '8px 0 10px' }}>Describe what happened</h1>
        <p style={{ color: '#94a3b8', marginBottom: 20 }}>
          Text or voice: your complaint runs through the same backend pipeline (ASR when audio is used, then NER,
          IndicBERT multi-label BNS mapping, and victim rights). Set <code style={{ color: '#fdba74' }}>ML_SERVICE_URL</code> on
          the server to attach your Python models.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['text', 'voice'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                ...tabBtn,
                background: tab === t ? 'rgba(249,115,22,0.25)' : '#171717',
                borderColor: tab === t ? '#f97316' : '#262626',
              }}
            >
              {t === 'text' ? 'Typed statement' : 'Voice (Hindi / Hinglish)'}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Language code</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ ...fieldStyle, maxWidth: 200 }}
          >
            <option value="hi">hi — Hindi / Hinglish</option>
            <option value="en">en — English</option>
          </select>
        </div>

        {(error || pageError) && (
          <div style={{ color: '#fca5a5', marginBottom: 16 }}>{pageError ?? error}</div>
        )}

        {tab === 'text' ? (
          <form onSubmit={handleTextSubmit} style={{ display: 'grid', gap: 16 }}>
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
              <input
                type="text"
                value={incidentLocation}
                onChange={(e) => setIncidentLocation(e.target.value)}
                placeholder="Incident location"
                style={fieldStyle}
              />
            </div>
            <textarea
              value={witnessDetails}
              onChange={(e) => setWitnessDetails(e.target.value)}
              rows={3}
              placeholder="Witness names or details"
              style={{ background: '#171717', color: '#fff', borderRadius: 16, padding: 16, border: '1px solid #262626' }}
            />
            <button type="submit" disabled={saving || isLoading} style={buttonStyle}>
              {saving ? 'Running pipeline…' : 'Save & run AI pipeline'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} style={fieldStyle} />
              <input type="time" value={incidentTime} onChange={(e) => setIncidentTime(e.target.value)} style={fieldStyle} />
              <input
                type="text"
                value={incidentLocation}
                onChange={(e) => setIncidentLocation(e.target.value)}
                placeholder="Incident location"
                style={fieldStyle}
              />
            </div>
            <textarea
              value={witnessDetails}
              onChange={(e) => setWitnessDetails(e.target.value)}
              rows={2}
              placeholder="Witness names or details (optional)"
              style={{ background: '#171717', color: '#fff', borderRadius: 16, padding: 16, border: '1px solid #262626' }}
            />
            <StatementVoiceTab
              language={language}
              incidentDate={incidentDate}
              incidentTime={incidentTime}
              incidentLocation={incidentLocation}
              witnessDetails={witnessDetails}
              disabled={saving || isLoading}
              onComplete={goClassify}
            />
          </div>
        )}

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

const tabBtn: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid #262626',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 14,
};

export default VictimStatementPage;
