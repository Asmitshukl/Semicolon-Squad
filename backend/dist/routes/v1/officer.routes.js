"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.officerRoutes = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const fir_controller_1 = require("../../controllers/officer/fir.controller");
const dashboard_controller_1 = require("../../controllers/officer/dashboard.controller");
const recording_controller_1 = require("../../controllers/officer/recording.controller");
const section_controller_1 = require("../../controllers/officer/section.controller");
exports.officerRoutes = [
    { method: 'GET', path: '/api/officer/dashboard', handler: (0, asyncHandler_1.asyncHandler)(dashboard_controller_1.OfficerDashboardController.getDashboard) },
    { method: 'GET', path: '/api/officer/profile', handler: (0, asyncHandler_1.asyncHandler)(dashboard_controller_1.OfficerDashboardController.getProfile) },
    // FIR Management
    { method: 'POST', path: '/api/officer/fir/create', handler: (0, asyncHandler_1.asyncHandler)(fir_controller_1.FIRController.createFIR) },
    { method: 'PUT', path: '/api/officer/fir/update', handler: (0, asyncHandler_1.asyncHandler)(fir_controller_1.FIRController.updateFIR) },
    { method: 'POST', path: '/api/officer/fir/submit', handler: (0, asyncHandler_1.asyncHandler)(fir_controller_1.FIRController.submitFIR) },
    { method: 'POST', path: '/api/officer/fir/:firId/summary', handler: (0, asyncHandler_1.asyncHandler)(fir_controller_1.FIRController.generateSummary) },
    { method: 'GET', path: '/api/officer/fir/:firId/pdf', handler: (0, asyncHandler_1.asyncHandler)(fir_controller_1.FIRController.downloadPDF) },
    { method: 'GET', path: '/api/officer/fir/:firId', handler: (0, asyncHandler_1.asyncHandler)(fir_controller_1.FIRController.getFIR) },
    { method: 'GET', path: '/api/officer/firs', handler: (0, asyncHandler_1.asyncHandler)(fir_controller_1.FIRController.getFIRsByStation) },
    // Voice Recording
    { method: 'GET', path: '/api/officer/voice-recordings', handler: (0, asyncHandler_1.asyncHandler)(recording_controller_1.OfficerRecordingController.listRecordings) },
    { method: 'GET', path: '/api/officer/voice-recordings/:recordingId', handler: (0, asyncHandler_1.asyncHandler)(recording_controller_1.OfficerRecordingController.getRecording) },
    { method: 'GET', path: '/api/officer/voice-recordings/:recordingId/audio', handler: (0, asyncHandler_1.asyncHandler)(recording_controller_1.OfficerRecordingController.streamAudio) },
    { method: 'POST', path: '/api/officer/voice-recordings/:recordingId/verify', handler: (0, asyncHandler_1.asyncHandler)(recording_controller_1.OfficerRecordingController.verifyRecording) },
    { method: 'POST', path: '/api/officer/voice-recording/upload', handler: (0, asyncHandler_1.asyncHandler)(fir_controller_1.FIRController.uploadVoiceRecording) },
    // BNS translator
    { method: 'GET', path: '/api/officer/bns/search', handler: (0, asyncHandler_1.asyncHandler)(section_controller_1.OfficerSectionController.search) },
    { method: 'GET', path: '/api/officer/bns/:sectionNumber', handler: (0, asyncHandler_1.asyncHandler)(section_controller_1.OfficerSectionController.getBySectionNumber) },
    // Evidence Checklist
    { method: 'GET', path: '/api/officer/fir/:firId/checklist', handler: (0, asyncHandler_1.asyncHandler)(fir_controller_1.FIRController.getEvidenceChecklist) },
    { method: 'POST', path: '/api/officer/evidence/collect', handler: (0, asyncHandler_1.asyncHandler)(fir_controller_1.FIRController.markEvidenceCollected) },
    // Case Updates
    { method: 'POST', path: '/api/officer/case-update/add', handler: (0, asyncHandler_1.asyncHandler)(fir_controller_1.FIRController.addCaseUpdate) },
    // Anomaly Detection
    { method: 'POST', path: '/api/officer/fir/analyze-anomalies', handler: (0, asyncHandler_1.asyncHandler)(fir_controller_1.FIRController.getAnomalyAnalysis) },
];
