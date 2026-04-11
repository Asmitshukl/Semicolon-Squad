import { Language } from '../../generated/prisma/enums';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { ensureVictimCatalog } from './catalog.service';

export const languageEnumToIso = (lang: Language): string => {
  if (lang === Language.HINDI) return 'hi';
  return 'en';
};

export const victimLanguageFromCode = (code?: string): Language => {
  const languageMap: Record<string, Language> = {
    en: Language.ENGLISH,
    hi: Language.HINDI,
    bh: Language.BHOJPURI,
    mr: Language.MARATHI,
    ta: Language.TAMIL,
    te: Language.TELUGU,
    bn: Language.BENGALI,
    gu: Language.GUJARATI,
    kn: Language.KANNADA,
    ml: Language.MALAYALAM,
    pa: Language.PUNJABI,
    or: Language.ODIA,
  };
  if (!code) return Language.ENGLISH;
  return languageMap[code.trim().toLowerCase()] ?? Language.ENGLISH;
};

export const createVictimStatement = async (
  userId: string,
  payload: {
    rawText: string;
    translatedText?: string;
    language?: string;
    incidentDate?: string;
    incidentTime?: string;
    incidentLocation?: string;
    witnessDetails?: string;
  },
) => {
  await ensureVictimCatalog();

  if (!payload.rawText.trim()) {
    throw new ApiError(400, 'Statement text is required.');
  }

  return prisma.victimStatement.create({
    data: {
      userId,
      rawText: payload.rawText.trim(),
      translatedText: payload.translatedText?.trim() || null,
      language: victimLanguageFromCode(payload.language),
      incidentDate: payload.incidentDate ? new Date(payload.incidentDate) : null,
      incidentTime: payload.incidentTime?.trim() || null,
      incidentLocation: payload.incidentLocation?.trim() || null,
      witnessDetails: payload.witnessDetails?.trim() || null,
    },
  });
};

export const getLatestVictimStatement = async (userId: string) =>
  prisma.victimStatement.findFirst({
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
