import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square, Upload, Loader2, Download, FileText } from 'lucide-react';
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

/* ── Print-window PDF generator ───────────────────────────────────────
   Opens a styled HTML page in a new window and triggers window.print().
   The browser converts it to PDF natively — supports all Unicode/Hindi.  */
const openTranscriptPrintWindow = (
  recording: VoiceRec,
  linkedFir: MockFIR | undefined,
): void => {
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });

  // ── Build BNS section HTML ─────────────────────────────────────────
  let sectionsHtml = '';
  if (linkedFir && linkedFir.sectionMappings && linkedFir.sectionMappings.length > 0) {
    for (const sec of linkedFir.sectionMappings) {
      sectionsHtml += `
        <div class="section-card">
          <div class="section-header">BNS &sect; ${sec.sectionNumber} &mdash; ${sec.sectionTitle}</div>
          ${sec.ipcEquivalent ? `<div class="section-row"><span class="label">IPC Equivalent:</span> &sect; ${sec.ipcEquivalent}${sec.ipcTitle ? ` (${sec.ipcTitle})` : ''}</div>` : ''}
          <div class="section-row">
            <span class="badge ${sec.cognizable ? 'badge-red' : 'badge-gray'}">${sec.cognizable ? 'Cognizable' : 'Non-Cognizable'}</span>
            <span class="badge ${sec.bailable ? 'badge-green' : 'badge-red'}">${sec.bailable ? 'Bailable' : 'Non-Bailable'}</span>
          </div>
          ${sec.description ? `<div class="section-desc">${sec.description}</div>` : ''}
          ${sec.reasoning ? `<div class="section-reasoning"><span class="label">AI Reasoning:</span> ${sec.reasoning}</div>` : ''}
        </div>`;
    }
  } else if (linkedFir) {
    sectionsHtml = `
      <div class="section-card">
        <div class="section-header">${linkedFir.bnsCode} &mdash; ${linkedFir.bnsTitle}</div>
        <div class="section-row"><span class="label">IPC Equivalent:</span> ${linkedFir.ipcEquiv}</div>
        <div class="section-row"><span class="label">Punishment:</span> ${linkedFir.punishmentLine}</div>
        <div class="section-row">
          <span class="badge badge-red">${linkedFir.cognizable}</span>
          <span class="badge badge-red">${linkedFir.bailable}</span>
        </div>
      </div>`;
  } else {
    sectionsHtml = '<p class="muted">BNS/IPC sections will be mapped after FIR generation. Use &ldquo;Generate FIR Draft&rdquo; to trigger AI section mapping.</p>';
  }

  const transcriptText = (recording.transcript || 'No transcript available.')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>NyayaSetu &mdash; Voice Statement Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 20px; color: #1a1a1a; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #555; margin-bottom: 20px; }
    .header-bar { border-top: 4px solid #FF9933; border-bottom: 4px solid #138808; padding: 12px 0; margin-bottom: 24px; }
    .triline { width: 100%; height: 4px; background: linear-gradient(to right, #FF9933 33%, #fff 33% 66%, #138808 66%); margin-bottom: 16px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 32px; margin-bottom: 24px; }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 2px; }
    .meta-value { font-size: 13px; font-weight: 600; color: #111; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #555; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; margin: 24px 0 12px; }
    .section-card { border: 1px solid #e0e0e0; border-left: 4px solid #1a56db; border-radius: 4px; padding: 12px 14px; margin-bottom: 12px; background: #f9fafb; }
    .section-header { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
    .section-row { font-size: 12px; margin-bottom: 6px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .section-desc { font-size: 12px; color: #444; margin-top: 8px; line-height: 1.7; border-top: 1px solid #e5e5e5; padding-top: 8px; }
    .section-reasoning { font-size: 12px; color: #555; margin-top: 8px; font-style: italic; line-height: 1.7; }
    .label { font-weight: 600; color: #333; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-gray { background: #f3f4f6; color: #374151; }
    .transcript-box { background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px; font-size: 13px; line-height: 1.9; white-space: pre-wrap; word-break: break-word; margin-top: 8px; font-family: 'Noto Sans', 'Segoe UI', Arial, sans-serif; }
    .muted { color: #888; font-style: italic; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e5e5; padding-top: 12px; font-size: 11px; color: #888; text-align: center; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      .section-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="triline"></div>
  <div class="header-bar">
    <h1>NyayaSetu &mdash; Voice Statement &amp; FIR Draft Report</h1>
    <p class="subtitle">Bharatiya Nyaya Sanhita (BNS) 2024 | Ministry of Home Affairs, Government of India</p>
  </div>

  <h2>Recording Details</h2>
  <div class="meta-grid">
    <div class="meta-item"><span class="meta-label">Generated</span><span class="meta-value">${now}</span></div>
    <div class="meta-item"><span class="meta-label">Recording ID</span><span class="meta-value">${recording.label}</span></div>
    <div class="meta-item"><span class="meta-label">Duration</span><span class="meta-value">${recording.duration}</span></div>
    <div class="meta-item"><span class="meta-label">Language</span><span class="meta-value">${recording.language.toUpperCase()}</span></div>
    <div class="meta-item"><span class="meta-label">Recorded At</span><span class="meta-value">${recording.recordedAt}</span></div>
    <div class="meta-item"><span class="meta-label">Officer Verified</span><span class="meta-value">${recording.verified ? '&#10003; Yes' : 'Pending'}</span></div>
    ${linkedFir ? `
    <div class="meta-item"><span class="meta-label">FIR Number</span><span class="meta-value">${linkedFir.firNo}</span></div>
    <div class="meta-item"><span class="meta-label">FIR Status</span><span class="meta-value">${linkedFir.status}</span></div>` : ''}
  </div>

  <h2>BNS / IPC Section Mapping</h2>
  ${sectionsHtml}

  <h2>Victim / Witness Transcript</h2>
  <div class="transcript-box">${transcriptText}</div>

  <div class="footer">
    NyayaSetu Digital Justice System &nbsp;&bull;&nbsp; Bharatiya Nyaya Sanhita 2024 &nbsp;&bull;&nbsp; Ministry of Home Affairs, GoI
  </div>

  <script>
    // Auto-trigger print dialog after fonts load
    window.onload = function() { setTimeout(function() { window.print(); }, 400); };
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    // Fallback if popups are blocked: download as an HTML file
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NyayaSetu-Report-${recording.id.slice(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
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

    if (recorder.state === 'inactive') {
      setRecording(false);
      stopStream();
      return;
    }

    return new Promise<void>((resolve) => {
      const onStop = () => {
        recorder.removeEventListener('stop', onStop);
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob.size > 0 ? blob : null);
        setRecording(false);
        stopStream();
        resolve();
      };

      recorder.addEventListener('stop', onStop);
      try {
        recorder.stop();
      } catch (err) {
        console.error('Error stopping recorder:', err);
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
          : 'Recording uploaded and transcript saved. You can now generate a FIR draft or download the transcript PDF.',
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
      // Short delay so the success message is visible before navigation
      setTimeout(() => navigate(`/officer/fir/${fir.id}`), 1200);
    } catch (err: unknown) {
      // Surface the real server error message so the officer can see what failed
      const msg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Failed to generate FIR.');
      console.error('[GenerateFIR] Error:', err);
      setError(msg);
    } finally {
      setGeneratingFir(false);
    }
  };

  const handleDownloadTranscriptPdf = () => {
    if (!uploadedRecording) {
      setError('Upload recording first.');
      return;
    }
    try {
      openTranscriptPrintWindow(uploadedRecording, selectedFir);
      setSuccess('Print dialog opened — use "Save as PDF" to download.');
    } catch (err) {
      console.error('[PDF] Error opening print window:', err);
      setError('Could not open print window. Please allow pop-ups for this site.');
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
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#6B7280]">Live Transcript</p>
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

              {/* Upload button */}
              <button
                type="button"
                onClick={() => void uploadRecording()}
                disabled={recording || uploading || !audioBlob}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Processing Recording' : 'Upload, Transcribe, Link'}
              </button>

              {/* Download Transcript PDF — available right after upload */}
              {uploadedRecording ? (
                <button
                  type="button"
                  onClick={handleDownloadTranscriptPdf}
                  disabled={recording || uploading}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#3B82F6]/40 bg-[#3B82F6]/10 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#93C5FD] hover:bg-[#3B82F6]/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  Download Transcript PDF
                </button>
              ) : null}

              {/* Generate FIR Draft — only for unlinked recordings */}
              {!selectedFir && uploadedRecording ? (
                <button
                  type="button"
                  onClick={() => void handleGenerateFir()}
                  disabled={recording || uploading || generatingFir}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#F97316]/40 bg-[#F97316]/10 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#FDBA74] hover:bg-[#F97316]/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatingFir ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {generatingFir ? 'Generating FIR Draft…' : 'Generate FIR Draft'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
