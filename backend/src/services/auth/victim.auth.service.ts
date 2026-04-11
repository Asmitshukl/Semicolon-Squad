import { Gender, Language, Role } from '../../generated/prisma/enums';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { hashPassword } from '../../utils/hash';
import { buildAuthResponse, ensureUniqueIdentity } from './shared.auth.service';

type VictimRegistrationInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  gender?: string;
  language?: string;
};

const genderMap: Record<string, Gender> = {
  male: Gender.MALE,
  female: Gender.FEMALE,
  other: Gender.OTHER,
  prefer_not_to_say: Gender.PREFER_NOT_TO_SAY,
};

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

export const registerVictim = async (input: VictimRegistrationInput) => {
  await ensureUniqueIdentity(input.email, input.phone);

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      passwordHash: hashPassword(input.password),
      role: Role.VICTIM,
      gender: input.gender ? genderMap[input.gender] : undefined,
      preferredLang: input.language ? languageMap[input.language] ?? Language.ENGLISH : Language.ENGLISH,
    },
    include: {
      officer: true,
    },
  });

  return buildAuthResponse(user);
};

export const ensureVictimPayload = (body: Record<string, unknown>) => {
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? '').trim();
  const password = String(body.password ?? '');
  const gender = body.gender ? String(body.gender) : undefined;
  const language = body.language ? String(body.language) : undefined;

  if (name.length < 2) {
    throw new ApiError(400, 'Full name must be at least 2 characters.');
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, 'Enter a valid email address.');
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new ApiError(400, 'Enter a valid 10-digit Indian mobile number.');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }

  return { name, email, phone, password, gender, language };
};
