"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficerRecordingController = void 0;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const enums_1 = require("../../generated/prisma/enums");
const voiceRecording_service_1 = require("../../services/fir/voiceRecording.service");
const portal_service_1 = require("../../services/officer/portal.service");
const server_shared_1 = require("../../server.shared");
class OfficerRecordingController {
    static async listRecordings(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER]);
        const firId = typeof body.firId === 'string' ? body.firId : undefined;
        const recordings = await portal_service_1.OfficerPortalService.listStationVoiceRecordings(user.id, firId);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: recordings,
            count: recordings.length,
        });
    }
    static async verifyRecording(req, res, body) {
        await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER]);
        const recording = await voiceRecording_service_1.VoiceRecordingService.markAsVerified(String(body.recordingId ?? ''));
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: recording,
            message: 'Voice recording verified successfully.',
        });
    }
}
exports.OfficerRecordingController = OfficerRecordingController;
