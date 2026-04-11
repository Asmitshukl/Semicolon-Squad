"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestVictimStatement = exports.createVictimStatement = exports.victimLanguageFromCode = exports.languageEnumToIso = void 0;
const enums_1 = require("../../generated/prisma/enums");
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const catalog_service_1 = require("./catalog.service");
const languageEnumToIso = (lang) => {
    if (lang === enums_1.Language.HINDI)
        return 'hi';
    return 'en';
};
exports.languageEnumToIso = languageEnumToIso;
const victimLanguageFromCode = (code) => {
    const languageMap = {
        en: enums_1.Language.ENGLISH,
        hi: enums_1.Language.HINDI,
        bh: enums_1.Language.BHOJPURI,
        mr: enums_1.Language.MARATHI,
        ta: enums_1.Language.TAMIL,
        te: enums_1.Language.TELUGU,
        bn: enums_1.Language.BENGALI,
        gu: enums_1.Language.GUJARATI,
        kn: enums_1.Language.KANNADA,
        ml: enums_1.Language.MALAYALAM,
        pa: enums_1.Language.PUNJABI,
        or: enums_1.Language.ODIA,
    };
    if (!code)
        return enums_1.Language.ENGLISH;
    return languageMap[code.trim().toLowerCase()] ?? enums_1.Language.ENGLISH;
};
exports.victimLanguageFromCode = victimLanguageFromCode;
const createVictimStatement = async (userId, payload) => {
    await (0, catalog_service_1.ensureVictimCatalog)();
    if (!payload.rawText.trim()) {
        throw new ApiError_1.ApiError(400, 'Statement text is required.');
    }
    return database_1.prisma.victimStatement.create({
        data: {
            userId,
            rawText: payload.rawText.trim(),
            translatedText: payload.translatedText?.trim() || null,
            language: (0, exports.victimLanguageFromCode)(payload.language),
            incidentDate: payload.incidentDate ? new Date(payload.incidentDate) : null,
            incidentTime: payload.incidentTime?.trim() || null,
            incidentLocation: payload.incidentLocation?.trim() || null,
            witnessDetails: payload.witnessDetails?.trim() || null,
        },
    });
};
exports.createVictimStatement = createVictimStatement;
const getLatestVictimStatement = async (userId) => database_1.prisma.victimStatement.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
        classification: {
            include: {
                bnsSection: true,
            },
        },
    },
});
exports.getLatestVictimStatement = getLatestVictimStatement;
