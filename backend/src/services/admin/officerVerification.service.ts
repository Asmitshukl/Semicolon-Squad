import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { generateOTP } from '../../utils/generateOtp';
import type { Officer } from '../../generated/prisma/client';
import type { OfficerVerificationStatus } from '../../generated/prisma/enums';

export class OfficerVerificationService {
  /**
   * Register a new officer (Admin only in normal flow)
   */
  static async registerOfficer(input: {
    userId: string;
    badgeNumber: string;
    rank: string;
    department: string;
    stationId: string;
  }): Promise<Officer> {
    // Check if officer already exists
    const existingOfficer = await prisma.officer.findFirst({
      where: {
        OR: [{ userId: input.userId }, { badgeNumber: input.badgeNumber }],
      },
    });

    if (existingOfficer) {
      throw new ApiError(400, 'Officer already registered with this user or badge number');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify station exists
    const station = await prisma.policeStation.findUnique({
      where: { id: input.stationId },
    });

    if (!station) {
      throw new ApiError(404, 'Police station not found');
    }

    // Create officer with PENDING verification status
    const officer = await prisma.officer.create({
      data: {
        userId: input.userId,
        badgeNumber: input.badgeNumber,
        rank: input.rank,
        department: input.department,
        stationId: input.stationId,
        verificationStatus: 'PENDING',
        joinedAt: new Date(),
      },
      include: {
        user: true,
        station: true,
      },
    });

    return officer;
  }

  /**
   * Send OTP to police department phone number for verification
   */
  static async sendOTPToStation(officerId: string): Promise<{ message: string; expiresIn: string }> {
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      include: {
        station: true,
        user: true,
      },
    });

    if (!officer) {
      throw new ApiError(404, 'Officer not found');
    }

    const otp = generateOTP(6);
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save OTP secret (in production, use a proper OTP service)
    await prisma.officer.update({
      where: { id: officerId },
      data: {
        otpSecret: otp,
        otpExpiresAt: expiryTime,
      },
    });

    // TODO: Send OTP via SMS to station phone number
    // In production: use AWS SNS, Twilio, or similar service
    try {
      await this.sendSMS(officer.station.phone, `Your officer verification OTP is: ${otp}. This is valid for 15 minutes.`);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      // In test environment, we allow proceeding without SMS
    }

    return {
      message: `OTP sent to ${officer.station.phone}`,
      expiresIn: '15 minutes',
    };
  }

  /**
   * Verify officer using OTP
   */
  static async verifyOfficerOTP(officerId: string, otp: string, verifiedByAdminId: string): Promise<Officer> {
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
    });

    if (!officer) {
      throw new ApiError(404, 'Officer not found');
    }

    // Check OTP validity
    if (!officer.otpSecret || officer.otpSecret !== otp) {
      throw new ApiError(400, 'Invalid OTP');
    }

    if (!officer.otpExpiresAt || officer.otpExpiresAt < new Date()) {
      throw new ApiError(400, 'OTP has expired. Request a new one.');
    }

    // Verify officer
    const verifiedOfficer = await prisma.officer.update({
      where: { id: officerId },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedByAdminId,
        otpSecret: null,
        otpExpiresAt: null,
      },
      include: {
        user: true,
        station: true,
      },
    });

    return verifiedOfficer;
  }

  /**
   * Verify officer with badge number + station code
   */
  static async verifyByBadgeAndStation(
    badgeNumber: string,
    stationCode: string,
    verifiedByAdminId: string,
  ): Promise<Officer> {
    const officer = await prisma.officer.findUnique({
      where: { badgeNumber },
      include: {
        station: true,
      },
    });

    if (!officer) {
      throw new ApiError(404, 'Officer not found with this badge number');
    }

    if (officer.station.stationCode !== stationCode) {
      throw new ApiError(400, 'Invalid station code for this officer');
    }

    return prisma.officer.update({
      where: { id: officer.id },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedByAdminId,
      },
      include: {
        user: true,
        station: true,
      },
    });
  }

  /**
   * Verify using CCTNS ID (National Police Database)
   */
  static async verifyByCCTNS(officerId: string, cctnsId: string, verifiedByAdminId: string): Promise<Officer> {
    // TODO: In production, call actual CCTNS API to verify
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
    });

    if (!officer) {
      throw new ApiError(404, 'Officer not found');
    }

    // Placeholder validation
    if (!cctnsId.match(/^CCTNS-[A-Z]{2}-\d+/)) {
      throw new ApiError(400, 'Invalid CCTNS format');
    }

    return prisma.officer.update({
      where: { id: officerId },
      data: {
        cctnsId,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedByAdminId,
      },
      include: {
        user: true,
        station: true,
      },
    });
  }

  /**
   * Reject officer verification
   */
  static async rejectOfficer(officerId: string, rejectedByAdminId: string): Promise<Officer> {
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
    });

    if (!officer) {
      throw new ApiError(404, 'Officer not found');
    }

    return prisma.officer.update({
      where: { id: officerId },
      data: {
        verificationStatus: 'REJECTED',
        verifiedByAdminId: rejectedByAdminId,
      },
      include: {
        user: true,
        station: true,
      },
    });
  }

  /**
   * Get officer details
   */
  static async getOfficerDetails(officerId: string): Promise<Officer | null> {
    return prisma.officer.findUnique({
      where: { id: officerId },
      include: {
        user: true,
        station: true,
        firs: {
          select: {
            id: true,
            firNumber: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  /**
   * Get officers by station
   */
  static async getOfficersByStation(stationId: string, verificationStatus?: OfficerVerificationStatus) {
    const where: any = { stationId };
    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    }

    return prisma.officer.findMany({
      where,
      include: {
        user: true,
        station: true,
        firs: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get pending officer verifications
   */
  static async getPendingVerifications() {
    return prisma.officer.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        user: true,
        station: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Placeholder SMS sending (replace with actual service)
   */
  private static async sendSMS(phone: string, message: string): Promise<void> {
    try {
      // TODO: Replace with actual SMS service
      // Examples: AWS SNS, Twilio, Exotel
      const smsUrl = process.env.SMS_SERVICE_URL || 'http://localhost:5000/send-sms';

      const response = await fetch(smsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SMS_API_KEY}`,
        },
        body: JSON.stringify({
          phone,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(`SMS service error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      // Don't throw - allow graceful degradation
    }
  }
}
