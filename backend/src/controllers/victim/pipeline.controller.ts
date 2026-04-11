import type { IncomingMessage, ServerResponse } from 'node:http';
import { Role } from '../../generated/prisma/enums';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { sendJson } from '../../server.shared';
import { runVictimMlPipeline } from '../../services/victim/pipeline.service';

export const victimPipelineController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const user = await getAuthenticatedUser(req, [Role.VICTIM]);

  const hasAudio = Boolean(body.__multipart) && Buffer.isBuffer(body.audioBuffer as Buffer);

  const durationRaw = body.durationSecs ?? body.duration;
  const durationSecs =
    typeof durationRaw === 'string'
      ? Number.parseInt(durationRaw, 10)
      : typeof durationRaw === 'number'
        ? durationRaw
        : undefined;

  const result = await runVictimMlPipeline(user.id, {
    rawText: typeof body.rawText === 'string' ? body.rawText : undefined,
    audio: hasAudio
      ? {
          buffer: body.audioBuffer as Buffer,
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

  sendJson(res, 201, result);
};
