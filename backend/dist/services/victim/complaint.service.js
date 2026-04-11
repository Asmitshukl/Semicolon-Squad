"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVictimResolution = exports.classifyVictimStatement = exports.persistVictimClassification = void 0;
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const catalog_service_1 = require("./catalog.service");
const env_1 = require("../../config/env");
const localPipeline_1 = require("../ml/localPipeline");
const mlClient_1 = require("../ml/mlClient");
const normalize_1 = require("../ml/normalize");
const statement_service_1 = require("./statement.service");
const persistVictimClassification = async (statementId, payload) => {
    await (0, catalog_service_1.ensureVictimCatalog)();
    const section = await database_1.prisma.bNSSection.findUnique({
        where: { sectionNumber: payload.primarySectionNumber },
    });
    if (!section) {
        throw new ApiError_1.ApiError(500, `BNS catalog is missing section ${payload.primarySectionNumber}.`);
    }
    const alternativeSections = payload.alternatives.map((a) => ({
        sectionNumber: a.sectionNumber,
        title: a.title ?? a.sectionNumber,
        confidence: a.confidence,
    }));
    return database_1.prisma.crimeClassification.upsert({
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
exports.persistVictimClassification = persistVictimClassification;
const classifyVictimStatement = async (userId, statementId) => {
    await (0, catalog_service_1.ensureVictimCatalog)();
    const statement = statementId
        ? await database_1.prisma.victimStatement.findFirst({
            where: { id: statementId, userId },
        })
        : await database_1.prisma.victimStatement.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    if (!statement) {
        throw new ApiError_1.ApiError(404, 'No statement found to classify.');
    }
    const text = statement.rawText ?? statement.translatedText ?? '';
    const iso = (0, statement_service_1.languageEnumToIso)(statement.language);
    let payload;
    if (env_1.env.mlServiceUrl) {
        const remote = await (0, mlClient_1.remoteClassifyText)(text, iso);
        if (remote) {
            payload = remote;
        }
        else {
            const local = await (0, localPipeline_1.buildLocalFullPipelineFromText)(text);
            payload = (0, normalize_1.fullPipelineToClassificationPayload)(local);
        }
    }
    else {
        const local = await (0, localPipeline_1.buildLocalFullPipelineFromText)(text);
        payload = (0, normalize_1.fullPipelineToClassificationPayload)(local);
    }
    return (0, exports.persistVictimClassification)(statement.id, payload);
};
exports.classifyVictimStatement = classifyVictimStatement;
const getVictimResolution = async (statementId, userId) => {
    const statement = await database_1.prisma.victimStatement.findFirst({
        where: { id: statementId, userId },
        include: {
            classification: {
                include: { bnsSection: true },
            },
        },
    });
    if (!statement?.classification?.bnsSection) {
        throw new ApiError_1.ApiError(404, 'No classification found for this statement.');
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
        compensationNote: section.compensationNote ??
            'Compensation depends on the court order, documented loss, and victim impact.',
        expectedNextSteps: [
            'Carry identity proof and supporting evidence to the police station.',
            'Ask for your FIR copy or acknowledgment number.',
            'Preserve screenshots, medical papers, recordings, or payment receipts.',
        ],
    };
};
exports.getVictimResolution = getVictimResolution;
