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

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

const pickMime = () => {
  const c = 'audio/webm;codecs=opus';
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  return '';
};

const getSpeechRecognitionCtor = (): SpeechRecognitionCtor | null => {
  const maybe = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return maybe.SpeechRecognition ?? maybe.webkitSpeechRecognition ?? null;
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
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'listening' | 'unsupported'>('idle');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const durationSecsRef = useRef(0);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const finalPartsRef = useRef<string[]>([]);
  const speechShouldResumeRef = useRef(false);

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

  const resetTranscription = () => {
    setTranscript('');
    setFinalTranscript('');
    finalPartsRef.current = [];
  };

  const stopSpeechRecognition = () => {
    speechShouldResumeRef.current = false;
    speechRef.current?.stop();
    speechRef.current = null;
    setSpeechStatus('idle');
  };

  const startSpeechRecognition = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSpeechStatus('unsupported');
      return;
    }

    const speech = new Ctor();
    speechShouldResumeRef.current = true;
    speech.continuous = true;
    speech.interimResults = true;
    speech.lang = language === 'bh' ? 'hi-IN' : `${language}-IN`;
    speech.onresult = (event) => {
      const interim: string[] = [];
      const finals = [...finalPartsRef.current];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const value = result[0]?.transcript?.trim();
        if (!value) continue;
        if (result.isFinal) finals.push(value);
        else interim.push(value);
      }
      finalPartsRef.current = finals;
      const finalValue = finals.join(' ').trim();
      setFinalTranscript(finalValue);
      setTranscript([...finals, ...interim].join(' ').trim());
    };
    speech.onerror = (event) => {
      setSpeechStatus('idle');
      setError(`Live transcription unavailable: ${event.error}`);
    };
    (speech as SpeechRecognitionLike & { onend?: (() => void) | null }).onend = () => {
      speechRef.current = null;
      if (!speechShouldResumeRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setSpeechStatus('idle');
        return;
      }
      window.setTimeout(() => {
        if (speechShouldResumeRef.current && mediaRecorderRef.current?.state !== 'inactive') {
          startSpeechRecognition();
        }
      }, 150);
    };
    speech.start();
    speechRef.current = speech;
    setSpeechStatus('listening');
  };

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    chunksRef.current = [];
    resetTranscription();
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
      startSpeechRecognition();
    } catch {
      setError('Could not access the microphone. Check browser permissions.');
    }
  }, [language]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    clearTick();
    stopSpeechRecognition();
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
      if (finalTranscript.trim() || transcript.trim()) {
        fd.append('rawText', (finalTranscript || transcript).trim());
      }
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
        (Whisper ASR to NER to IndicBERT), you will get transcript, BNS sections, and rights in one step. If that
        service is offline, your recorded audio and the visible browser transcript below will still be saved.
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
            Recording... {seconds}s
          </span>
        )}
        {audioBlob && !recording && (
          <span style={{ color: '#86efac', fontSize: 14 }}>Clip ready ({Math.round(audioBlob.size / 1024)} KB)</span>
        )}
      </div>
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>
            Visible While Recording
          </strong>
          <span
            style={{
              fontSize: 12,
              color:
                speechStatus === 'listening'
                  ? '#86efac'
                  : speechStatus === 'unsupported'
                    ? '#fbbf24'
                    : '#94a3b8',
            }}
          >
            {speechStatus === 'listening'
              ? 'Browser transcription is active'
              : speechStatus === 'unsupported'
                ? 'Browser transcription is not supported here'
                : 'Transcript will appear here while you speak'}
          </span>
        </div>
        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={7}
          placeholder="Say your statement clearly. Live transcript text will show up here so you can confirm the recording is capturing what you said."
          style={transcriptStyle}
        />
      </div>
      <div style={panelStyle}>
        <strong style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>
          Recording Status
        </strong>
        <div style={{ display: 'grid', gap: 8, color: '#e5e7eb', fontSize: 14 }}>
          <span>{recording ? `Recording in progress (${seconds}s)` : audioBlob ? 'Recording captured' : 'Waiting to record'}</span>
          <span>{finalTranscript || transcript ? 'Transcript ready for review' : 'Transcript pending'}</span>
          <span>{busy ? 'Sending audio to the AI pipeline' : 'Review the transcript below before submitting'}</span>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled || busy || (!audioBlob && !recording)}
        onClick={handleSubmitAudio}
        style={btnPrimary}
      >
        {busy ? 'Processing...' : 'Send audio & run AI pipeline'}
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

const panelStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 16,
  padding: 16,
};

const transcriptStyle: CSSProperties = {
  width: '100%',
  background: '#0b1120',
  color: '#fff',
  borderRadius: 12,
  padding: 14,
  border: '1px solid #1f2937',
  minHeight: 160,
  resize: 'vertical',
};
