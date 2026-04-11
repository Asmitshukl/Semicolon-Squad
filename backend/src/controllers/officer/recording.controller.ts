import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { Role } from '../../generated/prisma/enums';
import { VoiceRecordingService } from '../../services/fir/voiceRecording.service';
import { OfficerPortalService } from '../../services/officer/portal.service';
import { sendJson } from '../../server.shared';

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
}
