"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboard = void 0;
const enums_1 = require("../../generated/prisma/enums");
const database_1 = require("../../config/database");
const getAdminDashboard = async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [pendingOfficerActions, policeStations, firsFiled24h, bnsSectionsLive, recentOfficers] = await Promise.all([
        database_1.prisma.officer.count({
            where: {
                verificationStatus: enums_1.OfficerVerificationStatus.PENDING,
            },
        }),
        database_1.prisma.policeStation.count(),
        database_1.prisma.fIR.count({
            where: {
                createdAt: {
                    gte: since,
                },
            },
        }),
        database_1.prisma.bNSSection.count(),
        database_1.prisma.officer.findMany({
            include: {
                user: true,
                station: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 5,
        }),
    ]);
    return {
        stats: {
            pendingOfficerActions,
            policeStations,
            firsFiled24h,
            bnsSectionsLive,
        },
        recentOfficers: recentOfficers.map((officer) => ({
            id: officer.id,
            badgeNumber: officer.badgeNumber,
            verificationStatus: officer.verificationStatus,
            submittedAt: officer.createdAt,
            name: officer.user.name,
            stationName: officer.station.name,
        })),
        systemStatus: {
            lastSync: new Date().toISOString(),
            apiGateway: 'Nominal',
            auditLogStream: 'CCTNS-LINK-READY',
        },
    };
};
exports.getAdminDashboard = getAdminDashboard;
