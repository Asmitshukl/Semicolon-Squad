"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureVictimPayload = exports.registerVictim = void 0;
const enums_1 = require("../../generated/prisma/enums");
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const hash_1 = require("../../utils/hash");
const shared_auth_service_1 = require("./shared.auth.service");
const genderMap = {
    male: enums_1.Gender.MALE,
    female: enums_1.Gender.FEMALE,
    other: enums_1.Gender.OTHER,
    prefer_not_to_say: enums_1.Gender.PREFER_NOT_TO_SAY,
};
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
const registerVictim = async (input) => {
    await (0, shared_auth_service_1.ensureUniqueIdentity)(input.email, input.phone);
    const user = await database_1.prisma.user.create({
        data: {
            name: input.name.trim(),
            email: input.email.trim().toLowerCase(),
            phone: input.phone.trim(),
            passwordHash: (0, hash_1.hashPassword)(input.password),
            role: enums_1.Role.VICTIM,
            gender: input.gender ? genderMap[input.gender] : undefined,
            preferredLang: input.language ? languageMap[input.language] ?? enums_1.Language.ENGLISH : enums_1.Language.ENGLISH,
        },
        include: {
            officer: true,
        },
    });
    return (0, shared_auth_service_1.buildAuthResponse)(user);
};
exports.registerVictim = registerVictim;
const ensureVictimPayload = (body) => {
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phone = String(body.phone ?? '').trim();
    const password = String(body.password ?? '');
    const gender = body.gender ? String(body.gender) : undefined;
    const language = body.language ? String(body.language) : undefined;
    if (name.length < 2) {
        throw new ApiError_1.ApiError(400, 'Full name must be at least 2 characters.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new ApiError_1.ApiError(400, 'Enter a valid email address.');
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
        throw new ApiError_1.ApiError(400, 'Enter a valid 10-digit Indian mobile number.');
    }
    if (password.length < 8) {
        throw new ApiError_1.ApiError(400, 'Password must be at least 8 characters.');
    }
    return { name, email, phone, password, gender, language };
};
exports.ensureVictimPayload = ensureVictimPayload;
