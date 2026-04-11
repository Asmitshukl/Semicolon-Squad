import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import type { VoiceRecording } from '../../generated/prisma/client';
import type { Language } from '../../generated/prisma/enums';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env';
import { remotePipelineAudio } from '../ml/mlClient';
import { fullPipelineToClassificationPayload } from '../ml/normalize';
import { persistVictimClassification } from '../victim/complaint.service';
import { victimLanguageFromCode } from '../victim/statement.service';
import { FIRSummaryService } from './summary.service';

export interface createVoiceRecordingInput {
  userId: string;
  firId?: string;
  language: Language;
  fileUrl: string;
  durationSecs?: number;
}

export interface storeVoiceUploadInput {
  userId: string;
  firId?: string;
  languageCode?: string;
  durationSecs?: number;
  buffer: Buffer;
  filename?: string;
  mimeType?: string;
}

const languageToIso = (language: Language) => {
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

const extensionFromMime = (mimeType?: string, filename?: string) => {
  const lowerMime = (mimeType ?? '').toLowerCase();
  const fromName = filename?.split('.').pop()?.toLowerCase();
  if (fromName) return fromName;
  if (lowerMime.includes('ogg')) return 'ogg';
  if (lowerMime.includes('wav')) return 'wav';
  if (lowerMime.includes('mpeg') || lowerMime.includes('mp3')) return 'mp3';
  if (lowerMime.includes('mp4') || lowerMime.includes('m4a')) return 'm4a';
  return 'webm';
};

export class VoiceRecordingService {
  static async storeVoiceUpload(input: storeVoiceUploadInput) {
    const language = victimLanguageFromCode((input.languageCode ?? 'hi').toLowerCase());
    const uploadRoot = path.join(process.cwd(), 'uploads', 'voice');
    await fs.mkdir(uploadRoot, { recursive: true });

    const ext = extensionFromMime(input.mimeType, input.filename);
    const relativePath = path
      .join('uploads', 'voice', `${input.userId}-${randomUUID()}.${ext}`)
      .split(path.sep)
      .join('/');
    const absolutePath = path.join(process.cwd(), relativePath);
    await fs.writeFile(absolutePath, input.buffer);

    const recording = await this.createVoiceRecording({
      userId: input.userId,
      firId: input.firId,
      language,
      fileUrl: relativePath,
      durationSecs: input.durationSecs,
    });

    const processed = await this.processVoiceRecording(recording.id);
    return processed;
  }

  static async createVoiceRecording(input: createVoiceRecordingInput): Promise<VoiceRecording> {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Validate FIR if provided
    if (input.firId) {
      const fir = await prisma.fIR.findUnique({
        where: { id: input.firId },
      });

      if (!fir) {
        throw new ApiError(404, 'FIR not found');
      }
    }

    return prisma.voiceRecording.create({
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

  static async getVoiceRecording(recordingId: string): Promise<VoiceRecording | null> {
    return prisma.voiceRecording.findUnique({
      where: { id: recordingId },
      include: {
        user: true,
        fir: true,
        victimStatement: true,
      },
    });
  }

  static async getVoiceRecordingsByUser(userId: string) {
    return prisma.voiceRecording.findMany({
      where: { userId },
      include: {
        fir: true,
        victimStatement: true,
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  static async getVoiceRecordingsByFIR(firId: string) {
    return prisma.voiceRecording.findMany({
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
  static async updateWithTranscript(recordingId: string, transcript: string): Promise<VoiceRecording> {
    const recording = await prisma.voiceRecording.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new ApiError(404, 'Voice recording not found');
    }

    return prisma.voiceRecording.update({
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
  static async markAsVerified(recordingId: string): Promise<VoiceRecording> {
    return prisma.voiceRecording.update({
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
  static async processVoiceRecording(recordingId: string) {
    const recording = await prisma.voiceRecording.findUnique({
      where: { id: recordingId },
      include: {
        victimStatement: true,
      },
    });

    if (!recording) {
      throw new ApiError(404, 'Voice recording not found');
    }

    try {
      const absolutePath = path.isAbsolute(recording.fileUrl)
        ? recording.fileUrl
        : path.join(process.cwd(), recording.fileUrl);
      const audioBuffer = await fs.readFile(absolutePath);
      const isoLanguage = languageToIso(recording.language);

      if (!env.mlServiceUrl) {
        throw new Error('ML_SERVICE_URL is required for audio transcription.');
      }

      const normalized = await remotePipelineAudio(
        audioBuffer,
        path.basename(absolutePath),
        `audio/${extensionFromMime(undefined, absolutePath)}`,
        {
          language: isoLanguage,
        },
      );

      const transcript = (normalized.transcript || normalized.rawComplaintText || '').trim();
      if (!transcript) {
        throw new Error('Transcript is empty after ML processing.');
      }

      const updatedRecording = await this.updateWithTranscript(recordingId, transcript);

      const statement = recording.victimStatement
        ? await prisma.victimStatement.update({
            where: { id: recording.victimStatement.id },
            data: {
              rawText: transcript,
              language: recording.language,
              firId: recording.firId,
            },
          })
        : await prisma.victimStatement.create({
            data: {
              userId: recording.userId,
              voiceRecordingId: recordingId,
              rawText: transcript,
              language: recording.language,
              firId: recording.firId,
            },
          });

      await persistVictimClassification(statement.id, fullPipelineToClassificationPayload(normalized));

      if (recording.firId) {
        await prisma.fIR.update({
          where: { id: recording.firId },
          data: {
            incidentDescription: transcript,
            urgencyLevel: normalized.urgencyLevel,
          },
        });
        await FIRSummaryService.generateSummary(recording.firId);
      }

      return updatedRecording;
    } catch (error) {
      console.error('Error processing voice recording:', error);
      throw new ApiError(500, 'Failed to process voice recording');
    }
  }
}
