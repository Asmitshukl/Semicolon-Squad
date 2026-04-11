import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Upload, Loader2, FileText } from "lucide-react";
import { WaveformDisplay } from "./WaveformDisplay";
import { officerService } from "../../services/officerService";
import type { MockFIR, VoiceRec } from "../../data/officerMock";
import { jsPDF } from "jspdf";

type Props = {
  onUploaded?: (recording: VoiceRec) => void;
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
  if (
    typeof MediaRecorder !== "undefined" &&
    MediaRecorder.isTypeSupported(preferred)
  )
    return preferred;
  if (
    typeof MediaRecorder !== "undefined" &&
    MediaRecorder.isTypeSupported("audio/webm")
  )
    return "audio/webm";
  return "";
};

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `00:${minutes}:${seconds}`;
};

/** Wraps text into lines respecting a max width in jsPDF points */
const splitLines = (doc: jsPDF, text: string, maxWidth: number): string[] => {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];
  for (const para of paragraphs) {
    const wrapped = doc.splitTextToSize(para.trim(), maxWidth) as string[];
    lines.push(...wrapped, "");
  }
  return lines;
};

const generateFirPdf = (
  transcript: string,
  firNo: string | null,
  language: string,
  recordedAt: string,
): void => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentW = pageW - margin * 2;

  // ── Header bar ──────────────────────────────────────────────────
  doc.setFillColor(249, 115, 22); // orange-500
  doc.rect(0, 0, pageW, 72, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("NyayaSetu — FIR Voice Statement Report", margin, 30);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Government of India · Digital Police Portal", margin, 46);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}`,
    margin,
    60,
  );

  // ── Meta section ────────────────────────────────────────────────
  let y = 100;
  const metaItems: [string, string][] = [
    ["FIR / Reference No.", firNo || "Unlinked Recording"],
    ["Language", LANGUAGES.find((l) => l.code === language)?.label ?? language],
    ["Recorded At", recordedAt],
    ["Transcript Length", `${transcript.trim().split(/\s+/).length} words`],
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text("Recording Details", margin, y);
  y += 6;
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(1.2);
  doc.line(margin, y, margin + 160, y);
  y += 14;

  doc.setFontSize(10);
  for (const [label, value] of metaItems) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.text(value, margin + 130, y);
    y += 18;
  }

  y += 10;

  // ── Transcript section ──────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text("Transcribed Statement (Whisper AI)", margin, y);
  y += 6;
  doc.line(margin, y, margin + 230, y);
  y += 14;

  // Light grey background box
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);

  const textStartY = y + 10;
  const lines = splitLines(doc, transcript || "(No transcript available)", contentW - 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);

  let currentY = textStartY;
  const lineH = 14;

  for (const line of lines) {
    if (currentY + lineH > pageH - 80) {
      doc.addPage();
      currentY = margin + 20;
    }
    if (line !== "") {
      doc.text(line, margin + 10, currentY);
    }
    currentY += lineH;
  }

  // box around transcript
  const boxH = currentY - textStartY + 20;
  doc.rect(margin, y, contentW, boxH, "FD");
  // re-draw text on top (rect was drawn after, so re-print)
  currentY = textStartY;
  doc.setTextColor(40, 40, 40);
  for (const line of lines) {
    if (line !== "") {
      doc.text(line, margin + 10, currentY);
    }
    currentY += lineH;
  }

  // ── Disclaimer ──────────────────────────────────────────────────
  const footerY = pageH - 60;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageW - margin, footerY);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(
    "This document is an auto-generated transcript of a voice statement recorded via the NyayaSetu portal.",
    margin,
    footerY + 14,
  );
  doc.text(
    "It is subject to verification by the appointed officer before being used as an official FIR record.",
    margin,
    footerY + 26,
  );

  const filename = firNo
    ? `FIR_Voice_${firNo.replace(/[^\w.-]+/g, "_")}.pdf`
    : `Voice_Statement_${Date.now()}.pdf`;

  doc.save(filename);
};

export const VoiceRecorder = ({ onUploaded }: Props) => {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [language, setLanguage] = useState("hi");
  const [firId, setFirId] = useState("");
  const [firs, setFirs] = useState<MockFIR[]>([]);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedRecording, setUploadedRecording] = useState<VoiceRec | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

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

  const selectedFir = useMemo(
    () => firs.find((item) => item.id === firId),
    [firId, firs],
  );

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
    setTranscript("");
    setAudioBlob(null);
    setUploadedRecording(null);
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
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start(250);
      startedAtRef.current = Date.now();
      setRecording(true);
      tickRef.current = window.setInterval(() => {
        setElapsed(
          Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)),
        );
      }, 500);
    } catch {
      setError(
        "Microphone access failed. Please allow mic permissions and try again.",
      );
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
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob.size > 0 ? blob : null);
        setRecording(false);
        stopStream();
        resolve();
      };
      recorder.addEventListener("stop", onStop);
      try {
        recorder.stop();
      } catch {
        setRecording(false);
        stopStream();
        resolve();
      }
    });
  };

  const uploadRecording = async () => {
    if (!audioBlob) {
      setError("Record a statement first.");
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = new FormData();
      payload.append(
        "audio",
        audioBlob,
        `voice-statement.${audioBlob.type.includes("ogg") ? "ogg" : "webm"}`,
      );
      payload.append("language", language);
      if (firId) payload.append("firId", firId);
      if (transcript.trim()) payload.append("rawText", transcript.trim());
      payload.append("durationSecs", String(Math.max(1, elapsed)));

      const uploaded = await officerService.uploadVoiceRecording(payload);
      const merged: VoiceRec = {
        ...uploaded,
        transcript: uploaded.transcript || transcript || undefined,
      };
      setUploadedRecording(merged);
      // Use Whisper transcript if backend returned one, else keep what officer typed
      if (merged.transcript) setTranscript(merged.transcript);
      setSuccess(
        selectedFir
          ? `Recording linked to ${selectedFir.firNo}. Transcript received — review and generate PDF.`
          : "Recording uploaded. Transcript received — review and generate PDF report.",
      );
      onUploaded?.(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleGeneratePdf = () => {
    if (!transcript.trim() && !uploadedRecording) {
      setError("Upload the voice recording first to get the transcript.");
      return;
    }
    setGeneratingPdf(true);
    setError(null);
    try {
      generateFirPdf(
        transcript.trim() || "(No transcript available)",
        selectedFir?.firNo ?? uploadedRecording?.firNo ?? null,
        language,
        uploadedRecording?.recordedAt ?? new Date().toLocaleString("en-IN"),
      );
      setSuccess("PDF downloaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setGeneratingPdf(false);
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
          {open ? "Close Recorder" : "New Recording"}
        </button>
      </div>

      {open ? (
        <div className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-6 space-y-5">
          {/* FIR + Language selectors */}
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

          {/* Record button */}
          <div className="flex flex-col items-center gap-4 py-4">
            <button
              type="button"
              onClick={() =>
                void (recording ? stopRecording() : startRecording())
              }
              disabled={uploading}
              className={`flex h-20 w-20 items-center justify-center rounded-full border-4 transition-colors ${
                recording
                  ? "border-[#DC2626] bg-[#DC2626] text-white"
                  : "border-white/[0.12] bg-white/[0.06] text-[#F97316]"
              }`}
            >
              {recording ? (
                <Square className="h-8 w-8" strokeWidth={2.5} />
              ) : (
                <Mic className="h-9 w-9" strokeWidth={2} />
              )}
            </button>
            <WaveformDisplay active={recording} />
            <p className="font-mono text-lg text-white tabular-nums">
              {formatTime(elapsed)}
            </p>
            <p className="text-xs text-[#9CA3AF]">
              {recording
                ? "Recording in progress — press stop when done."
                : "Press the mic to start recording the victim's statement."}
            </p>
          </div>

          {error ? <p className="text-sm text-[#FCA5A5]">{error}</p> : null}
          {success ? <p className="text-sm text-[#86EFAC]">{success}</p> : null}

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Transcript editor */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#6B7280]">
                Transcribed Text
                {uploadedRecording && transcript
                  ? " — Whisper AI"
                  : " — Edit if needed"}
              </p>
              <textarea
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                rows={8}
                placeholder={
                  uploadedRecording
                    ? "Transcript will appear here after upload completes."
                    : "After uploading, Whisper AI will transcribe the audio. You can also type or edit manually."
                }
                className="w-full rounded-xl border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-[#D1D5DB] outline-none resize-none"
              />
            </div>

            {/* Workflow panel */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-4 flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B7280]">
                Workflow
              </p>
              <div className="space-y-2 text-sm text-[#D1D5DB]">
                <p className={audioBlob ? "text-[#86EFAC]" : ""}>
                  {audioBlob ? "✓ Audio clip ready" : "① Record audio"}
                </p>
                <p className={uploadedRecording ? "text-[#86EFAC]" : ""}>
                  {uploadedRecording
                    ? "✓ Uploaded & transcribed by Whisper"
                    : "② Upload → Whisper transcribes"}
                </p>
                <p className={transcript.trim() ? "text-[#86EFAC]" : ""}>
                  {transcript.trim()
                    ? "✓ Transcript ready"
                    : "③ Review / edit transcript"}
                </p>
                <p className="">④ Generate PDF report</p>
              </div>

              {/* Upload button */}
              <button
                type="button"
                onClick={() => void uploadRecording()}
                disabled={recording || uploading || !audioBlob}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Uploading & Transcribing…" : "Upload & Transcribe"}
              </button>

              {/* Generate FIR Report PDF button */}
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={recording || uploading || generatingPdf || !transcript.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#F97316]/40 bg-[#F97316]/10 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#FDBA74] hover:bg-[#F97316]/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generatingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {generatingPdf ? "Generating PDF…" : "Generate FIR Report (PDF)"}
              </button>

              <p className="text-[10px] text-[#6B7280] leading-relaxed">
                PDF includes the full transcript, FIR reference, language, and recording metadata — ready to print or attach to the case file.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
