import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import type { SMSNotification } from '../../generated/prisma/client';

export interface SendNotificationInput {
  userId: string;
  phone: string;
  message: string;
  firId?: string;
}

export class NotificationService {
  /**
   * Send SMS notification to victim with FIR details
   */
  static async sendFIRNotification(firId: string): Promise<SMSNotification> {
    const fir = await prisma.fIR.findUnique({
      where: { id: firId },
      include: {
        victim: true,
        station: true,
        bnsSections: true,
      },
    });

    if (!fir) {
      throw new ApiError(404, 'FIR not found');
    }

    const message = this.formatFIRMessage(fir);

    return this.sendSMS({
      userId: fir.victimId,
      phone: fir.victim.phone,
      message,
      firId,
    });
  }

  /**
   * Send generic SMS notification
   */
  static async sendSMS(input: SendNotificationInput): Promise<SMSNotification> {
    // Create notification record
    const notification = await prisma.sMSNotification.create({
      data: {
        userId: input.userId,
        phone: input.phone,
        message: input.message,
        firId: input.firId,
        status: 'PENDING',
      },
    });

    // Send SMS via provider
    try {
      await this.sendViaSMSProvider(input.phone, input.message);

      return prisma.sMSNotification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);

      await prisma.sMSNotification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          failReason: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Send case update notification
   */
  static async sendCaseUpdateNotification(firId: string, updateNote: string): Promise<SMSNotification> {
    const fir = await prisma.fIR.findUnique({
      where: { id: firId },
      include: {
        victim: true,
        station: true,
      },
    });

    if (!fir) {
      throw new ApiError(404, 'FIR not found');
    }

    const message = `Case update for FIR ${fir.firNumber}: ${updateNote}. Track your case: ${fir.acknowledgmentNo}`;

    return this.sendSMS({
      userId: fir.victimId,
      phone: fir.victim.phone,
      message,
      firId,
    });
  }

  /**
   * Send victim rights notification
   */
  static async sendVictimRightsNotification(userId: string, phone: string): Promise<SMSNotification> {
    const message = `You have legal rights! (1) Get FIR copy within 24 hours (2) Track case status anytime (3) Claim compensation if victim (4) File Zero FIR at any station. Call ${process.env.VICTIM_HELPLINE || '+91-1234567890'} for help.`;

    return this.sendSMS({
      userId,
      phone,
      message,
    });
  }

  /**
   * Send officer assignment notification
   */
  static async sendOfficerAssignmentNotification(firId: string): Promise<SMSNotification> {
    const fir = await prisma.fIR.findUnique({
      where: { id: firId },
      include: {
        victim: true,
        officer: {
          include: {
            user: true,
          },
        },
        station: true,
      },
    });

    if (!fir || !fir.officer) {
      throw new ApiError(404, 'FIR or assigned officer not found');
    }

    const message = `Your FIR ${fir.firNumber} has been assigned to ${fir.officer.user.name} (Badge: ${fir.officer.badgeNumber}) at ${fir.station.name}. Contact: ${fir.station.phone}`;

    return this.sendSMS({
      userId: fir.victimId,
      phone: fir.victim.phone,
      message,
      firId,
    });
  }

  /**
   * Batch send notifications
   */
  static async sendBatchNotifications(notifications: SendNotificationInput[]): Promise<SMSNotification[]> {
    const results: SMSNotification[] = [];

    for (const notif of notifications) {
      try {
        const result = await this.sendSMS(notif);
        results.push(result);
      } catch (error) {
        console.error(`Failed to send notification to ${notif.phone}:`, error);
      }
    }

    return results;
  }

  /**
   * Get notification history
   */
  static async getNotificationHistory(userId: string): Promise<SMSNotification[]> {
    return prisma.sMSNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Get failed notifications for retry
   */
  static async getFailedNotifications(): Promise<SMSNotification[]> {
    return prisma.sMSNotification.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  /**
   * Retry failed notifications
   */
  static async retryFailedNotifications(): Promise<SMSNotification[]> {
    const failed = await this.getFailedNotifications();
    const retried: SMSNotification[] = [];

    for (const notif of failed) {
      try {
        await this.sendViaSMSProvider(notif.phone, notif.message);

        const updated = await prisma.sMSNotification.update({
          where: { id: notif.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            failReason: null,
          },
        });

        retried.push(updated);
      } catch (error) {
        console.error(`Retry failed for ${notif.phone}:`, error);
      }
    }

    return retried;
  }

  /**
   * Format FIR message
   */
  private static formatFIRMessage(fir: any): string {
    const message = `Your FIR has been registered. 
FIR Number: ${fir.firNumber}
Acknowledgment: ${fir.acknowledgmentNo}
Station: ${fir.station.name}
Status: ${fir.status}

Your rights:
- Get free copy within 24 hours
- Track status anytime using acknowledgment number
- Right to victim support

Need help? Call: ${fir.station.phone}`;

    return message;
  }

  /**
   * Send via SMS provider (placeholder - replace with actual SMS service)
   */
  private static async sendViaSMSProvider(phone: string, message: string): Promise<void> {
    try {
      const smsUrl = process.env.SMS_PROVIDER_URL || 'http://localhost:5000/send-sms';

      const response = await fetch(smsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SMS_API_KEY}`,
        },
        body: JSON.stringify({
          to: phone,
          text: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`SMS Provider error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('SMS send failed:', error);
      throw error;
    }
  }
}
