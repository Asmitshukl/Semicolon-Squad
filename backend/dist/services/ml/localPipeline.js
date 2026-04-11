"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLocalFullPipelineFromText = void 0;
const database_1 = require("../../config/database");
const heuristic_1 = require("./heuristic");
/** Offline stand-in when `ML_SERVICE_URL` is unset (text path only). */
const buildLocalFullPipelineFromText = async (text) => {
    const h = (0, heuristic_1.runHeuristicClassification)(text);
    const section = await database_1.prisma.bNSSection.findUnique({
        where: { sectionNumber: h.sectionNumber },
    });
    return {
        transcript: text,
        rawComplaintText: text,
        entities: {},
        classifications: [
            {
                sectionNumber: h.sectionNumber,
                confidence: h.severityScore,
                title: section?.sectionTitle,
            },
        ],
        urgencyLevel: h.urgencyLevel,
        urgencyReason: h.urgencyReason,
        severityScore: h.severityScore,
        victimRightsSummary: section?.victimsRightsNote ?? undefined,
        victimRightsBullets: undefined,
        modelVersion: 'heuristic-v1',
    };
};
exports.buildLocalFullPipelineFromText = buildLocalFullPipelineFromText;
