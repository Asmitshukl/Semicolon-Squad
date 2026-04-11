import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { sendJson } from '../../server.shared';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../generated/prisma/enums';
import { OfficerVerificationService } from '../../services/admin/officerVerification.service';

export class AdminOfficerVerificationController {
  /**
   * Register a new officer (admin initiates registration)
   */
  static async registerOfficer(req: IncomingMessage, res: ServerResponse, body: any) {
    const admin = await getAuthenticatedUser(req, [Role.ADMIN]);

    const officer = await OfficerVerificationService.registerOfficer({
      userId: body.userId,
      badgeNumber: body.badgeNumber,
      rank: body.rank,
      department: body.department,
      stationId: body.stationId,
    });

    sendJson(res, 201, {
      success: true,
      data: officer,
      message: 'Officer registered successfully. Awaiting verification.',
    });
  }

  /**
   * Send OTP to police station for officer verification
   */
  static async sendOTPToStation(req: IncomingMessage, res: ServerResponse, body: any) {
    const admin = await getAuthenticatedUser(req, [Role.ADMIN]);
    const { officerId } = body;

    if (!officerId) {
      throw new ApiError(400, 'Officer ID is required');
    }

    const result = await OfficerVerificationService.sendOTPToStation(officerId);

    sendJson(res, 200, {
      success: true,
      data: result,
      message: 'OTP sent to registered station phone number',
    });
  }

  /**
   * Verify officer with OTP
   */
  static async verifyOfficerWithOTP(req: IncomingMessage, res: ServerResponse, body: any) {
    const admin = await getAuthenticatedUser(req, [Role.ADMIN]);
    const { officerId, otp } = body;

    if (!officerId || !otp) {
      throw new ApiError(400, 'Officer ID and OTP are required');
    }

    const officer = await OfficerVerificationService.verifyOfficerOTP(officerId, otp, admin.id);

    sendJson(res, 200, {
      success: true,
      data: officer,
      message: 'Officer verified successfully',
    });
  }

  /**
   * Verify officer by badge number + station code
   */
  static async verifyByBadgeAndStation(req: IncomingMessage, res: ServerResponse, body: any) {
    const admin = await getAuthenticatedUser(req, [Role.ADMIN]);
    const { badgeNumber, stationCode } = body;

    if (!badgeNumber || !stationCode) {
      throw new ApiError(400, 'Badge number and station code are required');
    }

    const officer = await OfficerVerificationService.verifyByBadgeAndStation(badgeNumber, stationCode, admin.id);

    sendJson(res, 200, {
      success: true,
      data: officer,
      message: 'Officer verified successfully',
    });
  }

  /**
   * Verify with CCTNS ID
   */
  static async verifyWithCCTNS(req: IncomingMessage, res: ServerResponse, body: any) {
    const admin = await getAuthenticatedUser(req, [Role.ADMIN]);
    const { officerId, cctnsId } = body;

    if (!officerId || !cctnsId) {
      throw new ApiError(400, 'Officer ID and CCTNS ID are required');
    }

    const officer = await OfficerVerificationService.verifyByCCTNS(officerId, cctnsId, admin.id);

    sendJson(res, 200, {
      success: true,
      data: officer,
      message: 'Officer verified via CCTNS',
    });
  }

  /**
   * Reject officer verification
   */
  static async rejectOfficer(req: IncomingMessage, res: ServerResponse, body: any) {
    const admin = await getAuthenticatedUser(req, [Role.ADMIN]);
    const { officerId } = body;

    if (!officerId) {
      throw new ApiError(400, 'Officer ID is required');
    }

    const officer = await OfficerVerificationService.rejectOfficer(officerId, admin.id);

    sendJson(res, 200, {
      success: true,
      data: officer,
      message: 'Officer registration rejected',
    });
  }

  /**
   * Get pending verifications
   */
  static async getPendingVerifications(req: IncomingMessage, res: ServerResponse, body: any) {
    const admin = await getAuthenticatedUser(req, [Role.ADMIN]);

    const pending = await OfficerVerificationService.getPendingVerifications();

    sendJson(res, 200, {
      success: true,
      data: pending,
      count: pending.length,
    });
  }

  /**
   * Get officer details
   */
  static async getOfficerDetails(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req, [Role.ADMIN, Role.OFFICER]);
    const { officerId } = body;

    if (!officerId) {
      throw new ApiError(400, 'Officer ID is required');
    }

    const officer = await OfficerVerificationService.getOfficerDetails(officerId);

    if (!officer) {
      throw new ApiError(404, 'Officer not found');
    }

    sendJson(res, 200, {
      success: true,
      data: officer,
    });
  }

  /**
   * Get officers by station
   */
  static async getOfficersByStation(req: IncomingMessage, res: ServerResponse, body: any) {
    const admin = await getAuthenticatedUser(req, [Role.ADMIN]);
    const { stationId, verificationStatus } = body;

    if (!stationId) {
      throw new ApiError(400, 'Station ID is required');
    }

    const officers = await OfficerVerificationService.getOfficersByStation(stationId, verificationStatus);

    sendJson(res, 200, {
      success: true,
      data: officers,
      count: officers.length,
    });
  }
}
