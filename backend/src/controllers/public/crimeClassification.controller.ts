import type { IncomingMessage, ServerResponse } from 'node:http';
import { CrimeClassificationService } from '../../services/ml/crimeClassification.service';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { sendJson } from '../../server.shared';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../generated/prisma/enums';

export class CrimeClassificationController {
  /**
   * Classify a victim statement using ML model
   */
  static async classifyStatement(req: IncomingMessage, res: ServerResponse, body: any) {
    const { statementId } = body;

    if (!statementId) {
      throw new ApiError(400, 'Statement ID is required');
    }

    const classification = await CrimeClassificationService.classifyFromStatement(statementId);

    sendJson(res, 200, {
      success: true,
      data: {
        classificationId: classification.id,
        bnsSectionNumber: classification.bnsSection.sectionNumber,
        bnsSectionTitle: classification.bnsSection.sectionTitle,
        confidenceScore: classification.confidenceScore,
        alternativeSections: classification.alternativeSections,
        urgencyLevel: classification.urgencyLevel,
        urgencyReason: classification.urgencyReason,
        severityScore: classification.severityScore,
      },
      message: 'Crime classified successfully',
    });
  }

  /**
   * Get classification for a statement
   */
  static async getClassification(req: IncomingMessage, res: ServerResponse, body: any) {
    const { statementId } = body;

    if (!statementId) {
      throw new ApiError(400, 'Statement ID is required');
    }

    const classification = await CrimeClassificationService.getClassificationByStatement(statementId);

    if (!classification) {
      throw new ApiError(404, 'No classification found for this statement');
    }

    sendJson(res, 200, {
      success: true,
      data: {
        classificationId: classification.id,
        bnsSectionNumber: classification.bnsSection.sectionNumber,
        bnsSectionTitle: classification.bnsSection.sectionTitle,
        description: classification.bnsSection.description,
        confidenceScore: classification.confidenceScore,
        alternativeSections: classification.alternativeSections,
        urgencyLevel: classification.urgencyLevel,
        severityScore: classification.severityScore,
      },
    });
  }

  /**
   * Update classification score (officer override)
   */
  static async updateScore(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req, [Role.OFFICER]);
    const { classificationId, confidenceScore, urgencyLevel } = body;

    if (!classificationId || confidenceScore === undefined) {
      throw new ApiError(400, 'Classification ID and confidence score are required');
    }

    const updated = await CrimeClassificationService.updateClassificationScore(
      classificationId,
      confidenceScore,
      urgencyLevel,
    );

    sendJson(res, 200, {
      success: true,
      data: updated,
      message: 'Classification updated successfully',
    });
  }
}
