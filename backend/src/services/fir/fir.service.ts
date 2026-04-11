import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { FIRStatus, UrgencyLevel, Role } from '../../generated/prisma/enums';
import type { FIR, BNSSection } from '@prisma/client';

export interface CreateFIRInput {
  victimId: string;
  stationId: string;
  incidentDate: Date;
  incidentTime?: string;
  incidentLocation: string;
  incidentDescription: string;
  bnsSectionIds?: string[];
  urgencyLevel?: UrgencyLevel;
}

export interface UpdateFIRInput {
  incidentDate?: Date;
  incidentTime?: string;
  incidentLocation?: string;
  incidentDescription?: string;
  status?: FIRStatus;
  urgencyLevel?: UrgencyLevel;
}

export class FIRService {
  static async createFIR(input: CreateFIRInput): Promise<FIR> {
    // Validate victim exists
    const victim = await prisma.user.findUnique({
      where: { id: input.victimId },
    });

    if (!victim) {
      throw new ApiError(404, 'Victim not found');
    }

    if (victim.role !== Role.VICTIM) {
      throw new ApiError(400, 'User must be a victim to file an FIR');
    }

    // Validate station exists
    const station = await prisma.policeStation.findUnique({
      where: { id: input.stationId },
    });

    if (!station) {
      throw new ApiError(404, 'Police station not found');
    }

    // Create FIR
    const fir = await prisma.fIR.create({
      data: {
        victimId: input.victimId,
        stationId: input.stationId,
        incidentDate: input.incidentDate,
        incidentTime: input.incidentTime,
        incidentLocation: input.incidentLocation,
        incidentDescription: input.incidentDescription,
        urgencyLevel: input.urgencyLevel || UrgencyLevel.MEDIUM,
        status: FIRStatus.DRAFT,
        isOnlineFIR: true,
        bnsSections: input.bnsSectionIds
          ? {
              connect: input.bnsSectionIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        victim: true,
        station: true,
        bnsSections: true,
      },
    });

    return fir;
  }

  static async updateFIR(firId: string, input: UpdateFIRInput): Promise<FIR> {
    const fir = await prisma.fIR.findUnique({ where: { id: firId } });

    if (!fir) {
      throw new ApiError(404, 'FIR not found');
    }

    if (fir.status !== FIRStatus.DRAFT && input.status && input.status !== fir.status) {
      throw new ApiError(400, 'Can only change status from specific states');
    }

    return prisma.fIR.update({
      where: { id: firId },
      data: input,
      include: {
        victim: true,
        officer: true,
        station: true,
        bnsSections: true,
        victimStatements: true,
        voiceRecordings: true,
      },
    });
  }

  static async submitFIR(firId: string, officerId: string): Promise<FIR> {
    const fir = await prisma.fIR.findUnique({ where: { id: firId } });

    if (!fir) {
      throw new ApiError(404, 'FIR not found');
    }

    if (fir.status !== FIRStatus.DRAFT) {
      throw new ApiError(400, 'Only draft FIRs can be submitted');
    }

    const officer = await prisma.officer.findUnique({ where: { id: officerId } });

    if (!officer) {
      throw new ApiError(404, 'Officer not found');
    }

    const acknowledgmentNo = `ACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const firNumber = `FIR-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return prisma.fIR.update({
      where: { id: firId },
      data: {
        status: FIRStatus.ACKNOWLEDGED,
        officerId,
        acknowledgmentNo,
        firNumber,
        officerSignedAt: new Date(),
      },
      include: {
        victim: true,
        officer: true,
        station: true,
        bnsSections: true,
      },
    });
  }

  static async getFIR(firId: string): Promise<FIR | null> {
    return prisma.fIR.findUnique({
      where: { id: firId },
      include: {
        victim: true,
        officer: true,
        station: true,
        bnsSections: true,
        victimStatements: true,
        voiceRecordings: true,
        evidenceItems: true,
        caseUpdates: true,
        smsNotifications: true,
      },
    });
  }

  static async getFIRsByVictim(victimId: string, status?: FIRStatus) {
    const where: any = { victimId };
    if (status) {
      where.status = status;
    }

    return prisma.fIR.findMany({
      where,
      include: {
        officer: true,
        station: true,
        bnsSections: true,
        voiceRecordings: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getFIRsByStation(stationId: string, status?: FIRStatus) {
    const where: any = { stationId };
    if (status) {
      where.status = status;
    }

    return prisma.fIR.findMany({
      where,
      include: {
        victim: true,
        officer: true,
        bnsSections: true,
        voiceRecordings: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getFIRsByOfficer(officerId: string, status?: FIRStatus) {
    const where: any = { officerId };
    if (status) {
      where.status = status;
    }

    return prisma.fIR.findMany({
      where,
      include: {
        victim: true,
        station: true,
        bnsSections: true,
        voiceRecordings: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async trackFIRByAcknowledgment(acknowledgmentNo: string) {
    const fir = await prisma.fIR.findUnique({
      where: { acknowledgmentNo },
      include: {
        victim: true,
        officer: true,
        station: true,
        bnsSections: true,
        caseUpdates: true,
      },
    });

    if (!fir) {
      throw new ApiError(404, 'FIR not found with this acknowledgment number');
    }

    return fir;
  }

  static async addCaseUpdate(firId: string, status: FIRStatus, note?: string, updatedById?: string) {
    const fir = await prisma.fIR.findUnique({ where: { id: firId } });

    if (!fir) {
      throw new ApiError(404, 'FIR not found');
    }

    return prisma.caseUpdate.create({
      data: {
        firId,
        status,
        note,
        updatedById,
      },
    });
  }

  static async generateAIFIRSummary(firId: string, aiGeneratedSummary: string): Promise<FIR> {
    return prisma.fIR.update({
      where: { id: firId },
      data: { aiGeneratedSummary },
      include: {
        victim: true,
        officer: true,
        station: true,
        bnsSections: true,
      },
    });
  }
}
