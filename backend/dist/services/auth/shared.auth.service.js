"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuthResponse = exports.getRedirectForRole = exports.toSafeUser = exports.ensureUniqueIdentity = void 0;
const enums_1 = require("../../generated/prisma/enums");
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const jwt_1 = require("../../utils/jwt");
const roleMap = {
    [enums_1.Role.VICTIM]: 'victim',
    [enums_1.Role.OFFICER]: 'officer',
    [enums_1.Role.ADMIN]: 'admin',
};
const genderMap = {
    [enums_1.Gender.MALE]: 'male',
    [enums_1.Gender.FEMALE]: 'female',
    [enums_1.Gender.OTHER]: 'other',
    [enums_1.Gender.PREFER_NOT_TO_SAY]: 'prefer_not_to_say',
};
const languageMap = {
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
const ensureUniqueIdentity = async (email, phone) => {
    const existingUser = await database_1.prisma.user.findFirst({
        where: {
            OR: [{ email }, { phone }],
        },
    });
    if (existingUser) {
        throw new ApiError_1.ApiError(409, 'An account with this email or phone already exists.');
    }
};
exports.ensureUniqueIdentity = ensureUniqueIdentity;
const toSafeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: roleMap[user.role],
    gender: user.gender ? genderMap[user.gender] : undefined,
    language: languageMap[user.preferredLang],
    isApproved: user.role === enums_1.Role.OFFICER
        ? user.officer?.verificationStatus === enums_1.OfficerVerificationStatus.VERIFIED
        : true,
    badgeNumber: user.officer?.badgeNumber,
    stationId: user.officer?.stationId,
    rank: user.officer?.rank,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
});
exports.toSafeUser = toSafeUser;
const getRedirectForRole = (role) => {
    if (role === 'victim') {
        return '/victim';
    }
    if (role === 'officer') {
        return '/officer';
    }
    return '/admin';
};
exports.getRedirectForRole = getRedirectForRole;
const buildAuthResponse = (user) => {
    const safeUser = (0, exports.toSafeUser)(user);
    const tokenPayload = {
        sub: user.id,
        role: safeUser.role,
    };
    return {
        user: safeUser,
        token: (0, jwt_1.createAccessToken)(tokenPayload),
        refreshToken: (0, jwt_1.createRefreshToken)(tokenPayload),
        redirectTo: (0, exports.getRedirectForRole)(safeUser.role),
    };
};
exports.buildAuthResponse = buildAuthResponse;
