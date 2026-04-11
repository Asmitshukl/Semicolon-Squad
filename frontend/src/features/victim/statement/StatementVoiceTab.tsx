import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { mlPipelineService } from '../../../services/mlPipelineService';

type Props = {
  language: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  witnessDetails: string;
  disabled?: boolean;
  onComplete: (statementId: string) => void;
};

const pickMime = () => {
  const c = 'audio/webm;codecs=opus';
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  return '';
};

export const StatementVoiceTab = ({
  language,
  incidentDate,
  incidentTime,
  incidentLocation,
  witnessDetails,
  disabled,
  onComplete,
}: Props) => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const durationSecsRef = useRef(0);

  const clearTick = () => {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    chunksRef.current = [];
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone is not available in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.start(250);
      startedAtRef.current = Date.now();
      setSeconds(0);
      tickRef.current = window.setInterval(() => {
        setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);
      setRecording(true);
    } catch {
      setError('Could not access the microphone. Check browser permissions.');
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    clearTick();
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') {
      setRecording(false);
      stopStream();
      return Promise.resolve(null);
    }
    return new Promise<Blob | null>((resolve) => {
      mr.onstop = () => {
        durationSecsRef.current = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        stopStream();
        mediaRecorderRef.current = null;
        setRecording(false);
        resolve(blob.size ? blob : null);
      };
      mr.stop();
    });
  }, []);

  const handleStopClick = async () => {
    const blob = await stopRecording();
    if (blob) setAudioBlob(blob);
  };

  const handleSubmitAudio = async () => {
    setError(null);
    let blob = audioBlob;
    if (recording) {
      const b = await stopRecording();
      if (b) {
        blob = b;
        setAudioBlob(b);
      }
    }
    if (!blob || blob.size < 32) {
      setError('Record a short clip first (a few seconds is enough).');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'complaint.webm');
      fd.append('language', language);
      if (incidentDate) fd.append('incidentDate', incidentDate);
      if (incidentTime) fd.append('incidentTime', incidentTime);
      if (incidentLocation) fd.append('incidentLocation', incidentLocation);
      if (witnessDetails) fd.append('witnessDetails', witnessDetails);
      fd.append('durationSecs', String(durationSecsRef.current || Math.max(1, seconds)));
      const result = await mlPipelineService.runAudio(fd);
      onComplete(result.statement.id);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e instanceof Error ? e.message : 'Upload failed.');
      setError(String(msg));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <p style={{ color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
        Speak in Hindi or Hinglish. Your audio is sent to the server; when the Python ML service is connected
        (Whisper ASR → NER → IndicBERT), you will get transcript, BNS sections, and rights in one step.
      </p>
      {error && <div style={{ color: '#fca5a5' }}>{error}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        {!recording ? (
          <button type="button" disabled={disabled || busy} onClick={startRecording} style={btnPrimary}>
            Start recording
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={handleStopClick} style={btnDanger}>
            Stop
          </button>
        )}
        {recording && (
          <span style={{ color: '#f97316', fontWeight: 600 }}>
            Recording… {seconds}s
          </span>
        )}
        {audioBlob && !recording && (
          <span style={{ color: '#86efac', fontSize: 14 }}>Clip ready ({Math.round(audioBlob.size / 1024)} KB)</span>
        )}
      </div>
      <button
        type="button"
        disabled={disabled || busy || (!audioBlob && !recording)}
        onClick={handleSubmitAudio}
        style={btnPrimary}
      >
        {busy ? 'Processing…' : 'Send audio & run AI pipeline'}
      </button>
    </div>
  );
};

const btnPrimary: CSSProperties = {
  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '12px 18px',
  fontWeight: 700,
  cursor: 'pointer',
};

const btnDanger: CSSProperties = {
  ...btnPrimary,
  background: '#b91c1c',
};
