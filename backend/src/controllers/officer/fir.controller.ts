import type { IncomingMessage, ServerResponse } from 'node:http';
import { FIRService } from '../../services/fir/fir.service';
import { VoiceRecordingService } from '../../services/fir/voiceRecording.service';
import { EvidenceChecklistService } from '../../services/fir/evidenceChecklist.service';
import { AnomalyDetectionService } from '../../services/fir/anomalyDetection.service';
import { FIRPdfService } from '../../services/fir/pdf.service';
import { FIRSummaryService } from '../../services/fir/summary.service';
import { NotificationService } from '../../services/notification/fir.notification.service';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { ApiError } from '../../utils/ApiError';
import { sendJson } from '../../server.shared';
import { Role } from '../../generated/prisma/enums';

export class FIRController {
  static async createFIR(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req, [Role.VICTIM]);

    const fir = await FIRService.createFIR({
      victimId: user.id,
      stationId: body.stationId,
      incidentDate: new Date(body.incidentDate),
      incidentTime: body.incidentTime,
      incidentLocation: body.incidentLocation,
      incidentDescription: body.incidentDescription,
      bnsSectionIds: body.bnsSectionIds,
      urgencyLevel: body.urgencyLevel,
    });

    sendJson(res, 201, {
      success: true,
      data: fir,
      message: 'FIR created successfully',
    });
  }

  static async updateFIR(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req, [Role.VICTIM, Role.OFFICER]);

    const fir = await FIRService.updateFIR(body.firId, {
      incidentDate: body.incidentDate ? new Date(body.incidentDate) : undefined,
      incidentTime: body.incidentTime,
      incidentLocation: body.incidentLocation,
      incidentDescription: body.incidentDescription,
      status: body.status,
      urgencyLevel: body.urgencyLevel,
    });

    sendJson(res, 200, {
      success: true,
      data: fir,
      message: 'FIR updated successfully',
    });
  }

  static async submitFIR(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req, [Role.OFFICER]);

    if (!user.officer) {
      throw new ApiError(403, 'User is not an officer');
    }

    const fir = await FIRService.submitFIR(body.firId, user.officer.id);
    await FIRSummaryService.generateSummary(fir.id);
    try {
      await NotificationService.sendFIRNotification(fir.id);
    } catch (error) {
      console.error('FIR notification failed:', error);
    }

    sendJson(res, 200, {
      success: true,
      data: fir,
      message: 'FIR submitted and acknowledged',
    });
  }

  static async getFIR(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req);
    const { firId } = body;

    const fir = await FIRService.getFIR(firId);

    if (!fir) {
      throw new ApiError(404, 'FIR not found');
    }

    // Check authorization
    const isStationOfficer = user.role === Role.OFFICER && user.officer?.stationId === fir.stationId;
    if (fir.victimId !== user.id && user.role !== Role.ADMIN && user.officer?.id !== fir.officerId && !isStationOfficer) {
      throw new ApiError(403, 'Not authorized to view this FIR');
    }

    sendJson(res, 200, {
      success: true,
      data: fir,
    });
  }

  static async getFIRsByVictim(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req, [Role.VICTIM]);

    const firs = await FIRService.getFIRsByVictim(user.id, body.status);

    sendJson(res, 200, {
      success: true,
      data: firs,
      count: firs.length,
    });
  }

  static async getFIRsByStation(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req, [Role.OFFICER, Role.ADMIN]);

    if (user.role !== Role.ADMIN && !user.officer) {
      throw new ApiError(403, 'Not authorized');
    }

    const stationId = user.role === Role.ADMIN ? body.stationId : user.officer!.stationId;
    const firs = await FIRService.getFIRsByStation(stationId, body.status);

    sendJson(res, 200, {
      success: true,
      data: firs,
      count: firs.length,
    });
  }

  static async trackByAcknowledgment(req: IncomingMessage, res: ServerResponse, body: any) {
    const { acknowledgmentNo } = body;

    const fir = await FIRService.trackFIRByAcknowledgment(acknowledgmentNo);

    sendJson(res, 200, {
      success: true,
      data: {
        firNumber: fir.firNumber,
        acknowledgmentNo: fir.acknowledgmentNo,
        status: fir.status,
        urgencyLevel: fir.urgencyLevel,
        incidentDate: fir.incidentDate,
        incidentLocation: fir.incidentLocation,
        station: {
          name: fir.station.name,
          phone: fir.station.phone,
        },
        officer: fir.officer ? { badgeNumber: fir.officer.badgeNumber, rank: fir.officer.rank } : null,
        caseUpdates: fir.caseUpdates.length > 0 ? fir.caseUpdates[fir.caseUpdates.length - 1] : null,
      },
    });
  }

  static async getEvidenceChecklist(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req, [Role.OFFICER]);

    const { checklist, items } = await EvidenceChecklistService.generateChecklistForFIR(body.firId);
    const status = await EvidenceChecklistService.getEvidenceStatus(body.firId);

    sendJson(res, 200, {
      success: true,
      data: {
        checklist,
        items,
        status,
      },
    });
  }

  static async getAnomalyAnalysis(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req, [Role.OFFICER, Role.ADMIN]);

    const anomalies = await AnomalyDetectionService.analyzeFIRForAnomalies(body.firId);
    const recommendations = await AnomalyDetectionService.generateInquiryRecommendations(body.firId);

    sendJson(res, 200, {
      success: true,
      data: {
        anomalies,
        recommendations,
      },
    });
  }

  static async uploadVoiceRecording(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req, [Role.OFFICER, Role.VICTIM]);
    const audioBuffer = body.audioBuffer as Buffer | undefined;

    if (!audioBuffer || !Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
      throw new ApiError(400, 'Audio file is required.');
    }

    const durationRaw = body.durationSecs ?? body.duration;
    const durationSecs =
      typeof durationRaw === 'string'
        ? Number.parseInt(durationRaw, 10)
        : typeof durationRaw === 'number'
          ? durationRaw
          : undefined;

    const recording = await VoiceRecordingService.storeVoiceUpload({
      userId: user.id,
      firId: typeof body.firId === 'string' ? body.firId : undefined,
      languageCode: typeof body.language === 'string' ? body.language : 'hi',
      durationSecs: Number.isFinite(durationSecs) ? durationSecs : undefined,
      buffer: audioBuffer,
      filename: typeof body.audioFilename === 'string' ? body.audioFilename : 'recording.webm',
      mimeType: typeof body.audioMimeType === 'string' ? body.audioMimeType : 'audio/webm',
    });

    sendJson(res, 201, {
      success: true,
      data: recording,
      message: 'Voice recording uploaded and processed successfully',
    });
  }

  static async generateSummary(req: IncomingMessage, res: ServerResponse, body: any) {
    await getAuthenticatedUser(req, [Role.OFFICER, Role.ADMIN]);
    const firId = String(body.firId ?? '');
    if (!firId) {
      throw new ApiError(400, 'FIR ID is required.');
    }

    const fir = await FIRSummaryService.generateSummary(firId);
    sendJson(res, 200, {
      success: true,
      data: fir,
      message: 'AI FIR summary generated.',
    });
  }

  static async downloadPDF(req: IncomingMessage, res: ServerResponse, body: any) {
    await getAuthenticatedUser(req, [Role.OFFICER, Role.ADMIN]);
    const firId = String(body.firId ?? '');
    if (!firId) {
      throw new ApiError(400, 'FIR ID is required.');
    }

    const pdf = await FIRPdfService.generateForFir(firId);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
    res.end(pdf.buffer);
  }

  static async markEvidenceCollected(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req, [Role.OFFICER]);

    const item = await EvidenceChecklistService.markEvidenceCollected(body.evidenceItemId, body.fileUrl);

    sendJson(res, 200, {
      success: true,
      data: item,
      message: 'Evidence marked as collected',
    });
  }

  static async addCaseUpdate(req: IncomingMessage, res: ServerResponse, body: any) {
    const user = await getAuthenticatedUser(req, [Role.OFFICER, Role.ADMIN]);

    const update = await FIRService.addCaseUpdate(body.firId, body.status, body.note, user.id);

    sendJson(res, 200, {
      success: true,
      data: update,
      message: 'Case update recorded',
    });
  }
}
