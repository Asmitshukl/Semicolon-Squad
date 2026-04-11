"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficerVerificationService = void 0;
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const generateOtp_1 = require("../../utils/generateOtp");
class OfficerVerificationService {
    /**
     * Register a new officer (Admin only in normal flow)
     */
    static async registerOfficer(input) {
        // Check if officer already exists
        const existingOfficer = await database_1.prisma.officer.findFirst({
            where: {
                OR: [{ userId: input.userId }, { badgeNumber: input.badgeNumber }],
            },
        });
        if (existingOfficer) {
            throw new ApiError_1.ApiError(400, 'Officer already registered with this user or badge number');
        }
        // Verify user exists
        const user = await database_1.prisma.user.findUnique({
            where: { id: input.userId },
        });
        if (!user) {
            throw new ApiError_1.ApiError(404, 'User not found');
        }
        // Verify station exists
        const station = await database_1.prisma.policeStation.findUnique({
            where: { id: input.stationId },
        });
        if (!station) {
            throw new ApiError_1.ApiError(404, 'Police station not found');
        }
        // Create officer with PENDING verification status
        const officer = await database_1.prisma.officer.create({
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
    static async sendOTPToStation(officerId) {
        const officer = await database_1.prisma.officer.findUnique({
            where: { id: officerId },
            include: {
                station: true,
                user: true,
            },
        });
        if (!officer) {
            throw new ApiError_1.ApiError(404, 'Officer not found');
        }
        const otp = (0, generateOtp_1.generateOTP)(6);
        const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        // Save OTP secret (in production, use a proper OTP service)
        await database_1.prisma.officer.update({
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
        }
        catch (error) {
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
    static async verifyOfficerOTP(officerId, otp, verifiedByAdminId) {
        const officer = await database_1.prisma.officer.findUnique({
            where: { id: officerId },
        });
        if (!officer) {
            throw new ApiError_1.ApiError(404, 'Officer not found');
        }
        // Check OTP validity
        if (!officer.otpSecret || officer.otpSecret !== otp) {
            throw new ApiError_1.ApiError(400, 'Invalid OTP');
        }
        if (!officer.otpExpiresAt || officer.otpExpiresAt < new Date()) {
            throw new ApiError_1.ApiError(400, 'OTP has expired. Request a new one.');
        }
        // Verify officer
        const verifiedOfficer = await database_1.prisma.officer.update({
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
    static async verifyByBadgeAndStation(badgeNumber, stationCode, verifiedByAdminId) {
        const officer = await database_1.prisma.officer.findUnique({
            where: { badgeNumber },
            include: {
                station: true,
            },
        });
        if (!officer) {
            throw new ApiError_1.ApiError(404, 'Officer not found with this badge number');
        }
        if (officer.station.stationCode !== stationCode) {
            throw new ApiError_1.ApiError(400, 'Invalid station code for this officer');
        }
        return database_1.prisma.officer.update({
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
    static async verifyByCCTNS(officerId, cctnsId, verifiedByAdminId) {
        // TODO: In production, call actual CCTNS API to verify
        const officer = await database_1.prisma.officer.findUnique({
            where: { id: officerId },
        });
        if (!officer) {
            throw new ApiError_1.ApiError(404, 'Officer not found');
        }
        // Placeholder validation
        if (!cctnsId.match(/^CCTNS-[A-Z]{2}-\d+/)) {
            throw new ApiError_1.ApiError(400, 'Invalid CCTNS format');
        }
        return database_1.prisma.officer.update({
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
    static async rejectOfficer(officerId, rejectedByAdminId) {
        const officer = await database_1.prisma.officer.findUnique({
            where: { id: officerId },
        });
        if (!officer) {
            throw new ApiError_1.ApiError(404, 'Officer not found');
        }
        return database_1.prisma.officer.update({
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
    static async getOfficerDetails(officerId) {
        return database_1.prisma.officer.findUnique({
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
    static async getOfficersByStation(stationId, verificationStatus) {
        const where = { stationId };
        if (verificationStatus) {
            where.verificationStatus = verificationStatus;
        }
        return database_1.prisma.officer.findMany({
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
        return database_1.prisma.officer.findMany({
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
    static async sendSMS(phone, message) {
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
        }
        catch (error) {
            console.error('SMS sending failed:', error);
            // Don't throw - allow graceful degradation
        }
    }
}
exports.OfficerVerificationService = OfficerVerificationService;
