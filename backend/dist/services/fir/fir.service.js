"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIRService = void 0;
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const enums_1 = require("../../generated/prisma/enums");
class FIRService {
    static async createFIR(input) {
        // Validate victim exists
        const victim = await database_1.prisma.user.findUnique({
            where: { id: input.victimId },
        });
        if (!victim) {
            throw new ApiError_1.ApiError(404, 'Victim not found');
        }
        if (victim.role !== enums_1.Role.VICTIM) {
            throw new ApiError_1.ApiError(400, 'User must be a victim to file an FIR');
        }
        // Validate station exists
        const station = await database_1.prisma.policeStation.findUnique({
            where: { id: input.stationId },
        });
        if (!station) {
            throw new ApiError_1.ApiError(404, 'Police station not found');
        }
        // Create FIR
        const fir = await database_1.prisma.fIR.create({
            data: {
                victimId: input.victimId,
                stationId: input.stationId,
                incidentDate: input.incidentDate,
                incidentTime: input.incidentTime,
                incidentLocation: input.incidentLocation,
                incidentDescription: input.incidentDescription,
                urgencyLevel: input.urgencyLevel || enums_1.UrgencyLevel.MEDIUM,
                status: enums_1.FIRStatus.DRAFT,
                isOnlineFIR: true,
                bnsSections: input.bnsSectionIds
                    ? {
                        connect: input.bnsSectionIds.map((id) => ({ id })),
                    }
                    : undefined,
            },
            include: {
                victim: true,
                station: true,
                bnsSections: true,
            },
        });
        return fir;
    }
    /**
     * Officer-generated draft FIR from a voice recording.
     * Uses the officer's own user record as the FIR owner (victim field)
     * since this is an officer-initiated draft directly from a voice statement.
     */
    static async createOfficerDraftFIR(input) {
        const officer = await database_1.prisma.user.findUnique({
            where: { id: input.officerUserId },
            include: { officer: { include: { station: true } } },
        });
        if (!officer) {
            throw new ApiError_1.ApiError(404, 'Officer user not found');
        }
        if (!officer.officer) {
            throw new ApiError_1.ApiError(403, 'User does not have an officer profile');
        }
        const stationId = input.stationId || officer.officer.stationId;
        const station = await database_1.prisma.policeStation.findUnique({
            where: { id: stationId },
        });
        if (!station) {
            throw new ApiError_1.ApiError(404, 'Police station not found');
        }
        const fir = await database_1.prisma.fIR.create({
            data: {
                // Link the FIR's victim to the officer's own user — acts as a placeholder for officer-generated drafts
                victimId: input.officerUserId,
                stationId,
                officerId: officer.officer.id,
                incidentDate: input.incidentDate,
                incidentLocation: input.incidentLocation,
                incidentDescription: input.incidentDescription,
                urgencyLevel: input.urgencyLevel || enums_1.UrgencyLevel.MEDIUM,
                status: enums_1.FIRStatus.DRAFT,
                isOnlineFIR: false,
                bnsSections: input.bnsSectionIds?.length
                    ? { connect: input.bnsSectionIds.map((id) => ({ id })) }
                    : undefined,
                // Link voice recording if provided
                voiceRecordings: input.voiceRecordingId
                    ? { connect: { id: input.voiceRecordingId } }
                    : undefined,
            },
            include: {
                victim: { select: { id: true, name: true, phone: true } },
                officer: {
                    include: { user: { select: { name: true } }, station: true },
                },
                station: true,
                bnsSections: true,
                voiceRecordings: {
                    include: { victimStatement: true },
                },
                caseUpdates: true,
                victimStatements: true,
            },
        });
        return fir;
    }
    static async updateFIR(firId, input) {
        const fir = await database_1.prisma.fIR.findUnique({ where: { id: firId } });
        if (!fir) {
            throw new ApiError_1.ApiError(404, 'FIR not found');
        }
        if (fir.status !== enums_1.FIRStatus.DRAFT && input.status && input.status !== fir.status) {
            throw new ApiError_1.ApiError(400, 'Can only change status from specific states');
        }
        return database_1.prisma.fIR.update({
            where: { id: firId },
            data: input,
            include: {
                victim: true,
                officer: true,
                station: true,
                bnsSections: true,
                victimStatements: true,
                voiceRecordings: true,
            },
        });
    }
    static async submitFIR(firId, officerId) {
        const fir = await database_1.prisma.fIR.findUnique({ where: { id: firId } });
        if (!fir) {
            throw new ApiError_1.ApiError(404, 'FIR not found');
        }
        if (fir.status !== enums_1.FIRStatus.DRAFT) {
            throw new ApiError_1.ApiError(400, 'Only draft FIRs can be submitted');
        }
        const officer = await database_1.prisma.officer.findUnique({ where: { id: officerId } });
        if (!officer) {
            throw new ApiError_1.ApiError(404, 'Officer not found');
        }
        const acknowledgmentNo = `ACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const firNumber = `FIR-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        return database_1.prisma.fIR.update({
            where: { id: firId },
            data: {
                status: enums_1.FIRStatus.ACKNOWLEDGED,
                officerId,
                acknowledgmentNo,
                firNumber,
                officerSignedAt: new Date(),
            },
            include: {
                victim: true,
                officer: true,
                station: true,
                bnsSections: true,
            },
        });
    }
    static async getFIR(firId) {
        return database_1.prisma.fIR.findUnique({
            where: { id: firId },
            include: {
                victim: true,
                officer: true,
                station: true,
                bnsSections: true,
                victimStatements: true,
                voiceRecordings: true,
                evidenceItems: true,
                caseUpdates: true,
                smsNotifications: true,
            },
        });
    }
    static async getFIRsByVictim(victimId, status) {
        const where = { victimId };
        if (status) {
            where.status = status;
        }
        return database_1.prisma.fIR.findMany({
            where,
            include: {
                officer: true,
                station: true,
                bnsSections: true,
                voiceRecordings: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async getFIRsByStation(stationId, status) {
        const where = { stationId };
        if (status) {
            where.status = status;
        }
        return database_1.prisma.fIR.findMany({
            where,
            include: {
                victim: true,
                officer: true,
                bnsSections: true,
                voiceRecordings: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async getFIRsByOfficer(officerId, status) {
        const where = { officerId };
        if (status) {
            where.status = status;
        }
        return database_1.prisma.fIR.findMany({
            where,
            include: {
                victim: true,
                station: true,
                bnsSections: true,
                voiceRecordings: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async trackFIRByAcknowledgment(acknowledgmentNo) {
        const fir = await database_1.prisma.fIR.findUnique({
            where: { acknowledgmentNo },
            include: {
                victim: true,
                officer: true,
                station: true,
                bnsSections: true,
                caseUpdates: true,
            },
        });
        if (!fir) {
            throw new ApiError_1.ApiError(404, 'FIR not found with this acknowledgment number');
        }
        return fir;
    }
    static async addCaseUpdate(firId, status, note, updatedById) {
        const fir = await database_1.prisma.fIR.findUnique({ where: { id: firId } });
        if (!fir) {
            throw new ApiError_1.ApiError(404, 'FIR not found');
        }
        return database_1.prisma.caseUpdate.create({
            data: {
                firId,
                status,
                note,
                updatedById,
            },
        });
    }
    static async generateAIFIRSummary(firId, aiGeneratedSummary) {
        return database_1.prisma.fIR.update({
            where: { id: firId },
            data: { aiGeneratedSummary },
            include: {
                victim: true,
                officer: true,
                station: true,
                bnsSections: true,
            },
        });
    }
}
exports.FIRService = FIRService;
