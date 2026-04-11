import { prisma } from '../../config/database';
import type { NormalizedFullPipeline } from '../../types/ml.types';
import { runHeuristicClassification } from './heuristic';

/** Offline stand-in when `ML_SERVICE_URL` is unset (text path only). */
export const buildLocalFullPipelineFromText = async (text: string): Promise<NormalizedFullPipeline> => {
  const h = runHeuristicClassification(text);
  const section = await prisma.bNSSection.findUnique({
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
