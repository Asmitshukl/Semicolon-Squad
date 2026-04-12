import { UrgencyLevel } from '../../generated/prisma/enums';
import type { MlClassificationPayload, NormalizedFullPipeline } from '../../types/ml.types';

const asRecord = (v: unknown): Record<string, unknown> =>
  v != null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const asString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

const asNumber = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

const parseUrgency = (v: unknown): UrgencyLevel => {
  const s = String(v ?? '')
    .trim()
    .toUpperCase();
  if (s === 'CRITICAL') return UrgencyLevel.CRITICAL;
  if (s === 'HIGH') return UrgencyLevel.HIGH;
  if (s === 'LOW') return UrgencyLevel.LOW;
  return UrgencyLevel.MEDIUM;
};

const parseClassifications = (raw: unknown): Array<{ sectionNumber: string; confidence: number; title?: string }> => {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ sectionNumber: string; confidence: number; title?: string }> = [];
  for (const item of raw) {
    const o = asRecord(item);
    const sectionNumber =
      asString(o.section_number) ??
      asString(o.sectionNumber) ??
      asString(o.bns_section) ??
      asString(o.code);
    if (!sectionNumber) continue;
    const confidence =
      asNumber(o.confidence) ??
      asNumber(o.confidence_score) ??
      asNumber(o.score) ??
      0.5;
    const title = asString(o.title) ?? asString(o.section_title);
    out.push({ sectionNumber: String(sectionNumber).replace(/^§\s*/, '').trim(), confidence, title });
  }
  return out;
};

/** Maps a Python `/v1/pipeline` JSON body (snake_case or camelCase) to our internal shape. */
export const normalizeFullPipelineResponse = (json: unknown): NormalizedFullPipeline => {
  const o = asRecord(json);
  const transcript =
    asString(o.transcript) ?? asString(o.whisper_text) ?? asString(o.asr_text) ?? '';
  const rawComplaintText =
    asString(o.raw_complaint_text) ??
    asString(o.rawComplaintText) ??
    asString(o.complaint_text) ??
    transcript;
  const entitiesRaw = o.entities ?? o.ner_entities ?? o.ner;
  const entities = asRecord(entitiesRaw);
  let classifications = parseClassifications(o.classifications ?? o.bns_sections ?? o.labels);
  const primaryFromField =
    asString(o.primary_section_number) ??
    asString(o.primarySectionNumber) ??
    classifications[0]?.sectionNumber;
  const primarySection = primaryFromField ? String(primaryFromField).replace(/^§\s*/, '').trim() : '';
  if (primarySection && classifications.length === 0) {
    classifications = [
      {
        sectionNumber: primarySection,
        confidence:
          asNumber(o.primary_confidence) ?? asNumber(o.primaryConfidence) ?? asNumber(o.confidence) ?? 0.72,
      },
    ];
  }
  if (!primarySection || classifications.length === 0) {
    // Graceful fallback — don't throw, return an empty-but-valid payload
    return {
      transcript,
      rawComplaintText: rawComplaintText.trim() || transcript,
      entities,
      classifications: [],
      urgencyLevel: parseUrgency(undefined),
      urgencyReason: 'Could not determine BNS section from audio.',
      severityScore: 0,
      victimRightsSummary: undefined,
      victimRightsBullets: undefined,
      modelVersion: asString(o.model_version) ?? 'ml-unknown',
    };
  }
  const victimRights = asRecord(o.victim_rights ?? o.victimRights);
  const bulletsRaw = victimRights.bullets ?? victimRights.items;
  const victimRightsBullets = Array.isArray(bulletsRaw)
    ? bulletsRaw.filter((x): x is string => typeof x === 'string')
    : undefined;

  return {
    transcript,
    rawComplaintText: rawComplaintText.trim() || transcript,
    entities,
    classifications: classifications.length
      ? classifications
      : [{ sectionNumber: primarySection, confidence: 0.5 }],
    urgencyLevel: parseUrgency(o.urgency_level ?? o.urgencyLevel),
    urgencyReason:
      asString(o.urgency_reason) ??
      asString(o.urgencyReason) ??
      'Review suggested based on automated analysis.',
    severityScore:
      asNumber(o.severity_score) ??
      asNumber(o.severityScore) ??
      classifications[0]?.confidence ??
      0.5,
    victimRightsSummary:
      asString(victimRights.summary) ?? asString(victimRights.text) ?? asString(o.rights_summary),
    victimRightsBullets,
    modelVersion: asString(o.model_version) ?? asString(o.modelVersion) ?? 'ml-unknown',
  };
};

export const fullPipelineToClassificationPayload = (
  p: NormalizedFullPipeline,
): MlClassificationPayload => {
  const sorted = [...p.classifications].sort((a, b) => b.confidence - a.confidence);
  const primary = sorted[0]!;
  const alternatives = sorted.slice(1).map((c) => ({
    sectionNumber: c.sectionNumber,
    confidence: c.confidence,
    title: c.title,
  }));
  return {
    primarySectionNumber: primary.sectionNumber,
    primaryConfidence: primary.confidence,
    alternatives,
    urgencyLevel: p.urgencyLevel,
    urgencyReason: p.urgencyReason,
    severityScore: p.severityScore,
    modelVersion: p.modelVersion,
  };
};

/** Classifier-only JSON (e.g. `/v1/classify` — IndicBERT multi-label without ASR). */
export const normalizeClassifyOnlyResponse = (json: unknown): MlClassificationPayload => {
  const o = asRecord(json);
  let classifications = parseClassifications(o.classifications ?? o.bns_sections ?? o.labels);
  const primaryFromField =
    asString(o.primary_section_number) ??
    asString(o.primarySectionNumber) ??
    classifications[0]?.sectionNumber;
  const primarySection = primaryFromField ? String(primaryFromField).replace(/^§\s*/, '').trim() : '';
  if (primarySection && classifications.length === 0) {
    classifications = [
      {
        sectionNumber: primarySection,
        confidence:
          asNumber(o.primary_confidence) ?? asNumber(o.primaryConfidence) ?? asNumber(o.confidence) ?? 0.72,
      },
    ];
  }
  if (!primarySection || classifications.length === 0) {
    throw new Error('ML classify response missing BNS sections.');
  }
  const sorted = [...classifications].sort((a, b) => b.confidence - a.confidence);
  const primary = sorted[0]!;
  const alternatives = sorted.slice(1).map((c) => ({
    sectionNumber: c.sectionNumber,
    confidence: c.confidence,
    title: c.title,
  }));
  return {
    primarySectionNumber: primary.sectionNumber,
    primaryConfidence: primary.confidence,
    alternatives,
    urgencyLevel: parseUrgency(o.urgency_level ?? o.urgencyLevel),
    urgencyReason:
      asString(o.urgency_reason) ??
      asString(o.urgencyReason) ??
      'Review suggested based on automated classification.',
    severityScore:
      asNumber(o.severity_score) ??
      asNumber(o.severityScore) ??
      primary.confidence ??
      0.5,
    modelVersion: asString(o.model_version) ?? asString(o.modelVersion) ?? 'ml-classify',
  };
};
