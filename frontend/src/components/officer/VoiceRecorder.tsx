import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Upload, Loader2, FileText } from "lucide-react";
import { WaveformDisplay } from "./WaveformDisplay";
import { officerService } from "../../services/officerService";
import type { MockFIR, VoiceRec } from "../../data/officerMock";
import { jsPDF } from "jspdf";

type Props = {
  onUploaded?: (recording: VoiceRec) => void;
};

type BnsSection = {
  sectionNumber: string;
  sectionTitle: string;
  ipcEquivalent: string | null;
  ipcTitle: string | null;
  description?: string | null;
  reasoning?: string | null;
  cognizable: boolean;
  bailable: boolean;
};

const LANGUAGES = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "mr", label: "Marathi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "bh", label: "Bhojpuri" },
];

const pickMime = () => {
  const preferred = "audio/webm;codecs=opus";
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(preferred))
    return preferred;
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm"))
    return "audio/webm";
  return "";
};

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `00:${minutes}:${seconds}`;
};

/* ── PDF generation ─────────────────────────────────────────────── */
const PDF_MARGIN = 50;
const LINE_H = 14;

const addNewPageIfNeeded = (doc: jsPDF, y: number, needed = LINE_H + 4): number => {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - PDF_MARGIN) {
    doc.addPage();
    return PDF_MARGIN + 20;
  }
  return y;
};

const drawSectionHeader = (doc: jsPDF, text: string, y: number): number => {
  const pageW = doc.internal.pageSize.getWidth();
  y = addNewPageIfNeeded(doc, y, 30);
  doc.setFillColor(30, 30, 30);
  doc.rect(PDF_MARGIN, y, pageW - PDF_MARGIN * 2, 20, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(249, 115, 22);
  doc.text(text.toUpperCase(), PDF_MARGIN + 8, y + 13);
  return y + 28;
};

const drawLabelValue = (
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  labelW = 130,
): number => {
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - PDF_MARGIN * 2;
  y = addNewPageIfNeeded(doc, y, LINE_H + 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(`${label}:`, PDF_MARGIN, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 20, 20);
  const wrapped = doc.splitTextToSize(value, contentW - labelW) as string[];
  doc.text(wrapped, PDF_MARGIN + labelW, y);
  return y + Math.max(LINE_H, wrapped.length * LINE_H);
};

const drawFilledTextBlock = (doc: jsPDF, text: string, y: number): number => {
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - PDF_MARGIN * 2;
  const innerW = contentW - 20;

  const paragraphs = text.trim().split(/\n+/);
  const allLines: string[] = [];
  for (const para of paragraphs) {
    const wrapped = doc.splitTextToSize(para.trim(), innerW) as string[];
    allLines.push(...wrapped, "");
  }
  // Remove trailing blank
  if (allLines[allLines.length - 1] === "") allLines.pop();

  // Calculate total height needed
  const totalLines = allLines.length;
  const blockH = totalLines * LINE_H + 20;

  // If block doesn't fit on current page, add a new page
  const pageH = doc.internal.pageSize.getHeight();
  if (y + blockH > pageH - PDF_MARGIN) {
    doc.addPage();
    y = PDF_MARGIN + 20;
  }

  // Draw background first
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.rect(PDF_MARGIN, y, contentW, blockH, "FD");

  // Draw text on top
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  let ty = y + 14;
  for (const line of allLines) {
    ty = addNewPageIfNeeded(doc, ty);
    if (line !== "") {
      doc.text(line, PDF_MARGIN + 10, ty);
    }
    ty += LINE_H;
  }

  return Math.max(ty, y + blockH) + 10;
};

const generateFirPdf = (
  transcript: string,
  firNo: string | null,
  language: string,
  recordedAt: string,
  bnsSections: BnsSection[],
): void => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Header ─────────────────────────────────────────────────────
  doc.setFillColor(16, 16, 16);
  doc.rect(0, 0, pageW, 76, "F");

  // Orange left accent
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, 5, 76, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("NyayaSetu — FIR Voice Statement Report", PDF_MARGIN, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(160, 160, 160);
  doc.text("Digital Police Portal · Government of India Initiative", PDF_MARGIN, 46);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}`,
    PDF_MARGIN,
    60,
  );

  let y = 96;

  // ── Recording Metadata ──────────────────────────────────────────
  y = drawSectionHeader(doc, "Recording Details", y);
  y = drawLabelValue(doc, "FIR / Reference No.", firNo || "Unlinked Recording", y);
  y = drawLabelValue(doc, "Language of Recording", LANGUAGES.find((l) => l.code === language)?.label ?? language, y);
  y = drawLabelValue(doc, "Recorded At", recordedAt, y);
  y = drawLabelValue(doc, "Word Count (English)", `${transcript.trim().split(/\s+/).filter(Boolean).length} words`, y);
  y += 10;

  // ── Transcript ──────────────────────────────────────────────────
  y = drawSectionHeader(doc, "Transcribed Statement (English — Whisper AI)", y);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "The following text is the English transcription of the victim's voice statement as processed by Whisper AI.",
    PDF_MARGIN,
    y,
  );
  y += 16;

  y = drawFilledTextBlock(doc, transcript || "(No transcript available)", y);

  // ── BNS / IPC Sections ──────────────────────────────────────────
  if (bnsSections.length > 0) {
    y = drawSectionHeader(doc, `Applicable BNS / IPC Sections (${bnsSections.length} identified)`, y);

    for (let i = 0; i < bnsSections.length; i++) {
      const sec = bnsSections[i];
      y = addNewPageIfNeeded(doc, y, 80);

      // Section card background
      doc.setFillColor(245, 245, 245);
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      const cardStartY = y;

      // Title row
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(249, 115, 22);
      doc.text(`BNS §${sec.sectionNumber}`, PDF_MARGIN + 8, y + 14);

      doc.setTextColor(20, 20, 20);
      doc.text(`— ${sec.sectionTitle}`, PDF_MARGIN + 70, y + 14);
      y += 22;

      // IPC equivalent
      if (sec.ipcEquivalent) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(
          `IPC Equivalent: §${sec.ipcEquivalent}${sec.ipcTitle ? ` — ${sec.ipcTitle}` : ""}`,
          PDF_MARGIN + 8,
          y,
        );
        y += LINE_H;
      }

      // Cognizable / Bailable
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(
        `${sec.cognizable ? "Cognizable" : "Non-Cognizable"} · ${sec.bailable ? "Bailable" : "Non-Bailable"}`,
        PDF_MARGIN + 8,
        y,
      );
      y += LINE_H;

      // Description
      if (sec.description) {
        const pageW2 = doc.internal.pageSize.getWidth();
        const descLines = doc.splitTextToSize(sec.description, pageW2 - PDF_MARGIN * 2 - 16) as string[];
        doc.setTextColor(50, 50, 50);
        for (const line of descLines) {
          y = addNewPageIfNeeded(doc, y);
          doc.text(line, PDF_MARGIN + 8, y);
          y += LINE_H;
        }
      }

      // Reasoning
      if (sec.reasoning) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 100, 100);
        const pageW3 = doc.internal.pageSize.getWidth();
        const rLines = doc.splitTextToSize(`Reason: ${sec.reasoning}`, pageW3 - PDF_MARGIN * 2 - 16) as string[];
        for (const line of rLines) {
          y = addNewPageIfNeeded(doc, y);
          doc.text(line, PDF_MARGIN + 8, y);
          y += LINE_H - 2;
        }
      }

      const cardH = y - cardStartY + 8;
      doc.rect(PDF_MARGIN, cardStartY, pageW - PDF_MARGIN * 2, cardH, "FD");

      // Re-draw text on top of the card fill
      // (Text was drawn before rect background so we re-draw)
      let ry = cardStartY;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(249, 115, 22);
      doc.text(`BNS §${sec.sectionNumber}`, PDF_MARGIN + 8, ry + 14);
      doc.setTextColor(20, 20, 20);
      doc.text(`— ${sec.sectionTitle}`, PDF_MARGIN + 70, ry + 14);
      ry += 22;
      if (sec.ipcEquivalent) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(
          `IPC Equivalent: §${sec.ipcEquivalent}${sec.ipcTitle ? ` — ${sec.ipcTitle}` : ""}`,
          PDF_MARGIN + 8,
          ry,
        );
        ry += LINE_H;
      }
      doc.text(
        `${sec.cognizable ? "Cognizable" : "Non-Cognizable"} · ${sec.bailable ? "Bailable" : "Non-Bailable"}`,
        PDF_MARGIN + 8,
        ry,
      );
      ry += LINE_H;

      y += i < bnsSections.length - 1 ? 12 : 6;
    }
  } else {
    y = addNewPageIfNeeded(doc, y, 30);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(
      "No BNS/IPC sections have been mapped yet. Link this recording to a FIR to see applicable sections.",
      PDF_MARGIN,
      y,
    );
    y += 20;
  }

  // ── Footer ──────────────────────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages?.() ?? 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const ph = doc.internal.pageSize.getHeight();
    const pw = doc.internal.pageSize.getWidth();
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.5);
    doc.line(PDF_MARGIN, ph - 38, pw - PDF_MARGIN, ph - 38);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "This is an auto-generated transcript from NyayaSetu. Subject to officer verification before official use.",
      PDF_MARGIN,
      ph - 26,
    );
    doc.text(`Page ${p} of ${totalPages}`, pw - PDF_MARGIN - 50, ph - 26);
  }

  const filename = firNo
    ? `FIR_Voice_${firNo.replace(/[^\w.-]+/g, "_")}.pdf`
    : `Voice_Statement_${Date.now()}.pdf`;
  doc.save(filename);
};

/* ── Component ──────────────────────────────────────────────────── */
export const VoiceRecorder = ({ onUploaded }: Props) => {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingFir, setFetchingFir] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [language, setLanguage] = useState("hi");
  const [firId, setFirId] = useState("");
  const [firs, setFirs] = useState<MockFIR[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedRecording, setUploadedRecording] = useState<VoiceRec | null>(null);
  const [whisperTranscript, setWhisperTranscript] = useState<string>("");
  const [bnsSections, setBnsSections] = useState<BnsSection[]>([]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    if (!open) return;
    void officerService.listFirs().then((items) => {
      if (active) setFirs(items);
    }).catch(() => { if (active) setFirs([]); });
    return () => { active = false; };
  }, [open]);

  const selectedFir = useMemo(() => firs.find((item) => item.id === firId), [firId, firs]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
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
    setAudioBlob(null);
    setUploadedRecording(null);
    setWhisperTranscript("");
    setBnsSections([]);
    setError(null);
    setSuccess(null);
    clearTimer();
    stopStream();
    recorderRef.current = null;
    chunksRef.current = [];
  };

  const startRecording = async () => {
    resetDraft();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMime();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(250);
      startedAtRef.current = Date.now();
      setRecording(true);
      tickRef.current = window.setInterval(() => {
        setElapsed(Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)));
      }, 500);
    } catch {
      setError("Microphone access failed. Please allow mic permissions and try again.");
    }
  };

  const stopRecording = async () => {
    clearTimer();
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setRecording(false);
      stopStream();
      return;
    }
    return new Promise<void>((resolve) => {
      const onStop = () => {
        recorder.removeEventListener("stop", onStop);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioBlob(blob.size > 0 ? blob : null);
        setRecording(false);
        stopStream();
        resolve();
      };
      recorder.addEventListener("stop", onStop);
      try { recorder.stop(); } catch { setRecording(false); stopStream(); resolve(); }
    });
  };

  const uploadRecording = async () => {
    if (!audioBlob) { setError("Record a statement first."); return; }
    setUploading(true);
    setError(null);
    setSuccess(null);
    setWhisperTranscript("");
    setBnsSections([]);
    try {
      // ── Step 1: Upload audio to backend (saves the recording) ─────
      const payload = new FormData();
      payload.append(
        "audio",
        audioBlob,
        `voice-statement.${audioBlob.type.includes("ogg") ? "ogg" : "webm"}`,
      );
      payload.append("language", language);
      if (firId) payload.append("firId", firId);
      payload.append("durationSecs", String(Math.max(1, elapsed)));

      const uploaded = await officerService.uploadVoiceRecording(payload);
      setUploadedRecording(uploaded);

      // ── Step 2: Classify transcript through ML to get BNS/IPC sections ──
      // We already have the transcript — POST text to /v1/classify (fast, no re-Whisper)
      let transcript = uploaded.transcript ?? "";
      let sections: BnsSection[] = [];

      if (transcript) {
        try {
          const classRes = await fetch("http://127.0.0.1:8000/v1/pipeline/json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ raw_text: transcript, language }),
          });
          if (classRes.ok) {
            const classData = (await classRes.json()) as {
              transcript?: string;
              classifications?: Array<{
                section_number: string;
                confidence: number;
                title?: string | null;
              }>;
              entities?: {
                cognizable?: boolean;
                bailable?: boolean;
                ipc_equivalents?: Record<string, string>;
              };
            };

            if (classData.classifications && classData.classifications.length > 0) {
              const ipcMap: Record<string, string> = classData.entities?.ipc_equivalents ?? {};
              sections = classData.classifications.map((c) => ({
                sectionNumber: c.section_number,
                sectionTitle: c.title ?? `BNS Section ${c.section_number}`,
                ipcEquivalent: ipcMap[c.section_number] ?? null,
                ipcTitle: null,
                description: null,
                reasoning: `AI model confidence: ${(c.confidence * 100).toFixed(0)}%`,
                cognizable: classData.entities?.cognizable ?? true,
                bailable: classData.entities?.bailable ?? false,
              }));
            }
          }
        } catch {
          // ML service unreachable — will fall back to FIR lookup below
        }
      }

      // ── Step 3: Fallback — fetch BNS from linked FIR if ML gave nothing ──
      if (sections.length === 0) {
        const linkedFirId = uploaded.firId ?? firId;
        if (linkedFirId) {
          try {
            setFetchingFir(true);
            const fir = await officerService.getFir(linkedFirId);
            sections = fir.sectionMappings ?? [];
          } catch {
            // ignore
          } finally {
            setFetchingFir(false);
          }
        }
      }

      setWhisperTranscript(transcript);
      setBnsSections(sections);

      setSuccess(
        transcript
          ? `Transcription complete (${transcript.split(/\s+/).filter(Boolean).length} words)${sections.length ? ` · ${sections.length} BNS/IPC section${sections.length > 1 ? "s" : ""} identified` : ""}. Ready to generate PDF.`
          : "Recording uploaded. Transcript processing — please wait a moment then generate PDF.",
      );
      onUploaded?.(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };


  const handleGeneratePdf = () => {
    const transcript = whisperTranscript.trim();
    if (!uploadedRecording) {
      setError("Upload the recording first to get the transcript.");
      return;
    }
    if (!transcript) {
      setError("Whisper transcript is not available yet. Please wait for processing to complete.");
      return;
    }
    setGeneratingPdf(true);
    setError(null);
    try {
      generateFirPdf(
        transcript,
        selectedFir?.firNo ?? uploadedRecording.firNo ?? null,
        language,
        uploadedRecording.recordedAt,
        bnsSections,
      );
      setSuccess("PDF downloaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const canGeneratePdf = !!uploadedRecording && !!whisperTranscript.trim() && !uploading && !recording;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => { if (open) resetDraft(); setOpen((p) => !p); }}
          className="rounded-xl bg-[#F97316] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-[#ea580c]"
        >
          {open ? "Close Recorder" : "New Recording"}
        </button>
      </div>

      {open ? (
        <div className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-6 space-y-5">
          {/* FIR + Language selectors */}
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <select
              value={firId}
              onChange={(e) => setFirId(e.target.value)}
              className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
            >
              <option value="">Unlinked recording (new FIR)</option>
              {firs.map((fir) => (
                <option key={fir.id} value={fir.id}>{fir.firNo} — {fir.bnsTitle}</option>
              ))}
            </select>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
            >
              {LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
          </div>

          {/* Record button */}
          <div className="flex flex-col items-center gap-4 py-4">
            <button
              type="button"
              onClick={() => void (recording ? stopRecording() : startRecording())}
              disabled={uploading}
              className={`flex h-20 w-20 items-center justify-center rounded-full border-4 transition-colors ${recording
                  ? "border-[#DC2626] bg-[#DC2626] text-white animate-pulse"
                  : "border-white/[0.12] bg-white/[0.06] text-[#F97316]"
                }`}
            >
              {recording ? <Square className="h-8 w-8" strokeWidth={2.5} /> : <Mic className="h-9 w-9" strokeWidth={2} />}
            </button>
            <WaveformDisplay active={recording} />
            <p className="font-mono text-lg text-white tabular-nums">{formatTime(elapsed)}</p>
            <p className="text-xs text-[#9CA3AF]">
              {recording
                ? "Recording in progress — press stop when done."
                : "Press the mic to start recording the victim's statement."}
            </p>
          </div>

          {error ? <p className="text-sm text-[#FCA5A5] rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 px-4 py-3">{error}</p> : null}
          {success ? <p className="text-sm text-[#86EFAC] rounded-lg bg-[#16A34A]/10 border border-[#16A34A]/30 px-4 py-3">{success}</p> : null}

          {/* Whisper transcript display (read-only) */}
          {whisperTranscript && (
            <div className="rounded-xl border border-[#F97316]/30 bg-[#F97316]/5 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F97316]">
                Whisper AI Transcript (English)
              </p>
              <p className="text-sm leading-6 text-[#D1D5DB] whitespace-pre-wrap">{whisperTranscript}</p>
              {bnsSections.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.08]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF] mb-2">
                    Mapped BNS / IPC Sections ({bnsSections.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bnsSections.map((s) => (
                      <span
                        key={s.sectionNumber}
                        className="rounded-full border border-[#F97316]/40 bg-[#F97316]/10 px-3 py-1 text-[10px] font-bold text-[#FDBA74]"
                      >
                        BNS §{s.sectionNumber}
                        {s.ipcEquivalent ? ` / IPC §${s.ipcEquivalent}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Workflow + action buttons */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7280]">Workflow</p>
              {[
                { done: !!audioBlob, label: "Record audio" },
                { done: !!uploadedRecording, label: "Upload → Whisper transcribes" },
                { done: !!whisperTranscript.trim(), label: "English transcript ready" + (bnsSections.length ? ` + ${bnsSections.length} BNS section${bnsSections.length > 1 ? "s" : ""}` : "") },
                { done: false, label: "Generate PDF report" },
              ].map((step, i) => (
                <p
                  key={i}
                  className={`text-sm ${step.done ? "text-[#86EFAC]" : "text-[#9CA3AF]"}`}
                >
                  {step.done ? "✓" : `${i + 1}.`} {step.label}
                </p>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {/* Upload button */}
              <button
                type="button"
                onClick={() => void uploadRecording()}
                disabled={recording || uploading || !audioBlob}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading & Transcribing (Whisper)…" : "Upload & Transcribe"}
              </button>

              {/* Generate PDF button */}
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={!canGeneratePdf || generatingPdf || fetchingFir}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#F97316]/40 bg-[#F97316]/10 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#FDBA74] hover:bg-[#F97316]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                {generatingPdf || fetchingFir ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {fetchingFir
                  ? "Loading BNS sections…"
                  : generatingPdf
                    ? "Generating PDF…"
                    : "Generate FIR Report (PDF)"}
              </button>

              <p className="text-[10px] text-[#6B7280] leading-relaxed text-center">
                PDF includes English transcript + applicable BNS/IPC sections
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
