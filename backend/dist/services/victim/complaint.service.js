"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVictimResolution = exports.classifyVictimStatement = void 0;
const enums_1 = require("../../generated/prisma/enums");
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const catalog_service_1 = require("./catalog.service");
const scoreText = (text) => {
    const lower = text.toLowerCase();
    const patterns = [
        {
            keywords: ['kill', 'murder', 'knife', 'attack', 'beating', 'injury', 'hurt', 'assault'],
            sectionNumber: '115',
            urgencyLevel: enums_1.UrgencyLevel.HIGH,
            urgencyReason: 'The statement suggests physical violence or immediate safety concerns.',
            severityScore: 0.82,
        },
        {
            keywords: ['threat', 'intimidat', 'blackmail', 'extort'],
            sectionNumber: '351',
            urgencyLevel: enums_1.UrgencyLevel.HIGH,
            urgencyReason: 'The statement suggests ongoing intimidation or coercion.',
            severityScore: 0.76,
        },
        {
            keywords: ['fraud', 'cheat', 'scam', 'money', 'upi', 'bank', 'loan'],
            sectionNumber: '316',
            urgencyLevel: enums_1.UrgencyLevel.MEDIUM,
            urgencyReason: 'The statement suggests a financial fraud requiring evidence preservation.',
            severityScore: 0.69,
        },
        {
            keywords: ['harass', 'touch', 'sexual', 'stalk', 'molest'],
            sectionNumber: '75',
            urgencyLevel: enums_1.UrgencyLevel.HIGH,
            urgencyReason: 'The statement suggests sexual harassment or gender-based harm.',
            severityScore: 0.88,
        },
    ];
    const match = patterns.find((pattern) => pattern.keywords.some((keyword) => lower.includes(keyword)));
    return (match ?? {
        sectionNumber: '303',
        urgencyLevel: enums_1.UrgencyLevel.MEDIUM,
        urgencyReason: 'The statement suggests a property or general complaint requiring station review.',
        severityScore: 0.58,
    });
};
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
    const scored = scoreText(statement.rawText ?? statement.translatedText ?? '');
    const section = await database_1.prisma.bNSSection.findUnique({
        where: { sectionNumber: scored.sectionNumber },
    });
    if (!section) {
        throw new ApiError_1.ApiError(500, 'BNS catalog is not ready.');
    }
    const classification = await database_1.prisma.crimeClassification.upsert({
        where: { victimStatementId: statement.id },
        update: {
            bnsSectionId: section.id,
            confidenceScore: scored.severityScore,
            urgencyLevel: scored.urgencyLevel,
            urgencyReason: scored.urgencyReason,
            severityScore: scored.severityScore,
            alternativeSections: [
                { sectionNumber: '351', title: 'Criminal intimidation' },
                { sectionNumber: '303', title: 'Theft' },
            ],
            modelVersion: 'heuristic-v1',
        },
        create: {
            victimStatementId: statement.id,
            bnsSectionId: section.id,
            confidenceScore: scored.severityScore,
            urgencyLevel: scored.urgencyLevel,
            urgencyReason: scored.urgencyReason,
            severityScore: scored.severityScore,
            alternativeSections: [
                { sectionNumber: '351', title: 'Criminal intimidation' },
                { sectionNumber: '303', title: 'Theft' },
            ],
            modelVersion: 'heuristic-v1',
        },
        include: {
            bnsSection: true,
            victimStatement: true,
        },
    });
    return classification;
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
