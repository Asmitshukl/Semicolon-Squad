"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewOfficerRegistration = exports.adminCreateOfficer = exports.listAdminOfficers = void 0;
const enums_1 = require("../../generated/prisma/enums");
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const hash_1 = require("../../utils/hash");
const shared_auth_service_1 = require("../auth/shared.auth.service");
const listAdminOfficers = async (status) => {
    const normalizedStatus = status?.toUpperCase();
    const where = normalizedStatus &&
        Object.values(enums_1.OfficerVerificationStatus).includes(normalizedStatus)
        ? {
            verificationStatus: normalizedStatus,
        }
        : undefined;
    const officers = await database_1.prisma.officer.findMany({
        where,
        include: {
            user: true,
            station: true,
        },
        orderBy: [{ verificationStatus: 'asc' }, { createdAt: 'desc' }],
    });
    return officers.map((officer) => ({
        id: officer.id,
        badgeNumber: officer.badgeNumber,
        rank: officer.rank,
        department: officer.department,
        verificationStatus: officer.verificationStatus,
        verifiedAt: officer.verifiedAt,
        createdAt: officer.createdAt,
        user: {
            id: officer.user.id,
            name: officer.user.name,
            email: officer.user.email,
            phone: officer.user.phone,
            isActive: officer.user.isActive,
            role: officer.user.role.toLowerCase(),
        },
        station: {
            id: officer.station.id,
            name: officer.station.name,
            stationCode: officer.station.stationCode,
            district: officer.station.district,
            state: officer.station.state,
        },
    }));
};
exports.listAdminOfficers = listAdminOfficers;
/**
 * Create a new officer account from the admin dashboard.
 * The officer is immediately VERIFIED and active — no approval queue needed.
 */
const adminCreateOfficer = async (input, adminId) => {
    await (0, shared_auth_service_1.ensureUniqueIdentity)(input.email, input.phone);
    const existingOfficer = await database_1.prisma.officer.findUnique({
        where: { badgeNumber: input.badgeNumber.trim().toUpperCase() },
    });
    if (existingOfficer) {
        throw new ApiError_1.ApiError(409, 'An officer with this badge number already exists.');
    }
    const station = await database_1.prisma.policeStation.findUnique({
        where: { stationCode: input.stationCode.trim().toUpperCase() },
    });
    if (!station) {
        throw new ApiError_1.ApiError(404, 'Police station not found for this station code.');
    }
    const user = await database_1.prisma.user.create({
        data: {
            name: input.name.trim(),
            email: input.email.trim().toLowerCase(),
            phone: input.phone.trim(),
            passwordHash: (0, hash_1.hashPassword)(input.password),
            role: enums_1.Role.OFFICER,
            isActive: true,
            officer: {
                create: {
                    badgeNumber: input.badgeNumber.trim().toUpperCase(),
                    stationId: station.id,
                    rank: input.rank?.trim() || 'Officer',
                    department: station.district,
                    verificationStatus: enums_1.OfficerVerificationStatus.VERIFIED,
                    verifiedAt: new Date(),
                    verifiedByAdminId: adminId,
                },
            },
        },
        include: {
            officer: {
                include: { station: true },
            },
        },
    });
    const officer = user.officer;
    return {
        id: officer.id,
        badgeNumber: officer.badgeNumber,
        rank: officer.rank,
        department: officer.department,
        verificationStatus: officer.verificationStatus,
        verifiedAt: officer.verifiedAt,
        createdAt: officer.createdAt,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isActive: user.isActive,
            role: user.role.toLowerCase(),
        },
        station: {
            id: officer.station.id,
            name: officer.station.name,
            stationCode: officer.station.stationCode,
            district: officer.station.district,
            state: officer.station.state,
        },
    };
};
exports.adminCreateOfficer = adminCreateOfficer;
const reviewOfficerRegistration = async (officerId, adminUserId, action) => {
    const officer = await database_1.prisma.officer.findUnique({
        where: {
            id: officerId,
        },
        include: {
            user: true,
            station: true,
        },
    });
    if (!officer) {
        throw new ApiError_1.ApiError(404, 'Officer registration not found.');
    }
    const verificationStatus = action === 'approve'
        ? enums_1.OfficerVerificationStatus.VERIFIED
        : enums_1.OfficerVerificationStatus.REJECTED;
    const updatedOfficer = await database_1.prisma.officer.update({
        where: {
            id: officerId,
        },
        data: {
            verificationStatus,
            verifiedAt: action === 'approve' ? new Date() : null,
            verifiedByAdminId: adminUserId,
            user: {
                update: {
                    isActive: action === 'approve',
                    role: enums_1.Role.OFFICER,
                },
            },
        },
        include: {
            user: true,
            station: true,
        },
    });
    return {
        id: updatedOfficer.id,
        verificationStatus: updatedOfficer.verificationStatus,
        verifiedAt: updatedOfficer.verifiedAt,
        user: {
            id: updatedOfficer.user.id,
            name: updatedOfficer.user.name,
            email: updatedOfficer.user.email,
            isActive: updatedOfficer.user.isActive,
        },
        station: {
            id: updatedOfficer.station.id,
            name: updatedOfficer.station.name,
            stationCode: updatedOfficer.station.stationCode,
        },
    };
};
exports.reviewOfficerRegistration = reviewOfficerRegistration;
