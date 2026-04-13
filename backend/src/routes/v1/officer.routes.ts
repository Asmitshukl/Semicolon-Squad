import type { RouteDefinition } from '../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { FIRController } from '../../controllers/officer/fir.controller';
import { OfficerDashboardController } from '../../controllers/officer/dashboard.controller';
import { OfficerRecordingController } from '../../controllers/officer/recording.controller';
import { OfficerSectionController } from '../../controllers/officer/section.controller';

export const officerRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/officer/dashboard', handler: asyncHandler(OfficerDashboardController.getDashboard) },
  { method: 'GET', path: '/api/officer/profile', handler: asyncHandler(OfficerDashboardController.getProfile) },

  // FIR Management
  { method: 'POST', path: '/api/officer/fir/generate-from-recording', handler: asyncHandler(FIRController.generateFIRFromRecording) },
  { method: 'POST', path: '/api/officer/fir/create', handler: asyncHandler(FIRController.createFIR) },
  { method: 'PUT', path: '/api/officer/fir/update', handler: asyncHandler(FIRController.updateFIR) },
  { method: 'POST', path: '/api/officer/fir/submit', handler: asyncHandler(FIRController.submitFIR) },
  { method: 'POST', path: '/api/officer/fir/:firId/summary', handler: asyncHandler(FIRController.generateSummary) },
  { method: 'GET', path: '/api/officer/fir/:firId/pdf', handler: asyncHandler(FIRController.downloadPDF) },
  { method: 'GET', path: '/api/officer/fir/:firId', handler: asyncHandler(FIRController.getFIR) },
  { method: 'GET', path: '/api/officer/firs', handler: asyncHandler(FIRController.getFIRsByStation) },
  
  // Voice Recording
  { method: 'GET', path: '/api/officer/voice-recordings', handler: asyncHandler(OfficerRecordingController.listRecordings) },
  { method: 'GET', path: '/api/officer/voice-recordings/:recordingId', handler: asyncHandler(OfficerRecordingController.getRecording) },
  { method: 'GET', path: '/api/officer/voice-recordings/:recordingId/audio', handler: asyncHandler(OfficerRecordingController.streamAudio) },
  { method: 'POST', path: '/api/officer/voice-recordings/:recordingId/verify', handler: asyncHandler(OfficerRecordingController.verifyRecording) },
  { method: 'POST', path: '/api/officer/voice-recording/upload', handler: asyncHandler(FIRController.uploadVoiceRecording) },

  // BNS translator
  { method: 'GET', path: '/api/officer/bns/search', handler: asyncHandler(OfficerSectionController.search) },
  { method: 'GET', path: '/api/officer/bns/:sectionNumber', handler: asyncHandler(OfficerSectionController.getBySectionNumber) },
  
  // Evidence Checklist
  { method: 'GET', path: '/api/officer/fir/:firId/checklist', handler: asyncHandler(FIRController.getEvidenceChecklist) },
  { method: 'POST', path: '/api/officer/evidence/collect', handler: asyncHandler(FIRController.markEvidenceCollected) },
  
  // Case Updates
  { method: 'POST', path: '/api/officer/case-update/add', handler: asyncHandler(FIRController.addCaseUpdate) },
  
  // Anomaly Detection
  { method: 'POST', path: '/api/officer/fir/analyze-anomalies', handler: asyncHandler(FIRController.getAnomalyAnalysis) },
];
