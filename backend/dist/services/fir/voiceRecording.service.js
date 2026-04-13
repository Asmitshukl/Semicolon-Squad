"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceRecordingService = void 0;
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
const env_1 = require("../../config/env");
const mlClient_1 = require("../ml/mlClient");
const normalize_1 = require("../ml/normalize");
const complaint_service_1 = require("../victim/complaint.service");
const statement_service_1 = require("../victim/statement.service");
const summary_service_1 = require("./summary.service");
const localPipeline_1 = require("../ml/localPipeline");
const languageToIso = (language) => {
    switch (language) {
        case 'HINDI':
            return 'hi';
        case 'BHOJPURI':
            return 'bh';
        case 'MARATHI':
            return 'mr';
        case 'TAMIL':
            return 'ta';
        case 'TELUGU':
            return 'te';
        case 'BENGALI':
            return 'bn';
        case 'GUJARATI':
            return 'gu';
        case 'KANNADA':
            return 'kn';
        case 'MALAYALAM':
            return 'ml';
        case 'PUNJABI':
            return 'pa';
        case 'ODIA':
            return 'or';
        case 'ENGLISH':
        default:
            return 'en';
    }
};
const extensionFromMime = (mimeType, filename) => {
    const lowerMime = (mimeType ?? '').toLowerCase();
    const fromName = filename?.split('.').pop()?.toLowerCase();
    if (fromName)
        return fromName;
    if (lowerMime.includes('ogg'))
        return 'ogg';
    if (lowerMime.includes('wav'))
        return 'wav';
    if (lowerMime.includes('mpeg') || lowerMime.includes('mp3'))
        return 'mp3';
    if (lowerMime.includes('mp4') || lowerMime.includes('m4a'))
        return 'm4a';
    return 'webm';
};
class VoiceRecordingService {
    static async storeVoiceUpload(input) {
        const language = (0, statement_service_1.victimLanguageFromCode)((input.languageCode ?? 'hi').toLowerCase());
        const uploadRoot = node_path_1.default.join(process.cwd(), 'uploads', 'voice');
        await promises_1.default.mkdir(uploadRoot, { recursive: true });
        const ext = extensionFromMime(input.mimeType, input.filename);
        const relativePath = node_path_1.default
            .join('uploads', 'voice', `${input.userId}-${(0, node_crypto_1.randomUUID)()}.${ext}`)
            .split(node_path_1.default.sep)
            .join('/');
        const absolutePath = node_path_1.default.join(process.cwd(), relativePath);
        await promises_1.default.writeFile(absolutePath, input.buffer);
        const recording = await this.createVoiceRecording({
            userId: input.userId,
            firId: input.firId,
            language,
            fileUrl: relativePath,
            durationSecs: input.durationSecs,
        });
        if (input.rawText?.trim()) {
            await this.attachTranscriptFallback(recording.id, input.rawText);
        }
        const processed = await this.processVoiceRecording(recording.id);
        return processed;
    }
    static async createVoiceRecording(input) {
        // Validate user exists
        const user = await database_1.prisma.user.findUnique({
            where: { id: input.userId },
        });
        if (!user) {
            throw new ApiError_1.ApiError(404, 'User not found');
        }
        // Validate FIR if provided
        if (input.firId) {
            const fir = await database_1.prisma.fIR.findUnique({
                where: { id: input.firId },
            });
            if (!fir) {
                throw new ApiError_1.ApiError(404, 'FIR not found');
            }
        }
        return database_1.prisma.voiceRecording.create({
            data: {
                userId: input.userId,
                firId: input.firId,
                language: input.language,
                fileUrl: input.fileUrl,
                durationSecs: input.durationSecs,
                recordedAt: new Date(),
            },
            include: {
                user: true,
                fir: true,
                victimStatement: true,
            },
        });
    }
    static async getVoiceRecording(recordingId) {
        return database_1.prisma.voiceRecording.findUnique({
            where: { id: recordingId },
            include: {
                user: true,
                fir: true,
                victimStatement: true,
            },
        });
    }
    /** Deep-loads a recording including the VictimStatement's CrimeClassification for BNS section resolution. */
    static async getVoiceRecordingWithClassification(recordingId) {
        return database_1.prisma.voiceRecording.findUnique({
            where: { id: recordingId },
            include: {
                user: true,
                fir: true,
                victimStatement: {
                    include: {
                        classification: true,
                    },
                },
            },
        });
    }
    static async getVoiceRecordingsByUser(userId) {
        return database_1.prisma.voiceRecording.findMany({
            where: { userId },
            include: {
                fir: true,
                victimStatement: true,
            },
            orderBy: { recordedAt: 'desc' },
        });
    }
    static async getVoiceRecordingsByFIR(firId) {
        return database_1.prisma.voiceRecording.findMany({
            where: { firId },
            include: {
                user: true,
                victimStatement: true,
            },
            orderBy: { recordedAt: 'desc' },
        });
    }
    /**
     * Add transcript from external speech-to-text service
     */
    static async updateWithTranscript(recordingId, transcript) {
        const recording = await database_1.prisma.voiceRecording.findUnique({
            where: { id: recordingId },
        });
        if (!recording) {
            throw new ApiError_1.ApiError(404, 'Voice recording not found');
        }
        return database_1.prisma.voiceRecording.update({
            where: { id: recordingId },
            data: { transcript },
            include: {
                user: true,
                fir: true,
                victimStatement: true,
            },
        });
    }
    /**
     * Mark recording as verified by officer
     */
    static async markAsVerified(recordingId) {
        return database_1.prisma.voiceRecording.update({
            where: { id: recordingId },
            data: {
                isVerified: true,
                verifiedAt: new Date(),
            },
            include: {
                user: true,
                fir: true,
            },
        });
    }
    /**
     * Process voice recording through ML service
     * Handles transcription and classification
     */
    static async processVoiceRecording(recordingId) {
        const recording = await database_1.prisma.voiceRecording.findUnique({
            where: { id: recordingId },
            include: { victimStatement: true },
        });
        if (!recording) {
            throw new ApiError_1.ApiError(404, 'Voice recording not found');
        }
        const absolutePath = node_path_1.default.isAbsolute(recording.fileUrl)
            ? recording.fileUrl
            : node_path_1.default.join(process.cwd(), recording.fileUrl);
        const isoLanguage = languageToIso(recording.language);
        const transcriptFallback = (recording.transcript ?? '').trim();
        // ── Step 1: Get normalized pipeline output ──────────────────────────────
        let normalized = null;
        try {
            const audioBuffer = await promises_1.default.readFile(absolutePath);
            if (env_1.env.mlServiceUrl) {
                try {
                    normalized = await (0, mlClient_1.remotePipelineAudio)(audioBuffer, node_path_1.default.basename(absolutePath), `audio/${extensionFromMime(undefined, absolutePath)}`, {
                        language: isoLanguage,
                        raw_text: transcriptFallback,
                        rawText: transcriptFallback,
                        rawComplaintText: transcriptFallback,
                    });
                }
                catch (mlErr) {
                    console.warn('[VoiceRecording] ML audio pipeline failed, trying text fallback:', mlErr);
                    if (transcriptFallback) {
                        normalized = await (0, localPipeline_1.buildLocalFullPipelineFromText)(transcriptFallback);
                        normalized.transcript = transcriptFallback;
                    }
                }
            }
            else if (transcriptFallback) {
                normalized = await (0, localPipeline_1.buildLocalFullPipelineFromText)(transcriptFallback);
                normalized.transcript = transcriptFallback;
            }
        }
        catch (readErr) {
            console.error('[VoiceRecording] Failed to read audio file:', readErr);
        }
        // ── Step 2: Extract transcript (best-effort, never throw) ───────────────
        const transcript = (normalized?.transcript || normalized?.rawComplaintText || transcriptFallback).trim();
        try {
            // Save transcript if we got one
            const updatedRecording = transcript
                ? await this.updateWithTranscript(recordingId, transcript)
                : await database_1.prisma.voiceRecording.findUniqueOrThrow({
                    where: { id: recordingId },
                    include: { user: true, fir: true, victimStatement: true },
                });
            // ── Step 3: Persist statement + classification if transcript available ─
            if (transcript && normalized) {
                const statement = recording.victimStatement
                    ? await database_1.prisma.victimStatement.update({
                        where: { id: recording.victimStatement.id },
                        data: {
                            rawText: transcript,
                            language: recording.language,
                            firId: recording.firId,
                        },
                    })
                    : await database_1.prisma.victimStatement.create({
                        data: {
                            userId: recording.userId,
                            voiceRecordingId: recordingId,
                            rawText: transcript,
                            language: recording.language,
                            firId: recording.firId,
                        },
                    });
                // Only persist classification if we actually got BNS sections
                if (normalized.classifications.length > 0) {
                    await (0, complaint_service_1.persistVictimClassification)(statement.id, (0, normalize_1.fullPipelineToClassificationPayload)(normalized));
                    if (recording.firId) {
                        await database_1.prisma.fIR.update({
                            where: { id: recording.firId },
                            data: {
                                incidentDescription: transcript,
                                urgencyLevel: normalized.urgencyLevel,
                            },
                        });
                        await summary_service_1.FIRSummaryService.generateSummary(recording.firId);
                    }
                }
            }
            return updatedRecording;
        }
        catch (error) {
            console.error('[VoiceRecording] Error during post-processing:', error);
            // Re-throw only real 4xx errors; swallow 5xx/runtime errors
            if (error instanceof ApiError_1.ApiError && error.statusCode < 500)
                throw error;
            // Return the recording as saved (upload succeeded even if processing failed)
            const saved = await database_1.prisma.voiceRecording.findUnique({
                where: { id: recordingId },
                include: { user: true, fir: true, victimStatement: true },
            });
            if (!saved)
                throw new ApiError_1.ApiError(404, 'Voice recording not found after processing');
            return saved;
        }
    }
    static async attachTranscriptFallback(recordingId, transcript) {
        const cleaned = String(transcript ?? '').trim();
        if (!cleaned) {
            return this.getVoiceRecording(recordingId);
        }
        return database_1.prisma.voiceRecording.update({
            where: { id: recordingId },
            data: { transcript: cleaned },
            include: {
                user: true,
                fir: true,
                victimStatement: true,
            },
        });
    }
}
exports.VoiceRecordingService = VoiceRecordingService;
