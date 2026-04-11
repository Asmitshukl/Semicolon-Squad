"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminOfficerVerificationController = void 0;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const server_shared_1 = require("../../server.shared");
const ApiError_1 = require("../../utils/ApiError");
const enums_1 = require("../../generated/prisma/enums");
const officerVerification_service_1 = require("../../services/admin/officerVerification.service");
class AdminOfficerVerificationController {
    /**
     * Register a new officer (admin initiates registration)
     */
    static async registerOfficer(req, res, body) {
        const admin = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
        const officer = await officerVerification_service_1.OfficerVerificationService.registerOfficer({
            userId: body.userId,
            badgeNumber: body.badgeNumber,
            rank: body.rank,
            department: body.department,
            stationId: body.stationId,
        });
        (0, server_shared_1.sendJson)(res, 201, {
            success: true,
            data: officer,
            message: 'Officer registered successfully. Awaiting verification.',
        });
    }
    /**
     * Send OTP to police station for officer verification
     */
    static async sendOTPToStation(req, res, body) {
        const admin = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
        const { officerId } = body;
        if (!officerId) {
            throw new ApiError_1.ApiError(400, 'Officer ID is required');
        }
        const result = await officerVerification_service_1.OfficerVerificationService.sendOTPToStation(officerId);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: result,
            message: 'OTP sent to registered station phone number',
        });
    }
    /**
     * Verify officer with OTP
     */
    static async verifyOfficerWithOTP(req, res, body) {
        const admin = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
        const { officerId, otp } = body;
        if (!officerId || !otp) {
            throw new ApiError_1.ApiError(400, 'Officer ID and OTP are required');
        }
        const officer = await officerVerification_service_1.OfficerVerificationService.verifyOfficerOTP(officerId, otp, admin.id);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: officer,
            message: 'Officer verified successfully',
        });
    }
    /**
     * Verify officer by badge number + station code
     */
    static async verifyByBadgeAndStation(req, res, body) {
        const admin = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
        const { badgeNumber, stationCode } = body;
        if (!badgeNumber || !stationCode) {
            throw new ApiError_1.ApiError(400, 'Badge number and station code are required');
        }
        const officer = await officerVerification_service_1.OfficerVerificationService.verifyByBadgeAndStation(badgeNumber, stationCode, admin.id);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: officer,
            message: 'Officer verified successfully',
        });
    }
    /**
     * Verify with CCTNS ID
     */
    static async verifyWithCCTNS(req, res, body) {
        const admin = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
        const { officerId, cctnsId } = body;
        if (!officerId || !cctnsId) {
            throw new ApiError_1.ApiError(400, 'Officer ID and CCTNS ID are required');
        }
        const officer = await officerVerification_service_1.OfficerVerificationService.verifyByCCTNS(officerId, cctnsId, admin.id);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: officer,
            message: 'Officer verified via CCTNS',
        });
    }
    /**
     * Reject officer verification
     */
    static async rejectOfficer(req, res, body) {
        const admin = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
        const { officerId } = body;
        if (!officerId) {
            throw new ApiError_1.ApiError(400, 'Officer ID is required');
        }
        const officer = await officerVerification_service_1.OfficerVerificationService.rejectOfficer(officerId, admin.id);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: officer,
            message: 'Officer registration rejected',
        });
    }
    /**
     * Get pending verifications
     */
    static async getPendingVerifications(req, res, body) {
        const admin = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
        const pending = await officerVerification_service_1.OfficerVerificationService.getPendingVerifications();
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: pending,
            count: pending.length,
        });
    }
    /**
     * Get officer details
     */
    static async getOfficerDetails(req, res, body) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN, enums_1.Role.OFFICER]);
        const { officerId } = body;
        if (!officerId) {
            throw new ApiError_1.ApiError(400, 'Officer ID is required');
        }
        const officer = await officerVerification_service_1.OfficerVerificationService.getOfficerDetails(officerId);
        if (!officer) {
            throw new ApiError_1.ApiError(404, 'Officer not found');
        }
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: officer,
        });
    }
    /**
     * Get officers by station
     */
    static async getOfficersByStation(req, res, body) {
        const admin = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
        const { stationId, verificationStatus } = body;
        if (!stationId) {
            throw new ApiError_1.ApiError(400, 'Station ID is required');
        }
        const officers = await officerVerification_service_1.OfficerVerificationService.getOfficersByStation(stationId, verificationStatus);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: officers,
            count: officers.length,
        });
    }
}
exports.AdminOfficerVerificationController = AdminOfficerVerificationController;
