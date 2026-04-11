"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficerRecordingController = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const enums_1 = require("../../generated/prisma/enums");
const voiceRecording_service_1 = require("../../services/fir/voiceRecording.service");
const portal_service_1 = require("../../services/officer/portal.service");
const server_shared_1 = require("../../server.shared");
const ApiError_1 = require("../../utils/ApiError");
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
    static async getRecording(req, res, body) {
        await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER]);
        const recordingId = String(body.recordingId ?? '');
        const recording = await voiceRecording_service_1.VoiceRecordingService.getVoiceRecording(recordingId);
        if (!recording) {
            throw new ApiError_1.ApiError(404, 'Voice recording not found.');
        }
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: recording,
        });
    }
    static async streamAudio(req, res, body) {
        await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER]);
        const recordingId = String(body.recordingId ?? '');
        const recording = await voiceRecording_service_1.VoiceRecordingService.getVoiceRecording(recordingId);
        if (!recording) {
            throw new ApiError_1.ApiError(404, 'Voice recording not found.');
        }
        const absolutePath = node_path_1.default.isAbsolute(recording.fileUrl)
            ? recording.fileUrl
            : node_path_1.default.join(process.cwd(), recording.fileUrl);
        const buffer = await promises_1.default.readFile(absolutePath);
        const ext = node_path_1.default.extname(absolutePath).slice(1).toLowerCase();
        const mime = ext === 'wav'
            ? 'audio/wav'
            : ext === 'ogg'
                ? 'audio/ogg'
                : ext === 'mp3'
                    ? 'audio/mpeg'
                    : ext === 'm4a'
                        ? 'audio/mp4'
                        : 'audio/webm';
        res.statusCode = 200;
        res.setHeader('Content-Type', mime);
        res.end(buffer);
    }
}
exports.OfficerRecordingController = OfficerRecordingController;
