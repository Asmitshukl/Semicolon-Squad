"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIRSummaryService = void 0;
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const trimSentence = (value, fallback) => {
    const clean = value.replace(/\s+/g, ' ').trim();
    return clean || fallback;
};
class FIRSummaryService {
    static async generateSummary(firId) {
        const fir = await database_1.prisma.fIR.findUnique({
            where: { id: firId },
            include: {
                victim: true,
                station: true,
                bnsSections: {
                    orderBy: { sectionNumber: 'asc' },
                    take: 3,
                },
                victimStatements: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                voiceRecordings: {
                    orderBy: { recordedAt: 'desc' },
                    take: 1,
                },
            },
        });
        if (!fir) {
            throw new ApiError_1.ApiError(404, 'FIR not found');
        }
        const sectionLine = fir.bnsSections.length
            ? fir.bnsSections
                .map((section) => `BNS ${section.sectionNumber} (${section.sectionTitle})`)
                .join(', ')
            : 'BNS mapping pending';
        const sourceNarrative = fir.voiceRecordings[0]?.transcript ||
            fir.victimStatements[0]?.rawText ||
            fir.incidentDescription;
        const summary = trimSentence(`Victim ${fir.victim.name} reported an incident at ${fir.incidentLocation} on ${fir.incidentDate.toISOString().slice(0, 10)}${fir.incidentTime ? ` around ${fir.incidentTime}` : ''}. The working legal mapping is ${sectionLine}. Statement summary: ${sourceNarrative}`, 'Summary unavailable.');
        return database_1.prisma.fIR.update({
            where: { id: firId },
            data: { aiGeneratedSummary: summary },
            include: {
                victim: true,
                station: true,
                bnsSections: true,
                voiceRecordings: true,
            },
        });
    }
}
exports.FIRSummaryService = FIRSummaryService;
