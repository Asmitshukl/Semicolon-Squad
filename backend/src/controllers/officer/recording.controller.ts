import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { Role } from '../../generated/prisma/enums';
import { VoiceRecordingService } from '../../services/fir/voiceRecording.service';
import { OfficerPortalService } from '../../services/officer/portal.service';
import { sendJson } from '../../server.shared';
import { ApiError } from '../../utils/ApiError';

export class OfficerRecordingController {
  static async listRecordings(req: IncomingMessage, res: ServerResponse, body: Record<string, unknown>) {
    const user = await getAuthenticatedUser(req, [Role.OFFICER]);
    const firId = typeof body.firId === 'string' ? body.firId : undefined;
    const recordings = await OfficerPortalService.listStationVoiceRecordings(user.id, firId);

    sendJson(res, 200, {
      success: true,
      data: recordings,
      count: recordings.length,
    });
  }

  static async verifyRecording(req: IncomingMessage, res: ServerResponse, body: Record<string, unknown>) {
    await getAuthenticatedUser(req, [Role.OFFICER]);
    const recording = await VoiceRecordingService.markAsVerified(String(body.recordingId ?? ''));

    sendJson(res, 200, {
      success: true,
      data: recording,
      message: 'Voice recording verified successfully.',
    });
  }

  static async getRecording(req: IncomingMessage, res: ServerResponse, body: Record<string, unknown>) {
    await getAuthenticatedUser(req, [Role.OFFICER]);
    const recordingId = String(body.recordingId ?? '');
    const recording = await VoiceRecordingService.getVoiceRecording(recordingId);
    if (!recording) {
      throw new ApiError(404, 'Voice recording not found.');
    }

    sendJson(res, 200, {
      success: true,
      data: recording,
    });
  }

  static async streamAudio(req: IncomingMessage, res: ServerResponse, body: Record<string, unknown>) {
    await getAuthenticatedUser(req, [Role.OFFICER]);
    const recordingId = String(body.recordingId ?? '');
    const recording = await VoiceRecordingService.getVoiceRecording(recordingId);
    if (!recording) {
      throw new ApiError(404, 'Voice recording not found.');
    }

    const absolutePath = path.isAbsolute(recording.fileUrl)
      ? recording.fileUrl
      : path.join(process.cwd(), recording.fileUrl);
    const buffer = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath).slice(1).toLowerCase();
    const mime =
      ext === 'wav'
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
