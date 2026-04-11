import { Gender, OfficerVerificationStatus, Role } from '../../generated/prisma/enums';
import type { User, Officer } from '../../generated/prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { createAccessToken, createRefreshToken } from '../../utils/jwt';
import type { AppRole, AuthSuccessResponse, AuthenticatedUser } from '../../types/auth.types';

type UserWithOfficer = User & { officer: Officer | null };

const roleMap: Record<Role, AppRole> = {
  [Role.VICTIM]: 'victim',
  [Role.OFFICER]: 'officer',
  [Role.ADMIN]: 'admin',
};

const genderMap: Partial<Record<Gender, AuthenticatedUser['gender']>> = {
  [Gender.MALE]: 'male',
  [Gender.FEMALE]: 'female',
  [Gender.OTHER]: 'other',
  [Gender.PREFER_NOT_TO_SAY]: 'prefer_not_to_say',
};

const languageMap: Record<string, string> = {
  ENGLISH: 'en',
  HINDI: 'hi',
  BHOJPURI: 'bh',
  MARATHI: 'mr',
  TAMIL: 'ta',
  TELUGU: 'te',
  BENGALI: 'bn',
  GUJARATI: 'gu',
  KANNADA: 'kn',
  MALAYALAM: 'ml',
  PUNJABI: 'pa',
  ODIA: 'or',
};

export const ensureUniqueIdentity = async (email: string, phone: string) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    throw new ApiError(409, 'An account with this email or phone already exists.');
  }
};

export const toSafeUser = (user: UserWithOfficer): AuthenticatedUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: roleMap[user.role],
  gender: user.gender ? genderMap[user.gender] : undefined,
  language: languageMap[user.preferredLang],
  isApproved:
    user.role === Role.OFFICER
      ? user.officer?.verificationStatus === OfficerVerificationStatus.VERIFIED
      : true,
  badgeNumber: user.officer?.badgeNumber,
  stationId: user.officer?.stationId,
  rank: user.officer?.rank,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

export const getRedirectForRole = (role: AppRole) => {
  if (role === 'victim') {
    return '/victim';
  }

  if (role === 'officer') {
    return '/officer';
  }

  return '/admin';
};

export const buildAuthResponse = (user: UserWithOfficer): AuthSuccessResponse => {
  const safeUser = toSafeUser(user);
  const tokenPayload = {
    sub: user.id,
    role: safeUser.role,
  };

  return {
    user: safeUser,
    token: createAccessToken(tokenPayload),
    refreshToken: createRefreshToken(tokenPayload),
    redirectTo: getRedirectForRole(safeUser.role),
  };
};
