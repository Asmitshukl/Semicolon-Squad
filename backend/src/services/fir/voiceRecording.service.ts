import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import type { VoiceRecording } from '../../generated/prisma/client';
import type { Language } from '../../generated/prisma/enums';

export interface createVoiceRecordingInput {
  userId: string;
  firId?: string;
  language: Language;
  fileUrl: string;
  durationSecs?: number;
}

export class VoiceRecordingService {
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
  static async processVoiceRecording(recordingId: string): Promise<void> {
    const recording = await prisma.voiceRecording.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new ApiError(404, 'Voice recording not found');
    }

    try {
      // Call transcription service - Replace with actual implementation
      const transcript = await this.transcribeAudio(recording.fileUrl, recording.language);

      // Update recording with transcript
      await this.updateWithTranscript(recordingId, transcript);

      // Check if victim statement already exists for this recording
      const existingStatement = await prisma.victimStatement.findFirst({
        where: { voiceRecordingId: recordingId },
      });

      // If no victim statement linked, create one from transcript
      if (!existingStatement) {
        await prisma.victimStatement.create({
          data: {
            userId: recording.userId,
            voiceRecordingId: recordingId,
            rawText: transcript,
            language: recording.language,
            firId: recording.firId,
          },
        });
      }
    } catch (error) {
      console.error('Error processing voice recording:', error);
      throw new ApiError(500, 'Failed to process voice recording');
    }
  }

  /**
   * Call external transcription service
   * This should be replaced with actual implementation
   */
  private static async transcribeAudio(fileUrl: string, language: Language): Promise<string> {
    try {
      const response = await fetch(process.env.TRANSCRIPTION_SERVICE_URL || 'http://localhost:5000/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TRANSCRIPTION_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          fileUrl,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Transcription service error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.transcript;
    } catch (error) {
      console.error('Transcription failed:', error);
      throw error;
    }
  }
}
