"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runVictimMlPipeline = void 0;
const node_crypto_1 = require("node:crypto");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const env_1 = require("../../config/env");
const catalog_service_1 = require("./catalog.service");
const complaint_service_1 = require("./complaint.service");
const rights_service_1 = require("./rights.service");
const statement_service_1 = require("./statement.service");
const localPipeline_1 = require("../ml/localPipeline");
const mlClient_1 = require("../ml/mlClient");
const normalize_1 = require("../ml/normalize");
const pickExtension = (mime) => {
    const m = (mime || '').toLowerCase();
    if (m.includes('wav'))
        return 'wav';
    if (m.includes('mpeg') || m.includes('mp3'))
        return 'mp3';
    if (m.includes('mp4') || m.includes('m4a'))
        return 'm4a';
    return 'webm';
};
/**
 * End-to-end victim flow aligned with the ML stack:
 * audio/text → (Whisper + NER + IndicBERT + rights in Python when configured) → DB → structured JSON for the client.
 */
const runVictimMlPipeline = async (userId, input) => {
    await (0, catalog_service_1.ensureVictimCatalog)();
    const langIso = (input.language ?? 'hi').trim().toLowerCase();
    let normalized;
    if (input.audio?.buffer && input.audio.buffer.length > 0) {
        if (!env_1.env.mlServiceUrl) {
            throw new ApiError_1.ApiError(503, 'Voice intake requires the Python ML service. Set ML_SERVICE_URL in the backend environment, or use typed text.');
        }
        normalized = await (0, mlClient_1.remotePipelineAudio)(input.audio.buffer, input.audio.filename, input.audio.mimeType, {
            language: langIso,
        });
    }
    else if ((input.rawText ?? '').trim()) {
        const t = input.rawText.trim();
        if (env_1.env.mlServiceUrl) {
            try {
                normalized = await (0, mlClient_1.remotePipelineText)(t, langIso);
            }
            catch {
                normalized = await (0, localPipeline_1.buildLocalFullPipelineFromText)(t);
            }
        }
        else {
            normalized = await (0, localPipeline_1.buildLocalFullPipelineFromText)(t);
        }
    }
    else {
        throw new ApiError_1.ApiError(400, 'Provide complaint text or a voice recording.');
    }
    const rawText = (normalized.rawComplaintText || normalized.transcript || '').trim();
    if (!rawText) {
        throw new ApiError_1.ApiError(422, 'The ML service returned empty complaint text. Try again or type your statement.');
    }
    let voiceRecordingId;
    if (input.audio?.buffer && input.audio.buffer.length > 0) {
        const uploadRoot = node_path_1.default.join(process.cwd(), 'uploads', 'voice');
        await promises_1.default.mkdir(uploadRoot, { recursive: true });
        const fileId = (0, node_crypto_1.randomUUID)();
        const ext = pickExtension(input.audio.mimeType);
        const rel = node_path_1.default.join('uploads', 'voice', `${userId}-${fileId}.${ext}`).split(node_path_1.default.sep).join('/');
        const abs = node_path_1.default.join(process.cwd(), rel);
        await promises_1.default.writeFile(abs, input.audio.buffer);
        const vr = await database_1.prisma.voiceRecording.create({
            data: {
                userId,
                language: (0, statement_service_1.victimLanguageFromCode)(langIso),
                fileUrl: rel,
                transcript: (normalized.transcript || rawText).trim(),
                durationSecs: input.durationSecs ?? null,
            },
        });
        voiceRecordingId = vr.id;
    }
    const statement = await database_1.prisma.victimStatement.create({
        data: {
            userId,
            rawText,
            translatedText: null,
            language: (0, statement_service_1.victimLanguageFromCode)(langIso),
            incidentDate: input.incidentDate ? new Date(input.incidentDate) : null,
            incidentTime: input.incidentTime?.trim() || null,
            incidentLocation: input.incidentLocation?.trim() || null,
            witnessDetails: input.witnessDetails?.trim() || null,
            voiceRecordingId,
        },
    });
    const payload = (0, normalize_1.fullPipelineToClassificationPayload)(normalized);
    await (0, complaint_service_1.persistVictimClassification)(statement.id, payload);
    const classification = await database_1.prisma.crimeClassification.findUnique({
        where: { victimStatementId: statement.id },
        include: { bnsSection: true },
    });
    const resolution = await (0, complaint_service_1.getVictimResolution)(statement.id, userId);
    const rights = await (0, rights_service_1.getVictimRights)(userId, statement.id);
    return {
        statement,
        classification,
        resolution,
        rights,
        mlTrace: {
            transcript: normalized.transcript,
            rawComplaintText: normalized.rawComplaintText,
            entities: normalized.entities,
            classifications: normalized.classifications,
            victimRightsSummary: normalized.victimRightsSummary,
            victimRightsBullets: normalized.victimRightsBullets,
            modelVersion: normalized.modelVersion,
        },
    };
};
exports.runVictimMlPipeline = runVictimMlPipeline;
