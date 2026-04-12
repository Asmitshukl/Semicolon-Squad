import { useState } from 'react';
import { Check, Download, Loader2 } from 'lucide-react';
import type { MockFIR } from '../../data/officerMock';
import { officerService } from '../../services/officerService';
import { jsPDF } from 'jspdf';

type Phase = 'idle' | 'loading' | 'done';

const PDF_MARGIN = 50;
const LINE_H = 14;

/* ── PDF helpers (same rendering helpers as VoiceRecorder) ────────── */
const addPage = (doc: jsPDF, y: number, needed = LINE_H + 4): number => {
  const ph = doc.internal.pageSize.getHeight();
  if (y + needed > ph - PDF_MARGIN) { doc.addPage(); return PDF_MARGIN + 20; }
  return y;
};

const sectionHeader = (doc: jsPDF, text: string, y: number): number => {
  const pw = doc.internal.pageSize.getWidth();
  y = addPage(doc, y, 28);
  doc.setFillColor(20, 20, 20);
  doc.rect(PDF_MARGIN, y, pw - PDF_MARGIN * 2, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(249, 115, 22);
  doc.text(text.toUpperCase(), PDF_MARGIN + 8, y + 13);
  return y + 28;
};

const labelValue = (doc: jsPDF, label: string, value: string, y: number, lw = 130): number => {
  const pw = doc.internal.pageSize.getWidth();
  y = addPage(doc, y, LINE_H + 2);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(130, 130, 130);
  doc.text(`${label}:`, PDF_MARGIN, y);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20);
  const wrapped = doc.splitTextToSize(value, pw - PDF_MARGIN * 2 - lw) as string[];
  doc.text(wrapped, PDF_MARGIN + lw, y);
  return y + Math.max(LINE_H, wrapped.length * LINE_H);
};

const textBlock = (doc: jsPDF, text: string, y: number): number => {
  const pw = doc.internal.pageSize.getWidth();
  const contentW = pw - PDF_MARGIN * 2;
  const innerW = contentW - 20;
  const lines = doc.splitTextToSize(text.trim(), innerW) as string[];
  const blockH = lines.length * LINE_H + 20;
  if (y + blockH > doc.internal.pageSize.getHeight() - PDF_MARGIN) { doc.addPage(); y = PDF_MARGIN + 20; }
  doc.setFillColor(250, 250, 250); doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.5);
  doc.rect(PDF_MARGIN, y, contentW, blockH, 'FD');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(30, 30, 30);
  let ty = y + 14;
  for (const line of lines) { ty = addPage(doc, ty); doc.text(line, PDF_MARGIN + 10, ty); ty += LINE_H; }
  return Math.max(ty, y + blockH) + 10;
};

/* ── PDF generation ────────────────────────────────────────────────── */
const buildFirPdf = (fir: MockFIR) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(16, 16, 16); doc.rect(0, 0, pw, 76, 'F');
  doc.setFillColor(249, 115, 22); doc.rect(0, 0, 5, 76, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(255, 255, 255);
  doc.text('NyayaSetu — First Information Report', PDF_MARGIN, 30);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(160, 160, 160);
  doc.text('Digital Police Portal · Government of India Initiative', PDF_MARGIN, 46);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}`, PDF_MARGIN, 60);

  let y = 96;

  // FIR Details
  y = sectionHeader(doc, 'FIR Information', y);
  y = labelValue(doc, 'FIR Number', fir.firNo, y);
  y = labelValue(doc, 'Status', fir.status, y);
  y = labelValue(doc, 'Urgency', fir.urgency, y);
  y = labelValue(doc, 'Received', fir.received, y);
  y = labelValue(doc, 'Incident Date', fir.incidentDate, y);
  y = labelValue(doc, 'Location', fir.location, y);
  y += 8;

  // Victim
  y = sectionHeader(doc, 'Victim Information', y);
  y = labelValue(doc, 'Name', fir.victimName, y);
  y = labelValue(doc, 'Phone', fir.victimPhone, y);
  y += 8;

  // Statement
  y = sectionHeader(doc, 'Incident Statement', y);
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(120, 120, 120);
  doc.text('As recorded from the victim portal / voice statement.', PDF_MARGIN, y);
  y += 14;
  y = textBlock(doc, fir.statement || fir.aiSummaryDefault || 'Statement pending.', y);

  // AI Summary
  if (fir.aiSummaryDefault) {
    y = sectionHeader(doc, 'AI-Generated Summary', y);
    y = textBlock(doc, fir.aiSummaryDefault, y);
  }

  // BNS / IPC Sections (from model)
  if (fir.sectionMappings && fir.sectionMappings.length > 0) {
    y = sectionHeader(doc, `Applicable BNS / IPC Sections  [${fir.sectionMappings.length} Section${fir.sectionMappings.length > 1 ? 's' : ''} — AI Model Generated]`, y);

    for (let i = 0; i < fir.sectionMappings.length; i++) {
      const sec = fir.sectionMappings[i];
      y = addPage(doc, y, 80);
      const cardY = y;

      // Measure content first
      const descLines = sec.description
        ? doc.splitTextToSize(sec.description, pw - PDF_MARGIN * 2 - 20) as string[]
        : [];
      const rLines = sec.reasoning
        ? doc.splitTextToSize(`AI Reasoning: ${sec.reasoning}`, pw - PDF_MARGIN * 2 - 20) as string[]
        : [];

      const cardH = 26
        + (sec.ipcEquivalent ? LINE_H : 0)
        + LINE_H
        + descLines.length * LINE_H
        + rLines.length * (LINE_H - 1)
        + 12;

      // Card background
      const isNonBailable = !sec.bailable;
      doc.setFillColor(isNonBailable ? 255 : 245, isNonBailable ? 248 : 248, isNonBailable ? 245 : 250);
      doc.setDrawColor(isNonBailable ? 239 : 209, isNonBailable ? 154 : 213, isNonBailable ? 71 : 230);
      doc.setLineWidth(0.8);
      doc.rect(PDF_MARGIN, cardY, pw - PDF_MARGIN * 2, cardH, 'FD');

      // Left accent bar
      doc.setFillColor(249, 115, 22);
      doc.rect(PDF_MARGIN, cardY, 4, cardH, 'F');

      let ry = cardY + 16;

      // BNS number badge + title
      doc.setFillColor(249, 115, 22);
      doc.roundedRect(PDF_MARGIN + 12, cardY + 6, 52, 14, 3, 3, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255);
      doc.text(`BNS §${sec.sectionNumber}`, PDF_MARGIN + 14, cardY + 15);

      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(15, 15, 15);
      const titleLines = doc.splitTextToSize(sec.sectionTitle, pw - PDF_MARGIN * 2 - 85) as string[];
      doc.text(titleLines, PDF_MARGIN + 72, cardY + 15);
      ry = cardY + 16 + titleLines.length * LINE_H + 4;

      // Cognizable / Bailable badges
      const cogColor: [number, number, number] = sec.cognizable ? [220, 38, 38] : [34, 197, 94];
      const bailColor: [number, number, number] = sec.bailable ? [34, 197, 94] : [239, 68, 68];
      doc.setFontSize(7.5);

      doc.setFillColor(...cogColor); doc.roundedRect(PDF_MARGIN + 12, ry, 68, 11, 2, 2, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
      doc.text(sec.cognizable ? 'COGNIZABLE' : 'NON-COGNIZABLE', PDF_MARGIN + 14, ry + 7.5);

      doc.setFillColor(...bailColor); doc.roundedRect(PDF_MARGIN + 86, ry, 68, 11, 2, 2, 'F');
      doc.text(sec.bailable ? 'BAILABLE' : 'NON-BAILABLE', PDF_MARGIN + 88, ry + 7.5);
      ry += 18;

      // IPC Equivalent
      if (sec.ipcEquivalent) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(70, 70, 70);
        doc.text(`IPC Equivalent: §${sec.ipcEquivalent}${sec.ipcTitle ? `  —  ${sec.ipcTitle}` : ''}`, PDF_MARGIN + 12, ry);
        ry += LINE_H;
      }

      // Description
      if (descLines.length > 0) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(40, 40, 40);
        for (const line of descLines) { doc.text(line, PDF_MARGIN + 12, ry); ry += LINE_H; }
      }

      // AI Reasoning
      if (rLines.length > 0) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(100, 100, 120);
        for (const line of rLines) { doc.text(line, PDF_MARGIN + 12, ry); ry += LINE_H - 1; }
      }

      y = cardY + cardH + (i < fir.sectionMappings.length - 1 ? 10 : 6);
    }
  } else {
    y = addPage(doc, y, 30);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(130, 130, 130);
    doc.text('No BNS/IPC sections have been mapped yet for this FIR.', PDF_MARGIN, y);
    y += 20;
  }

  // Primary section summary
  y = sectionHeader(doc, 'Primary Offence Summary', y);
  y = labelValue(doc, 'Primary BNS', `${fir.bnsCode} — ${fir.bnsTitle}`, y);
  y = labelValue(doc, 'IPC Equivalent', fir.ipcEquiv, y);
  y = labelValue(doc, 'Punishment', fir.punishmentLine, y);
  y = labelValue(doc, 'Cognizable', fir.cognizable, y);
  y = labelValue(doc, 'Bailable', fir.bailable, y);
  y += 8;

  // ── CITIZEN RIGHTS & LEGAL REMEDIES ────────────────────────────────
  const hasNonBailable = fir.sectionMappings.some(s => !s.bailable) || fir.bailable === 'Non-Bailable';
  const hasCognizable = fir.sectionMappings.some(s => s.cognizable) || fir.cognizable === 'Cognizable';
  const isViolentCrime = fir.bnsCode.startsWith('10') || fir.bnsCode.startsWith('11') || fir.bnsCode.startsWith('7');

  const rights: Array<{ title: string; detail: string }> = [
    {
      title: 'Right to Free FIR Copy (Section 173 BNSS)',
      detail: 'You are entitled to receive a free copy of this FIR immediately after registration. The officer must provide it without charge under Section 173 of BNSS 2023.',
    },
    {
      title: 'Right to Zero FIR (Section 173(1) BNSS)',
      detail: 'You can file this FIR at any police station regardless of jurisdiction. The station must register it and transfer it to the correct station. You cannot be turned away.',
    },
    ...(hasCognizable ? [{
      title: 'Right to Immediate Police Action (Cognizable Offence)',
      detail: 'Because this is a cognizable offence, the police MUST register the FIR and begin investigation immediately without a court order. No magistrate approval is required.',
    }] : [{
      title: 'Right to Approach Magistrate',
      detail: 'For non-cognizable offences, you may apply to a magistrate under Section 175 BNSS if the police decline to investigate.',
    }]),
    ...(hasNonBailable ? [{
      title: 'Bail Rights (Non-Bailable Offence)',
      detail: 'For non-bailable offences, bail is at the discretion of the court. The accused is NOT entitled to bail as a right. You may oppose bail citing threat to safety or risk of tampering with evidence.',
    }] : [{
      title: 'Bail Rights (Bailable Offence)',
      detail: 'The accused has a right to bail for bailable offences. However, the victim may request appropriate bail conditions such as no-contact orders to ensure personal safety.',
    }]),
    {
      title: 'Right to Free Legal Aid (Article 39A + Legal Services Authorities Act)',
      detail: 'If you cannot afford a lawyer, you are entitled to free legal representation under Section 12 of the Legal Services Authorities Act 1987. Contact your nearest District Legal Services Authority (DLSA).',
    },
    ...(isViolentCrime ? [{
      title: 'Right to Medical Examination (Section 184 BNSS)',
      detail: 'In violent offences, the victim has the right to a free medical examination at any government hospital. The medical report constitutes important evidence. Demand this examination immediately.',
    }] : []),
    {
      title: 'Right to Witness Protection (Witness Protection Scheme 2018)',
      detail: "If you fear retaliation for filing this FIR, you may apply for witness protection under India's Witness Protection Scheme 2018. Contact the Station House Officer (SHO) or approach the court.",
    },
    {
      title: 'Right to Victim Compensation (Section 397 BNSS)',
      detail: 'You may apply for victim compensation through the State Victim Compensation Scheme. The court can award compensation even if the accused is not convicted.',
    },
    {
      title: 'Right to Case Status Updates',
      detail: 'You may request case progress updates from the investigting officer at any time. Under BNSS 2023, the officer must inform you of major developments including arrest of accused and filing of chargesheet.',
    },
    {
      title: 'National Helplines',
      detail: 'Police Emergency: 100  |  Women Helpline: 1091  |  Legal Aid: 15100  |  Cyber Crime: 1930  |  Human Rights: 14433',
    },
  ];

  y = sectionHeader(doc, `Citizen Rights & Legal Remedies  [${rights.length} Rights Applicable]`, y);

  // Intro note
  y = addPage(doc, y, 30);
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(100, 100, 120);
  const introLines = doc.splitTextToSize(
    'The following rights are guaranteed to you as a victim/complainant under the Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 and the Constitution of India. These rights apply regardless of the outcome of the investigation.',
    pw - PDF_MARGIN * 2,
  ) as string[];
  for (const l of introLines) { doc.text(l, PDF_MARGIN, y); y += LINE_H - 1; }
  y += 8;

  for (let i = 0; i < rights.length; i++) {
    const r = rights[i];
    const detailLines = doc.splitTextToSize(r.detail, pw - PDF_MARGIN * 2 - 28) as string[];
    const cardH = 18 + detailLines.length * (LINE_H - 1) + 10;
    y = addPage(doc, y, cardH + 6);

    // Card
    doc.setFillColor(248, 252, 255); doc.setDrawColor(147, 197, 253); doc.setLineWidth(0.5);
    doc.rect(PDF_MARGIN, y, pw - PDF_MARGIN * 2, cardH, 'FD');

    // Number bubble
    doc.setFillColor(59, 130, 246);
    doc.circle(PDF_MARGIN + 11, y + 10, 8, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
    doc.text(String(i + 1), PDF_MARGIN + (i + 1 >= 10 ? 7 : 8.5), y + 13);

    // Title
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 60, 120);
    doc.text(r.title, PDF_MARGIN + 24, y + 13);

    // Detail
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(40, 40, 60);
    let dy = y + 22;
    for (const line of detailLines) { doc.text(line, PDF_MARGIN + 24, dy); dy += LINE_H - 1; }

    y += cardH + 6;
  }

  // Disclaimer box
  y = addPage(doc, y, 50);
  doc.setFillColor(255, 251, 235); doc.setDrawColor(251, 191, 36); doc.setLineWidth(0.8);
  doc.rect(PDF_MARGIN, y, pw - PDF_MARGIN * 2, 44, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(120, 50, 0);
  doc.text('IMPORTANT DISCLAIMER', PDF_MARGIN + 8, y + 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 40, 0);
  const discLines = doc.splitTextToSize(
    'This document is generated by the NyayaSetu AI system for informational purposes. BNS/IPC section mappings are AI-suggested and must be verified by a qualified legal officer before official use. The citizen rights listed are general rights and may vary based on specific case circumstances.',
    pw - PDF_MARGIN * 2 - 16,
  ) as string[];
  let dy2 = y + 23;
  for (const l of discLines) { doc.text(l, PDF_MARGIN + 8, dy2); dy2 += LINE_H - 2; }
  y += 52;

  // Footer on all pages
  const totalPages = (doc.internal as any).getNumberOfPages?.() ?? 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.5);
    doc.line(PDF_MARGIN, ph - 38, pw - PDF_MARGIN, ph - 38);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(150, 150, 150);
    doc.text('Official document generated via NyayaSetu · Subject to officer verification and signature.', PDF_MARGIN, ph - 26);
    doc.text(`Page ${p} of ${totalPages}`, pw - PDF_MARGIN - 50, ph - 26);
  }

  const filename = `FIR_${fir.firNo.replace(/[^\w.-]+/g, '_')}.pdf`;
  doc.save(filename);
};

/* ── Component ─────────────────────────────────────────────────────── */
export const DocumentGenerator = ({ fir }: { fir: MockFIR }) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = [
    { ok: true, label: 'Victim statement received' },
    { ok: true, label: 'BNS sections confirmed' },
    { ok: !!fir.aiSummaryDefault, label: 'AI summary available' },
    { ok: fir.checklistVoiceOk, label: 'Voice statement verified', warn: !fir.checklistVoiceOk },
    { ok: fir.sectionMappings.length > 0, label: `${fir.sectionMappings.length} BNS/IPC section${fir.sectionMappings.length !== 1 ? 's' : ''} mapped`, warn: fir.sectionMappings.length === 0 },
  ];

  const generate = async () => {
    setPhase('loading');
    setError(null);
    setMessage(null);
    try {
      // Trigger backend summary generation (updates AI summary if not yet done)
      await officerService.generateSummary(fir.id);
      // Generate and download the PDF client-side with full BNS data
      buildFirPdf(fir);
      setPhase('done');
      setMessage('PDF downloaded with full BNS/IPC section data.');
    } catch (err) {
      setPhase('idle');
      setError(err instanceof Error ? err.message : 'Document generation failed.');
    }
  };

  return (
    <div>
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B7280]">
        Generate Official Document
      </p>
      <div className="mb-8 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            {item.ok ? (
              <Check className="h-4 w-4 shrink-0 text-[#16A34A]" strokeWidth={3} />
            ) : (
              <span className="w-4 text-center font-bold text-[#D97706]">⚠</span>
            )}
            <span className={item.warn ? 'text-[#D97706]' : 'text-[#D1D5DB]'}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 space-y-2 rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-4 text-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">Document context</p>
        <p className="text-white">FIR: {fir.firNo}</p>
        <p className="text-white">Primary BNS: {fir.bnsCode} — {fir.bnsTitle}</p>
        {fir.sectionMappings.length > 1 && (
          <p className="text-[#9CA3AF] text-xs">+{fir.sectionMappings.length - 1} additional section{fir.sectionMappings.length > 2 ? 's' : ''} mapped by AI</p>
        )}
        <p className="font-mono text-[#9CA3AF]">Timestamp auto-filled during PDF generation</p>
      </div>

      {error ? <p className="mb-3 text-sm text-[#FCA5A5]">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-[#86EFAC]">{message}</p> : null}

      {phase === 'loading' ? (
        <div className="flex items-center justify-center gap-2 py-4 text-[#9CA3AF]">
          <Loader2 className="h-5 w-5 animate-spin text-[#F97316]" />
          <span className="font-mono text-sm">Generating PDF with AI sections…</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void generate()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] py-4 text-sm font-extrabold uppercase tracking-wide text-white hover:bg-[#ea580c]"
        >
          <Download className="h-4 w-4" />
          {phase === 'done' ? 'Download Again' : 'Generate & Download PDF'}
        </button>
      )}
    </div>
  );
};
