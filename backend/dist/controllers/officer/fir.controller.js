"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIRController = void 0;
const fir_service_1 = require("../../services/fir/fir.service");
const voiceRecording_service_1 = require("../../services/fir/voiceRecording.service");
const evidenceChecklist_service_1 = require("../../services/fir/evidenceChecklist.service");
const anomalyDetection_service_1 = require("../../services/fir/anomalyDetection.service");
const pdf_service_1 = require("../../services/fir/pdf.service");
const summary_service_1 = require("../../services/fir/summary.service");
const fir_notification_service_1 = require("../../services/notification/fir.notification.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const ApiError_1 = require("../../utils/ApiError");
const server_shared_1 = require("../../server.shared");
const enums_1 = require("../../generated/prisma/enums");
class FIRController {
    static async createFIR(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.VICTIM]);
        const fir = await fir_service_1.FIRService.createFIR({
            victimId: user.id,
            stationId: body.stationId,
            incidentDate: new Date(body.incidentDate),
            incidentTime: body.incidentTime,
            incidentLocation: body.incidentLocation,
            incidentDescription: body.incidentDescription,
            bnsSectionIds: body.bnsSectionIds,
            urgencyLevel: body.urgencyLevel,
        });
        (0, server_shared_1.sendJson)(res, 201, {
            success: true,
            data: fir,
            message: 'FIR created successfully',
        });
    }
    static async updateFIR(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.VICTIM, enums_1.Role.OFFICER]);
        const fir = await fir_service_1.FIRService.updateFIR(body.firId, {
            incidentDate: body.incidentDate ? new Date(body.incidentDate) : undefined,
            incidentTime: body.incidentTime,
            incidentLocation: body.incidentLocation,
            incidentDescription: body.incidentDescription,
            status: body.status,
            urgencyLevel: body.urgencyLevel,
        });
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: fir,
            message: 'FIR updated successfully',
        });
    }
    static async submitFIR(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER]);
        if (!user.officer) {
            throw new ApiError_1.ApiError(403, 'User is not an officer');
        }
        const fir = await fir_service_1.FIRService.submitFIR(body.firId, user.officer.id);
        await summary_service_1.FIRSummaryService.generateSummary(fir.id);
        try {
            await fir_notification_service_1.NotificationService.sendFIRNotification(fir.id);
        }
        catch (error) {
            console.error('FIR notification failed:', error);
        }
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: fir,
            message: 'FIR submitted and acknowledged',
        });
    }
    static async getFIR(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req);
        const { firId } = body;
        const fir = await fir_service_1.FIRService.getFIR(firId);
        if (!fir) {
            throw new ApiError_1.ApiError(404, 'FIR not found');
        }
        // Check authorization
        const isStationOfficer = user.role === enums_1.Role.OFFICER && user.officer?.stationId === fir.stationId;
        if (fir.victimId !== user.id && user.role !== enums_1.Role.ADMIN && user.officer?.id !== fir.officerId && !isStationOfficer) {
            throw new ApiError_1.ApiError(403, 'Not authorized to view this FIR');
        }
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: fir,
        });
    }
    static async getFIRsByVictim(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.VICTIM]);
        const firs = await fir_service_1.FIRService.getFIRsByVictim(user.id, body.status);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: firs,
            count: firs.length,
        });
    }
    static async getFIRsByStation(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER, enums_1.Role.ADMIN]);
        if (user.role !== enums_1.Role.ADMIN && !user.officer) {
            throw new ApiError_1.ApiError(403, 'Not authorized');
        }
        const stationId = user.role === enums_1.Role.ADMIN ? body.stationId : user.officer.stationId;
        const firs = await fir_service_1.FIRService.getFIRsByStation(stationId, body.status);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: firs,
            count: firs.length,
        });
    }
    static async trackByAcknowledgment(req, res, body) {
        const { acknowledgmentNo } = body;
        const fir = await fir_service_1.FIRService.trackFIRByAcknowledgment(acknowledgmentNo);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: {
                firNumber: fir.firNumber,
                acknowledgmentNo: fir.acknowledgmentNo,
                status: fir.status,
                urgencyLevel: fir.urgencyLevel,
                incidentDate: fir.incidentDate,
                incidentLocation: fir.incidentLocation,
                station: {
                    name: fir.station.name,
                    phone: fir.station.phone,
                },
                officer: fir.officer ? { badgeNumber: fir.officer.badgeNumber, rank: fir.officer.rank } : null,
                caseUpdates: fir.caseUpdates.length > 0 ? fir.caseUpdates[fir.caseUpdates.length - 1] : null,
            },
        });
    }
    static async getEvidenceChecklist(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER]);
        const { checklist, items } = await evidenceChecklist_service_1.EvidenceChecklistService.generateChecklistForFIR(body.firId);
        const status = await evidenceChecklist_service_1.EvidenceChecklistService.getEvidenceStatus(body.firId);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: {
                checklist,
                items,
                status,
            },
        });
    }
    static async getAnomalyAnalysis(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER, enums_1.Role.ADMIN]);
        const anomalies = await anomalyDetection_service_1.AnomalyDetectionService.analyzeFIRForAnomalies(body.firId);
        const recommendations = await anomalyDetection_service_1.AnomalyDetectionService.generateInquiryRecommendations(body.firId);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: {
                anomalies,
                recommendations,
            },
        });
    }
    static async uploadVoiceRecording(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER, enums_1.Role.VICTIM]);
        const audioBuffer = body.audioBuffer;
        if (!audioBuffer || !Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
            throw new ApiError_1.ApiError(400, 'Audio file is required.');
        }
        const durationRaw = body.durationSecs ?? body.duration;
        const durationSecs = typeof durationRaw === 'string'
            ? Number.parseInt(durationRaw, 10)
            : typeof durationRaw === 'number'
                ? durationRaw
                : undefined;
        const recording = await voiceRecording_service_1.VoiceRecordingService.storeVoiceUpload({
            userId: user.id,
            firId: typeof body.firId === 'string' ? body.firId : undefined,
            languageCode: typeof body.language === 'string' ? body.language : 'hi',
            durationSecs: Number.isFinite(durationSecs) ? durationSecs : undefined,
            rawText: typeof body.rawText === 'string' ? body.rawText : undefined,
            buffer: audioBuffer,
            filename: typeof body.audioFilename === 'string' ? body.audioFilename : 'recording.webm',
            mimeType: typeof body.audioMimeType === 'string' ? body.audioMimeType : 'audio/webm',
        });
        (0, server_shared_1.sendJson)(res, 201, {
            success: true,
            data: recording,
            message: 'Voice recording uploaded and processed successfully',
        });
    }
    static async generateSummary(req, res, body) {
        await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER, enums_1.Role.ADMIN]);
        const firId = String(body.firId ?? '');
        if (!firId) {
            throw new ApiError_1.ApiError(400, 'FIR ID is required.');
        }
        const fir = await summary_service_1.FIRSummaryService.generateSummary(firId);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: fir,
            message: 'AI FIR summary generated.',
        });
    }
    static async downloadPDF(req, res, body) {
        await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER, enums_1.Role.ADMIN]);
        const firId = String(body.firId ?? '');
        if (!firId) {
            throw new ApiError_1.ApiError(400, 'FIR ID is required.');
        }
        const pdf = await pdf_service_1.FIRPdfService.generateForFir(firId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
        res.end(pdf.buffer);
    }
    static async markEvidenceCollected(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER]);
        const item = await evidenceChecklist_service_1.EvidenceChecklistService.markEvidenceCollected(body.evidenceItemId, body.fileUrl);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: item,
            message: 'Evidence marked as collected',
        });
    }
    static async addCaseUpdate(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER, enums_1.Role.ADMIN]);
        const update = await fir_service_1.FIRService.addCaseUpdate(body.firId, body.status, body.note, user.id);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: update,
            message: 'Case update recorded',
        });
    }
}
exports.FIRController = FIRController;
