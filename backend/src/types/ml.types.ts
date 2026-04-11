import type { UrgencyLevel } from '../generated/prisma/enums';

/** Normalized output of the Python ML pipeline (Whisper → NER → IndicBERT → rights). */
export type NormalizedFullPipeline = {
  transcript: string;
  rawComplaintText: string;
  entities: Record<string, unknown>;
  classifications: Array<{ sectionNumber: string; confidence: number; title?: string }>;
  urgencyLevel: UrgencyLevel;
  urgencyReason: string;
  severityScore: number;
  victimRightsSummary?: string;
  victimRightsBullets?: string[];
  modelVersion: string;
};

/** Payload persisted on `CrimeClassification` (primary + alternatives). */
export type MlClassificationPayload = {
  primarySectionNumber: string;
  primaryConfidence: number;
  alternatives: Array<{ sectionNumber: string; confidence: number; title?: string }>;
  urgencyLevel: UrgencyLevel;
  urgencyReason: string;
  severityScore: number;
  modelVersion: string;
};
