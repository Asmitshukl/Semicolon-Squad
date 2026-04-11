"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficerPortalService = void 0;
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const enums_1 = require("../../generated/prisma/enums");
const urgencyRank = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
};
const startOfDay = (date = new Date()) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
};
class OfficerPortalService {
    static async getOfficerProfile(userId) {
        const officer = await database_1.prisma.officer.findUnique({
            where: { userId },
            include: {
                user: true,
                station: true,
                firs: true,
            },
        });
        if (!officer) {
            throw new ApiError_1.ApiError(404, 'Officer profile not found.');
        }
        const verifiedVoiceCount = await database_1.prisma.voiceRecording.count({
            where: {
                fir: {
                    stationId: officer.stationId,
                },
                isVerified: true,
            },
        });
        return {
            id: officer.id,
            badgeNumber: officer.badgeNumber,
            rank: officer.rank,
            department: officer.department,
            cctnsId: officer.cctnsId,
            verificationStatus: officer.verificationStatus,
            verifiedAt: officer.verifiedAt,
            joinedAt: officer.joinedAt,
            user: {
                id: officer.user.id,
                name: officer.user.name,
                email: officer.user.email,
                phone: officer.user.phone,
                preferredLang: officer.user.preferredLang,
            },
            station: officer.station,
            stats: {
                docsGenerated: officer.firs.filter((fir) => Boolean(fir.officerSignedAt)).length,
                firsHandled: officer.firs.length,
                voiceVerified: verifiedVoiceCount,
            },
        };
    }
    static async getDashboard(officerUserId) {
        const profile = await this.getOfficerProfile(officerUserId);
        const firs = await database_1.prisma.fIR.findMany({
            where: { stationId: profile.station.id },
            include: {
                victim: true,
                bnsSections: {
                    orderBy: { sectionNumber: 'asc' },
                    take: 3,
                },
                voiceRecordings: true,
                caseUpdates: {
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: [{ createdAt: 'desc' }],
        });
        const voiceUnverified = await database_1.prisma.voiceRecording.count({
            where: {
                fir: { stationId: profile.station.id },
                isVerified: false,
            },
        });
        const today = startOfDay();
        const queue = [...firs]
            .sort((a, b) => {
            const urgencyDiff = urgencyRank[b.urgencyLevel] - urgencyRank[a.urgencyLevel];
            if (urgencyDiff !== 0) {
                return urgencyDiff;
            }
            return b.createdAt.getTime() - a.createdAt.getTime();
        })
            .slice(0, 4);
        return {
            station: profile.station,
            officer: {
                name: profile.user.name,
                badgeNumber: profile.badgeNumber,
                rank: profile.rank,
            },
            stats: {
                firsReceived: firs.length,
                documentsPending: firs.filter((fir) => !fir.officerSignedAt &&
                    fir.status !== enums_1.FIRStatus.CLOSED &&
                    fir.status !== enums_1.FIRStatus.REJECTED).length,
                reviewedToday: firs.filter((fir) => fir.updatedAt >= today).length,
                voiceUnverified,
            },
            firs,
            queue,
        };
    }
    static async listStationVoiceRecordings(officerUserId, firId) {
        const profile = await this.getOfficerProfile(officerUserId);
        return database_1.prisma.voiceRecording.findMany({
            where: {
                ...(firId ? { firId } : {}),
                OR: [
                    {
                        fir: {
                            stationId: profile.station.id,
                        },
                    },
                    {
                        user: {
                            officer: {
                                stationId: profile.station.id,
                                verificationStatus: enums_1.OfficerVerificationStatus.VERIFIED,
                            },
                        },
                    },
                ],
            },
            include: {
                user: true,
                fir: {
                    include: {
                        bnsSections: {
                            orderBy: { sectionNumber: 'asc' },
                            take: 2,
                        },
                    },
                },
                victimStatement: true,
            },
            orderBy: [{ recordedAt: 'desc' }],
        });
    }
}
exports.OfficerPortalService = OfficerPortalService;
