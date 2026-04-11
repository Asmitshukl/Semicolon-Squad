"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const analytics_controller_1 = require("../../controllers/admin/analytics.controller");
const officer_controller_1 = require("../../controllers/admin/officer.controller");
const station_controller_1 = require("../../controllers/admin/station.controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const officerVerification_controller_1 = require("../../controllers/admin/officerVerification.controller");
exports.adminRoutes = [
    // Dashboard
    { method: 'GET', path: '/api/admin/dashboard', handler: analytics_controller_1.adminDashboardController },
    // Officer Management
    { method: 'GET', path: '/api/admin/officers', handler: officer_controller_1.adminOfficerListController },
    { method: 'POST', path: '/api/admin/officers/review', handler: officer_controller_1.adminOfficerReviewController },
    { method: 'POST', path: '/api/admin/officers/create', handler: officer_controller_1.adminCreateOfficerController },
    // Officer Verification
    { method: 'POST', path: '/api/admin/officer/register', handler: (0, asyncHandler_1.asyncHandler)(officerVerification_controller_1.AdminOfficerVerificationController.registerOfficer) },
    { method: 'POST', path: '/api/admin/officer/send-otp', handler: (0, asyncHandler_1.asyncHandler)(officerVerification_controller_1.AdminOfficerVerificationController.sendOTPToStation) },
    { method: 'POST', path: '/api/admin/officer/verify-otp', handler: (0, asyncHandler_1.asyncHandler)(officerVerification_controller_1.AdminOfficerVerificationController.verifyOfficerWithOTP) },
    { method: 'POST', path: '/api/admin/officer/verify-badge', handler: (0, asyncHandler_1.asyncHandler)(officerVerification_controller_1.AdminOfficerVerificationController.verifyByBadgeAndStation) },
    { method: 'POST', path: '/api/admin/officer/verify-cctns', handler: (0, asyncHandler_1.asyncHandler)(officerVerification_controller_1.AdminOfficerVerificationController.verifyWithCCTNS) },
    { method: 'POST', path: '/api/admin/officer/reject', handler: (0, asyncHandler_1.asyncHandler)(officerVerification_controller_1.AdminOfficerVerificationController.rejectOfficer) },
    { method: 'GET', path: '/api/admin/officer/pending', handler: (0, asyncHandler_1.asyncHandler)(officerVerification_controller_1.AdminOfficerVerificationController.getPendingVerifications) },
    { method: 'POST', path: '/api/admin/officer/details', handler: (0, asyncHandler_1.asyncHandler)(officerVerification_controller_1.AdminOfficerVerificationController.getOfficerDetails) },
    { method: 'POST', path: '/api/admin/officers/by-station', handler: (0, asyncHandler_1.asyncHandler)(officerVerification_controller_1.AdminOfficerVerificationController.getOfficersByStation) },
    // Station Management
    { method: 'GET', path: '/api/admin/stations', handler: station_controller_1.adminStationListController },
    { method: 'POST', path: '/api/admin/stations', handler: station_controller_1.adminStationCreateController },
    // BNS Management
    { method: 'GET', path: '/api/admin/bns', handler: analytics_controller_1.adminBnsListController },
];
