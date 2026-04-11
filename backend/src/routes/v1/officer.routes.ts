import type { RouteDefinition } from '../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { FIRController } from '../../controllers/officer/fir.controller';

export const officerRoutes: RouteDefinition[] = [
  // FIR Management
  { method: 'POST', path: '/api/officer/fir/create', handler: asyncHandler(FIRController.createFIR) },
  { method: 'PUT', path: '/api/officer/fir/update', handler: asyncHandler(FIRController.updateFIR) },
  { method: 'POST', path: '/api/officer/fir/submit', handler: asyncHandler(FIRController.submitFIR) },
  { method: 'GET', path: '/api/officer/fir/:firId', handler: asyncHandler(FIRController.getFIR) },
  { method: 'GET', path: '/api/officer/firs', handler: asyncHandler(FIRController.getFIRsByStation) },
  
  // Voice Recording
  { method: 'POST', path: '/api/officer/voice-recording/upload', handler: asyncHandler(FIRController.uploadVoiceRecording) },
  
  // Evidence Checklist
  { method: 'GET', path: '/api/officer/fir/:firId/checklist', handler: asyncHandler(FIRController.getEvidenceChecklist) },
  { method: 'POST', path: '/api/officer/evidence/collect', handler: asyncHandler(FIRController.markEvidenceCollected) },
  
  // Case Updates
  { method: 'POST', path: '/api/officer/case-update/add', handler: asyncHandler(FIRController.addCaseUpdate) },
  
  // Anomaly Detection
  { method: 'POST', path: '/api/officer/fir/analyze-anomalies', handler: asyncHandler(FIRController.getAnomalyAnalysis) },
];
