"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIRPdfService = void 0;
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const escapePdfText = (value) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const wrapText = (value, width = 92) => {
    const words = value.replace(/\s+/g, ' ').trim().split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (next.length <= width) {
            current = next;
            continue;
        }
        if (current) {
            lines.push(current);
        }
        current = word;
    }
    if (current) {
        lines.push(current);
    }
    return lines.length ? lines : [''];
};
const buildSimplePdf = (lines) => {
    const contentParts = ['BT', '/F1 11 Tf', '50 792 Td', '14 TL'];
    let first = true;
    for (const line of lines) {
        const safeLine = escapePdfText(line);
        if (first) {
            contentParts.push(`(${safeLine}) Tj`);
            first = false;
        }
        else {
            contentParts.push('T*');
            contentParts.push(`(${safeLine}) Tj`);
        }
    }
    contentParts.push('ET');
    const stream = `${contentParts.join('\n')}\n`;
    const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
        `5 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}endstream\nendobj\n`,
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const obj of objects) {
        offsets.push(Buffer.byteLength(pdf, 'utf8'));
        pdf += obj;
    }
    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i < offsets.length; i += 1) {
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
};
class FIRPdfService {
    static async generateForFir(firId) {
        const fir = await database_1.prisma.fIR.findUnique({
            where: { id: firId },
            include: {
                victim: true,
                officer: {
                    include: {
                        user: true,
                        station: true,
                    },
                },
                station: true,
                bnsSections: {
                    orderBy: { sectionNumber: 'asc' },
                },
                victimStatements: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                voiceRecordings: {
                    orderBy: { recordedAt: 'desc' },
                    take: 3,
                },
                caseUpdates: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!fir) {
            throw new ApiError_1.ApiError(404, 'FIR not found');
        }
        const statement = fir.victimStatements[0];
        const latestRecording = fir.voiceRecordings[0];
        const sections = fir.bnsSections.length
            ? fir.bnsSections.map((section) => ({
                label: `BNS ${section.sectionNumber} ${section.sectionTitle}${section.ipcEquivalent ? ` (IPC ${section.ipcEquivalent})` : ''}`,
                reasoning: section.mappingReasoning ?? null,
            }))
            : [{ label: 'No BNS section selected yet', reasoning: null }];
        const lines = [
            'NyayaSetu FIR Document',
            '',
            `FIR Number: ${fir.firNumber ?? 'Pending'}`,
            `Acknowledgment: ${fir.acknowledgmentNo ?? 'Pending'}`,
            `Status: ${fir.status}`,
            `Urgency: ${fir.urgencyLevel}`,
            `Online FIR: ${fir.isOnlineFIR ? 'Yes' : 'No'}`,
            '',
            `Victim: ${fir.victim.name}`,
            `Victim Phone: ${fir.victim.phone}`,
            `Station: ${fir.station.name} (${fir.station.stationCode})`,
            `Officer: ${fir.officer?.user.name ?? 'Unassigned'}${fir.officer?.badgeNumber ? ` / ${fir.officer.badgeNumber}` : ''}`,
            '',
            `Incident Date: ${fir.incidentDate.toISOString().slice(0, 10)}`,
            `Incident Time: ${fir.incidentTime ?? 'Not provided'}`,
            `Incident Location: ${fir.incidentLocation}`,
            '',
            'Applied Sections:',
            ...sections.flatMap((section) => [
                ...wrapText(`- ${section.label}`, 88),
                ...(section.reasoning ? wrapText(`  Reasoning: ${section.reasoning}`, 86) : []),
            ]),
            '',
            'Incident Description:',
            ...wrapText(fir.incidentDescription || 'No description provided.', 92),
            '',
            'AI Summary:',
            ...wrapText(fir.aiGeneratedSummary || 'No AI summary generated yet.', 92),
            '',
            'Latest Statement:',
            ...wrapText(statement?.rawText || statement?.translatedText || 'No linked victim statement.', 92),
            '',
            'Latest Transcript:',
            ...wrapText(latestRecording?.transcript || 'No transcript available.', 92),
            '',
            'Timeline:',
            ...(fir.caseUpdates.length
                ? fir.caseUpdates.flatMap((entry) => wrapText(`- ${entry.createdAt.toISOString()} / ${entry.status} / ${entry.note ?? 'No note'}`, 92))
                : ['- No case updates recorded yet.']),
        ];
        const filename = `${fir.firNumber ?? fir.acknowledgmentNo ?? fir.id}.pdf`.replace(/[^\w.-]+/g, '_');
        return { filename, buffer: buildSimplePdf(lines) };
    }
}
exports.FIRPdfService = FIRPdfService;
