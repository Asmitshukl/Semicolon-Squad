"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.victimPipelineController = void 0;
const enums_1 = require("../../generated/prisma/enums");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const server_shared_1 = require("../../server.shared");
const pipeline_service_1 = require("../../services/victim/pipeline.service");
const victimPipelineController = async (req, res, body) => {
    const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.VICTIM]);
    const hasAudio = Boolean(body.__multipart) && Buffer.isBuffer(body.audioBuffer);
    const durationRaw = body.durationSecs ?? body.duration;
    const durationSecs = typeof durationRaw === 'string'
        ? Number.parseInt(durationRaw, 10)
        : typeof durationRaw === 'number'
            ? durationRaw
            : undefined;
    const result = await (0, pipeline_service_1.runVictimMlPipeline)(user.id, {
        rawText: typeof body.rawText === 'string' ? body.rawText : undefined,
        audio: hasAudio
            ? {
                buffer: body.audioBuffer,
                filename: String(body.audioFilename ?? 'recording.webm'),
                mimeType: String(body.audioMimeType ?? 'audio/webm'),
            }
            : undefined,
        language: typeof body.language === 'string' ? body.language : 'hi',
        incidentDate: typeof body.incidentDate === 'string' ? body.incidentDate : undefined,
        incidentTime: typeof body.incidentTime === 'string' ? body.incidentTime : undefined,
        incidentLocation: typeof body.incidentLocation === 'string' ? body.incidentLocation : undefined,
        witnessDetails: typeof body.witnessDetails === 'string' ? body.witnessDetails : undefined,
        durationSecs: Number.isFinite(durationSecs) ? durationSecs : undefined,
    });
    (0, server_shared_1.sendJson)(res, 201, result);
};
exports.victimPipelineController = victimPipelineController;
