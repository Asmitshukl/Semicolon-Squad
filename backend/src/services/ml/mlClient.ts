import { env } from '../../config/env';
import type { MlClassificationPayload, NormalizedFullPipeline } from '../../types/ml.types';
import { normalizeClassifyOnlyResponse, normalizeFullPipelineResponse } from './normalize';

const joinUrl = (base: string, p: string) => `${base.replace(/\/$/, '')}${p.startsWith('/') ? p : `/${p}`}`;

const readJson = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`ML service returned non-JSON (HTTP ${res.status}): ${text.slice(0, 240)}`);
  }
};

const withTimeout = (ms: number) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, cancel: () => clearTimeout(id) };
};

/** Full stack: Whisper → NER → classifier → rights (Python `/v1/pipeline`). */
export const remotePipelineText = async (
  rawText: string,
  language: string,
): Promise<NormalizedFullPipeline> => {
  const base = env.mlServiceUrl;
  if (!base) {
    throw new Error('ML_SERVICE_URL is not configured.');
  }
  const { signal, cancel } = withTimeout(env.mlServiceTimeoutMs);
  try {
    const res = await fetch(joinUrl(base, '/v1/pipeline/json'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        raw_text: rawText,
        rawComplaintText: rawText,
        language,
      }),
      signal,
    });
    cancel();
    if (!res.ok) {
      throw new Error(`ML pipeline failed (HTTP ${res.status}).`);
    }
    return normalizeFullPipelineResponse(await readJson(res));
  } catch (e) {
    cancel();
    throw e;
  }
};

export const remotePipelineAudio = async (
  buffer: Buffer,
  filename: string,
  mimeType: string,
  fields: Record<string, string>,
): Promise<NormalizedFullPipeline> => {
  const base = env.mlServiceUrl;
  if (!base) {
    throw new Error('ML_SERVICE_URL is not configured.');
  }
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v != null) form.set(k, v);
  }
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType || 'application/octet-stream' });
  form.set('audio', blob, filename || 'recording.webm');

  const { signal, cancel } = withTimeout(env.mlServiceTimeoutMs);
  try {
    const res = await fetch(joinUrl(base, '/v1/pipeline'), {
      method: 'POST',
      body: form,
      signal,
    });
    cancel();
    if (!res.ok) {
      throw new Error(`ML pipeline (audio) failed (HTTP ${res.status}).`);
    }
    return normalizeFullPipelineResponse(await readJson(res));
  } catch (e) {
    cancel();
    throw e;
  }
};

/** Classify text only (Python `/v1/classify`) — used after a text statement is saved. */
export const remoteClassifyText = async (
  rawText: string,
  language: string,
): Promise<MlClassificationPayload | null> => {
  const base = env.mlServiceUrl;
  if (!base) {
    return null;
  }
  const { signal, cancel } = withTimeout(env.mlServiceTimeoutMs);
  try {
    const res = await fetch(joinUrl(base, '/v1/classify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ raw_text: rawText, rawComplaintText: rawText, language }),
      signal,
    });
    cancel();
    if (!res.ok) {
      return null;
    }
    return normalizeClassifyOnlyResponse(await readJson(res));
  } catch {
    cancel();
    return null;
  }
};
