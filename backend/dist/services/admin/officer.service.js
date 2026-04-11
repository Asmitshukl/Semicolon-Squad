"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewOfficerRegistration = exports.listAdminOfficers = void 0;
const enums_1 = require("../../generated/prisma/enums");
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
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
