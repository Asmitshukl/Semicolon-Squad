import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';
import { ensureVictimCatalog } from './catalog.service';
import { persistVictimClassification, getVictimResolution } from './complaint.service';
import { getVictimRights } from './rights.service';
import { victimLanguageFromCode } from './statement.service';
import { buildLocalFullPipelineFromText } from '../ml/localPipeline';
import { remotePipelineAudio, remotePipelineText } from '../ml/mlClient';
import { fullPipelineToClassificationPayload } from '../ml/normalize';
import type { NormalizedFullPipeline } from '../../types/ml.types';

export type PipelineInput = {
  rawText?: string;
  audio?: { buffer: Buffer; filename: string; mimeType: string };
  language?: string;
  incidentDate?: string;
  incidentTime?: string;
  incidentLocation?: string;
  witnessDetails?: string;
  durationSecs?: number;
};

const pickExtension = (mime: string) => {
  const m = (mime || '').toLowerCase();
  if (m.includes('wav')) return 'wav';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('mp4') || m.includes('m4a')) return 'm4a';
  return 'webm';
};

/**
 * End-to-end victim flow aligned with the ML stack:
 * audio/text → (Whisper + NER + IndicBERT + rights in Python when configured) → DB → structured JSON for the client.
 */
export const runVictimMlPipeline = async (userId: string, input: PipelineInput) => {
  await ensureVictimCatalog();

  const langIso = (input.language ?? 'hi').trim().toLowerCase();
  const fallbackText = (input.rawText ?? '').trim();

  let normalized: NormalizedFullPipeline;

  if (input.audio?.buffer && input.audio.buffer.length > 0) {
    if (env.mlServiceUrl) {
      try {
        normalized = await remotePipelineAudio(input.audio.buffer, input.audio.filename, input.audio.mimeType, {
          language: langIso,
          raw_text: fallbackText,
          rawText: fallbackText,
          rawComplaintText: fallbackText,
        });
      } catch {
        if (!fallbackText) {
          throw new ApiError(
            503,
            'Voice transcription is temporarily unavailable. Record again with the live transcript visible below, or type your complaint text.',
          );
        }
        normalized = await buildLocalFullPipelineFromText(fallbackText);
        normalized.transcript = fallbackText;
      }
    } else {
      if (!fallbackText) {
        throw new ApiError(
          503,
          'Voice intake needs either the Python ML service or a browser transcript. Please allow the visible transcript to populate, or type your complaint text.',
        );
      }
      normalized = await buildLocalFullPipelineFromText(fallbackText);
      normalized.transcript = fallbackText;
    }
  } else if (fallbackText) {
    const t = fallbackText;
    if (env.mlServiceUrl) {
      try {
        normalized = await remotePipelineText(t, langIso);
      } catch {
        normalized = await buildLocalFullPipelineFromText(t);
      }
    } else {
      normalized = await buildLocalFullPipelineFromText(t);
    }
  } else {
    throw new ApiError(400, 'Provide complaint text or a voice recording.');
  }

  const rawText = (normalized.rawComplaintText || normalized.transcript || '').trim();
  if (!rawText) {
    throw new ApiError(422, 'The ML service returned empty complaint text. Try again or type your statement.');
  }

  let voiceRecordingId: string | undefined;

  if (input.audio?.buffer && input.audio.buffer.length > 0) {
    const uploadRoot = path.join(process.cwd(), 'uploads', 'voice');
    await fs.mkdir(uploadRoot, { recursive: true });
    const fileId = randomUUID();
    const ext = pickExtension(input.audio.mimeType);
    const rel = path.join('uploads', 'voice', `${userId}-${fileId}.${ext}`).split(path.sep).join('/');
    const abs = path.join(process.cwd(), rel);
    await fs.writeFile(abs, input.audio.buffer);

    const vr = await prisma.voiceRecording.create({
      data: {
        userId,
        language: victimLanguageFromCode(langIso),
        fileUrl: rel,
        transcript: (normalized.transcript || rawText).trim(),
        durationSecs: input.durationSecs ?? null,
      },
    });
    voiceRecordingId = vr.id;
  }

  const statement = await prisma.victimStatement.create({
    data: {
      userId,
      rawText,
      translatedText: null,
      language: victimLanguageFromCode(langIso),
      incidentDate: input.incidentDate ? new Date(input.incidentDate) : null,
      incidentTime: input.incidentTime?.trim() || null,
      incidentLocation: input.incidentLocation?.trim() || null,
      witnessDetails: input.witnessDetails?.trim() || null,
      voiceRecordingId,
    },
  });

  const payload = fullPipelineToClassificationPayload(normalized);
  await persistVictimClassification(statement.id, payload);

  const classification = await prisma.crimeClassification.findUnique({
    where: { victimStatementId: statement.id },
    include: { bnsSection: true },
  });

  const resolution = await getVictimResolution(statement.id, userId);
  const rights = await getVictimRights(userId, statement.id);

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
