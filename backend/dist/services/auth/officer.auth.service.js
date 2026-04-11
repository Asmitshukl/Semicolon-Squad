"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureOfficerPayload = exports.registerOfficer = void 0;
const enums_1 = require("../../generated/prisma/enums");
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const hash_1 = require("../../utils/hash");
const shared_auth_service_1 = require("./shared.auth.service");
const registerOfficer = async (input) => {
    await (0, shared_auth_service_1.ensureUniqueIdentity)(input.email, input.phone);
    const existingOfficer = await database_1.prisma.officer.findUnique({
        where: {
            badgeNumber: input.badgeNumber,
        },
    });
    if (existingOfficer) {
        throw new ApiError_1.ApiError(409, 'An officer with this badge number already exists.');
    }
    const station = await database_1.prisma.policeStation.findUnique({
        where: {
            stationCode: input.stationCode,
        },
    });
    if (!station) {
        throw new ApiError_1.ApiError(404, 'Police station not found for this station code.');
    }
    await database_1.prisma.user.create({
        data: {
            name: input.name.trim(),
            email: input.email.trim().toLowerCase(),
            phone: input.phone.trim(),
            passwordHash: (0, hash_1.hashPassword)(input.password),
            role: enums_1.Role.OFFICER,
            officer: {
                create: {
                    badgeNumber: input.badgeNumber.trim().toUpperCase(),
                    stationId: station.id,
                    rank: input.rank?.trim() || 'Officer',
                    department: station.district,
                    verificationStatus: enums_1.OfficerVerificationStatus.PENDING,
                },
            },
        },
    });
    return {
        message: 'Officer registration submitted successfully. An admin must verify the account before login.',
    };
};
exports.registerOfficer = registerOfficer;
const ensureOfficerPayload = (body) => {
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phone = String(body.phone ?? '').trim();
    const password = String(body.password ?? '');
    const badgeNumber = String(body.badgeNumber ?? '').trim().toUpperCase();
    const stationCode = String(body.stationCode ?? '').trim().toUpperCase();
    const rank = body.rank ? String(body.rank).trim() : undefined;
    if (name.length < 2) {
        throw new ApiError_1.ApiError(400, 'Full name is required.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new ApiError_1.ApiError(400, 'Enter a valid email address.');
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
        throw new ApiError_1.ApiError(400, 'Enter a valid 10-digit Indian mobile number.');
    }
    if (badgeNumber.length < 3) {
        throw new ApiError_1.ApiError(400, 'Badge number is required.');
    }
    if (stationCode.length < 3) {
        throw new ApiError_1.ApiError(400, 'Station code is required.');
    }
    if (password.length < 8) {
        throw new ApiError_1.ApiError(400, 'Password must be at least 8 characters.');
    }
    return { name, email, phone, password, badgeNumber, stationCode, rank };
};
exports.ensureOfficerPayload = ensureOfficerPayload;
