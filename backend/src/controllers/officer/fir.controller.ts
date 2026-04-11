import type { IncomingMessage, ServerResponse } from 'node:http';
import { FIRService } from '../../services/fir/fir.service';
import { VoiceRecordingService } from '../../services/fir/voiceRecording.service';
import { EvidenceChecklistService } from '../../services/fir/evidenceChecklist.service';
import { AnomalyDetectionService } from '../../services/fir/anomalyDetection.service';
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
    if (fir.victimId !== user.id && user.role !== Role.ADMIN && user.officer?.id !== fir.officerId) {
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
    const user = await getAuthenticatedUser(req);

    const recording = await VoiceRecordingService.createVoiceRecording({
      userId: user.id,
      firId: body.firId,
      language: body.language || 'HINDI',
      fileUrl: body.fileUrl,
      durationSecs: body.durationSecs,
    });

    // Process voice recording asynchronously
    VoiceRecordingService.processVoiceRecording(recording.id).catch(console.error);

    sendJson(res, 201, {
      success: true,
      data: recording,
      message: 'Voice recording uploaded and processing started',
    });
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
