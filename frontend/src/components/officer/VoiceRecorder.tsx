import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square, Upload, Loader2 } from 'lucide-react';
import { WaveformDisplay } from './WaveformDisplay';
import { officerService } from '../../services/officerService';
import type { MockFIR, VoiceRec } from '../../data/officerMock';
import { useNavigate } from 'react-router-dom';

type Props = {
  onUploaded?: (recording: VoiceRec) => void;
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

const LANGUAGES = [
  { code: 'hi', label: 'Hindi' },
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'Marathi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'bh', label: 'Bhojpuri' },
];

const getSpeechRecognitionCtor = (): SpeechRecognitionCtor | null => {
  const maybe = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return maybe.SpeechRecognition ?? maybe.webkitSpeechRecognition ?? null;
};

const pickMime = () => {
  const preferred = 'audio/webm;codecs=opus';
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(preferred)) return preferred;
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  return '';
};

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `00:${minutes}:${seconds}`;
};

export const VoiceRecorder = ({ onUploaded }: Props) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingFir, setGeneratingFir] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [language, setLanguage] = useState('hi');
  const [firId, setFirId] = useState('');
  const [firs, setFirs] = useState<MockFIR[]>([]);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedRecording, setUploadedRecording] = useState<VoiceRec | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const finalPartsRef = useRef<string[]>([]);

  useEffect(() => {
    let active = true;
    if (!open) return;
    void officerService
      .listFirs()
      .then((items) => {
        if (active) setFirs(items);
      })
      .catch(() => {
        if (active) setFirs([]);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const selectedFir = useMemo(() => firs.find((item) => item.id === firId), [firId, firs]);

  const stopSpeechRecognition = () => {
    speechRef.current?.stop();
    speechRef.current = null;
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const clearTimer = () => {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const resetDraft = () => {
    setRecording(false);
    setElapsed(0);
    setTranscript('');
    setFinalTranscript('');
    setAudioBlob(null);
    setUploadedRecording(null);
    setError(null);
    setSuccess(null);
    finalPartsRef.current = [];
    clearTimer();
    stopSpeechRecognition();
    stopStream();
    recorderRef.current = null;
    chunksRef.current = [];
  };

  const startSpeechRecognition = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const speech = new Ctor();
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
      setFinalTranscript(finals.join(' ').trim());
      setTranscript([...finals, ...interim].join(' ').trim());
    };
    speech.onerror = (event) => {
      setError(`Live transcription unavailable: ${event.error}`);
    };
    speech.start();
    speechRef.current = speech;
  };

  const startRecording = async () => {
    resetDraft();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMime();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start(250);
      startedAtRef.current = Date.now();
      setRecording(true);
      tickRef.current = window.setInterval(() => {
        setElapsed(Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)));
      }, 500);
      startSpeechRecognition();
    } catch {
      setError('Microphone access failed. Please allow mic permissions and try again.');
    }
  };

  const stopRecording = async () => {
    clearTimer();
    stopSpeechRecognition();
    const recorder = recorderRef.current;
    
    if (!recorder) {
      setRecording(false);
      stopStream();
      return;
    }

    // Check the recorder state
    if (recorder.state === 'inactive') {
      setRecording(false);
      stopStream();
      return;
    }

    // Set up the stop handler BEFORE calling stop()
    return new Promise<void>((resolve) => {
      const onStop = () => {
        // Remove the listener to avoid duplicate calls
        recorder.removeEventListener('stop', onStop);
        
        // Create blob from recorded chunks
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        // Only set blob if it has data
        setAudioBlob(blob.size > 0 ? blob : null);
        setRecording(false);
        stopStream();
        
        resolve();
      };

      recorder.addEventListener('stop', onStop);
      
      // Call stop to trigger the stop event
      try {
        recorder.stop();
      } catch (error) {
        console.error('Error stopping recorder:', error);
        setRecording(false);
        stopStream();
        resolve();
      }
    });
  };

  const uploadRecording = async () => {
    if (!audioBlob) {
      setError('Record a statement first.');
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = new FormData();
      payload.append('audio', audioBlob, `voice-statement.${audioBlob.type.includes('ogg') ? 'ogg' : 'webm'}`);
      payload.append('language', language);
      if (firId) payload.append('firId', firId);
      if (finalTranscript || transcript) payload.append('rawText', (finalTranscript || transcript).trim());
      payload.append('durationSecs', String(Math.max(1, elapsed)));

      const uploaded = await officerService.uploadVoiceRecording(payload);
      const merged = {
        ...uploaded,
        transcript: uploaded.transcript || transcript || finalTranscript,
      };
      setUploadedRecording(merged);
      setTranscript(merged.transcript || '');
      setFinalTranscript(merged.transcript || '');
      setSuccess(
        selectedFir
          ? `Recording linked to ${selectedFir.firNo} and transcript saved.`
          : 'Recording uploaded and transcript saved.',
      );
      onUploaded?.(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateFir = async () => {
    if (!uploadedRecording) {
      setError('Upload the voice recording first.');
      return;
    }
    try {
      setGeneratingFir(true);
      setError(null);
      const fir = await officerService.generateFIRFromRecording(uploadedRecording.id);
      setSuccess(`Draft FIR ${fir.firNo} generated with BNS and IPC mapping.`);
      navigate(`/officer/fir/${fir.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate FIR from recording.');
    } finally {
      setGeneratingFir(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => {
            if (open) resetDraft();
            setOpen((prev) => !prev);
          }}
          className="rounded-xl bg-[#F97316] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-[#ea580c]"
        >
          {open ? 'Close Recorder' : 'New Recording'}
        </button>
      </div>

      {open ? (
        <div className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <select
              value={firId}
              onChange={(event) => setFirId(event.target.value)}
              className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
            >
              <option value="">Unlinked recording</option>
              {firs.map((fir) => (
                <option key={fir.id} value={fir.id}>
                  {fir.firNo} - {fir.bnsTitle}
                </option>
              ))}
            </select>

            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
            >
              {LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center gap-4 py-4">
            <button
              type="button"
              onClick={() => void (recording ? stopRecording() : startRecording())}
              disabled={uploading}
              className={`flex h-20 w-20 items-center justify-center rounded-full border-4 transition-colors ${
                recording
                  ? 'border-[#DC2626] bg-[#DC2626] text-white'
                  : 'border-white/[0.12] bg-white/[0.06] text-[#F97316]'
              }`}
            >
              {recording ? <Square className="h-8 w-8" strokeWidth={2.5} /> : <Mic className="h-9 w-9" strokeWidth={2} />}
            </button>
            <WaveformDisplay active={recording} />
            <p className="font-mono text-lg text-white tabular-nums">{formatTime(elapsed)}</p>
            <p className="text-xs text-[#9CA3AF]">
              {recording
                ? 'Live transcription uses browser speech recognition when available.'
                : 'Stop recording to review and upload the transcript.'}
            </p>
          </div>

          {error ? <p className="text-sm text-[#FCA5A5]">{error}</p> : null}
          {success ? <p className="text-sm text-[#86EFAC]">{success}</p> : null}

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#6B7280]">Visible While Recording</p>
              <textarea
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                rows={8}
                placeholder="Live transcript will appear here while recording."
                className="w-full rounded-xl border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-[#D1D5DB] outline-none"
              />
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#6B7280]">Workflow Status</p>
              <div className="space-y-2 text-sm text-[#D1D5DB]">
                <p>{audioBlob ? 'Audio clip captured' : 'Waiting for recording'}</p>
                <p>{finalTranscript || transcript ? 'Transcript ready for review' : 'Transcript pending'}</p>
                <p>{selectedFir ? `Will link to ${selectedFir.firNo}` : 'Ready to generate a new FIR draft after upload'}</p>
              </div>
              <button
                type="button"
                onClick={() => void uploadRecording()}
                disabled={recording || uploading || !audioBlob}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Processing Recording' : 'Upload, Transcribe, Link'}
              </button>
              {!selectedFir && uploadedRecording ? (
                <button
                  type="button"
                  onClick={() => void handleGenerateFir()}
                  disabled={recording || uploading || generatingFir}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#F97316]/40 bg-[#F97316]/10 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#FDBA74] hover:bg-[#F97316]/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatingFir ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {generatingFir ? 'Generating FIR Draft' : 'Generate FIR Report'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
