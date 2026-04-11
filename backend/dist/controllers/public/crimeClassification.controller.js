"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrimeClassificationController = void 0;
const crimeClassification_service_1 = require("../../services/ml/crimeClassification.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const server_shared_1 = require("../../server.shared");
const ApiError_1 = require("../../utils/ApiError");
const enums_1 = require("../../generated/prisma/enums");
class CrimeClassificationController {
    /**
     * Classify a victim statement using ML model
     */
    static async classifyStatement(req, res, body) {
        const { statementId } = body;
        if (!statementId) {
            throw new ApiError_1.ApiError(400, 'Statement ID is required');
        }
        const classification = await crimeClassification_service_1.CrimeClassificationService.classifyFromStatement(statementId);
        (0, server_shared_1.sendJson)(res, 200, {
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
    static async getClassification(req, res, body) {
        const { statementId } = body;
        if (!statementId) {
            throw new ApiError_1.ApiError(400, 'Statement ID is required');
        }
        const classification = await crimeClassification_service_1.CrimeClassificationService.getClassificationByStatement(statementId);
        if (!classification) {
            throw new ApiError_1.ApiError(404, 'No classification found for this statement');
        }
        (0, server_shared_1.sendJson)(res, 200, {
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
    static async updateScore(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER]);
        const { classificationId, confidenceScore, urgencyLevel } = body;
        if (!classificationId || confidenceScore === undefined) {
            throw new ApiError_1.ApiError(400, 'Classification ID and confidence score are required');
        }
        const updated = await crimeClassification_service_1.CrimeClassificationService.updateClassificationScore(classificationId, confidenceScore, urgencyLevel);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: updated,
            message: 'Classification updated successfully',
        });
    }
}
exports.CrimeClassificationController = CrimeClassificationController;
