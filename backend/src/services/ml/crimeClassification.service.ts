import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import type { CrimeClassification } from '../../generated/prisma/client';
import type { UrgencyLevel } from '../../generated/prisma/enums';

export interface MLPredictionInput {
  statement: string;
  language: string;
  incidentDate?: Date;
  incidentLocation?: string;
}

export interface MLPredictionOutput {
  bnsSectionId: string;
  confidenceScore: number;
  alternativeSections: { id: string; score: number; sectionNumber: string }[];
  urgencyLevel: UrgencyLevel;
  urgencyReason?: string;
  severityScore?: number;
}

export class CrimeClassificationService {
  /**
   * Call Python ML model to classify crime
   * This integrates with the external ML service
   */
  static async classifyFromStatement(victimStatementId: string) {
    const statement = await prisma.victimStatement.findUnique({
      where: { id: victimStatementId },
      include: { classification: true },
    });

    if (!statement) {
      throw new ApiError(404, 'Victim statement not found');
    }

    if (statement.classification) {
      throw new ApiError(400, 'Classification already exists for this statement');
    }

    // Call ML service to get prediction
    // This is a placeholder - actual implementation integrates with Python service
    const mlPrediction = await this.callMLService({
      statement: statement.translatedText || statement.rawText || '',
      language: statement.language,
      incidentDate: statement.incidentDate || undefined,
      incidentLocation: statement.incidentLocation || undefined,
    });

    // Create classification record
    const classification = await prisma.crimeClassification.create({
      data: {
        victimStatementId,
        bnsSectionId: mlPrediction.bnsSectionId,
        confidenceScore: mlPrediction.confidenceScore,
        alternativeSections: mlPrediction.alternativeSections,
        urgencyLevel: mlPrediction.urgencyLevel,
        urgencyReason: mlPrediction.urgencyReason,
        severityScore: mlPrediction.severityScore,
      },
      include: {
        bnsSection: true,
        victimStatement: true,
      },
    });

    return classification;
  }

  /**
   * Call external ML service - replace with actual API call
   */
  private static async callMLService(input: MLPredictionInput): Promise<MLPredictionOutput> {
    try {
      // TODO: Replace with actual Python ML service endpoint
      const response = await fetch(process.env.ML_SERVICE_URL || 'http://localhost:5000/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ML_SERVICE_KEY}`,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`ML Service error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('ML Classification failed:', error);
      // Return default classification for demo
      const defaultSection = await prisma.bNSSection.findFirst();
      if (!defaultSection) {
        throw new ApiError(500, 'ML service unavailable and no default classification available');
      }

      return {
        bnsSectionId: defaultSection.id,
        confidenceScore: 0.5,
        alternativeSections: [],
        urgencyLevel: 'MEDIUM' as any,
      };
    }
  }

  /**
   * Get classification for a statement
   */
  static async getClassification(classificationId: string): Promise<CrimeClassification | null> {
    return prisma.crimeClassification.findUnique({
      where: { id: classificationId },
      include: {
        bnsSection: true,
        victimStatement: true,
      },
    });
  }

  /**
   * Get classification by victim statement
   */
  static async getClassificationByStatement(victimStatementId: string) {
    return prisma.crimeClassification.findUnique({
      where: { victimStatementId },
      include: {
        bnsSection: true,
        victimStatement: true,
      },
    });
  }

  /**
   * Update classification with officers notes/updates
   */
  static async updateClassificationScore(
    classificationId: string,
    confidenceScore: number,
    urgencyLevel?: string,
  ): Promise<CrimeClassification> {
    const classification = await prisma.crimeClassification.findUnique({
      where: { id: classificationId },
    });

    if (!classification) {
      throw new ApiError(404, 'Classification not found');
    }

    return prisma.crimeClassification.update({
      where: { id: classificationId },
      data: {
        confidenceScore,
        urgencyLevel: urgencyLevel as any,
      },
      include: {
        bnsSection: true,
        victimStatement: true,
      },
    });
  }
}
