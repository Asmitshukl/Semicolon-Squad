import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { ensureVictimCatalog } from './catalog.service';
import { env } from '../../config/env';
import { buildLocalFullPipelineFromText } from '../ml/localPipeline';
import { remoteClassifyText } from '../ml/mlClient';
import { fullPipelineToClassificationPayload } from '../ml/normalize';
import type { MlClassificationPayload } from '../../types/ml.types';
import { languageEnumToIso } from './statement.service';

export const persistVictimClassification = async (
  statementId: string,
  payload: MlClassificationPayload,
) => {
  await ensureVictimCatalog();

  const section = await prisma.bNSSection.findUnique({
    where: { sectionNumber: payload.primarySectionNumber },
  });

  if (!section) {
    throw new ApiError(500, `BNS catalog is missing section ${payload.primarySectionNumber}.`);
  }

  const alternativeSections = payload.alternatives.map((a) => ({
    sectionNumber: a.sectionNumber,
    title: a.title ?? a.sectionNumber,
    confidence: a.confidence,
  }));

  return prisma.crimeClassification.upsert({
    where: { victimStatementId: statementId },
    update: {
      bnsSectionId: section.id,
      confidenceScore: payload.primaryConfidence,
      urgencyLevel: payload.urgencyLevel,
      urgencyReason: payload.urgencyReason,
      severityScore: payload.severityScore,
      alternativeSections,
      modelVersion: payload.modelVersion,
    },
    create: {
      victimStatementId: statementId,
      bnsSectionId: section.id,
      confidenceScore: payload.primaryConfidence,
      urgencyLevel: payload.urgencyLevel,
      urgencyReason: payload.urgencyReason,
      severityScore: payload.severityScore,
      alternativeSections,
      modelVersion: payload.modelVersion,
    },
    include: {
      bnsSection: true,
      victimStatement: true,
    },
  });
};

export const classifyVictimStatement = async (userId: string, statementId?: string) => {
  await ensureVictimCatalog();

  const statement = statementId
    ? await prisma.victimStatement.findFirst({
        where: { id: statementId, userId },
      })
    : await prisma.victimStatement.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

  if (!statement) {
    throw new ApiError(404, 'No statement found to classify.');
  }

  const text = statement.rawText ?? statement.translatedText ?? '';
  const iso = languageEnumToIso(statement.language);

  let payload: MlClassificationPayload;

  if (env.mlServiceUrl) {
    const remote = await remoteClassifyText(text, iso);
    if (remote) {
      payload = remote;
    } else {
      const local = await buildLocalFullPipelineFromText(text);
      payload = fullPipelineToClassificationPayload(local);
    }
  } else {
    const local = await buildLocalFullPipelineFromText(text);
    payload = fullPipelineToClassificationPayload(local);
  }

  return persistVictimClassification(statement.id, payload);
};

export const getVictimResolution = async (statementId: string, userId: string) => {
  const statement = await prisma.victimStatement.findFirst({
    where: { id: statementId, userId },
    include: {
      classification: {
        include: { bnsSection: true },
      },
    },
  });

  if (!statement?.classification?.bnsSection) {
    throw new ApiError(404, 'No classification found for this statement.');
  }

  const section = statement.classification.bnsSection;
  const imprisonment = section.isLifeOrDeath
    ? 'Life imprisonment or more severe punishment where specified.'
    : `${section.minImprisonmentMonths ?? 0} to ${section.maxImprisonmentMonths ?? 0} months`;
  const fine = `INR ${section.minFine ?? 0} to INR ${section.maxFine ?? 0}`;

  return {
    sectionNumber: section.sectionNumber,
    sectionTitle: section.sectionTitle,
    punishmentRange: imprisonment,
    fineRange: fine,
    compensationNote:
      section.compensationNote ??
      'Compensation depends on the court order, documented loss, and victim impact.',
    expectedNextSteps: [
      'Carry identity proof and supporting evidence to the police station.',
      'Ask for your FIR copy or acknowledgment number.',
      'Preserve screenshots, medical papers, recordings, or payment receipts.',
    ],
  };
};
