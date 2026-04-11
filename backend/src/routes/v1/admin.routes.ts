import type { RouteDefinition } from '../types';
import {
  adminBnsListController,
  adminDashboardController,
} from '../../controllers/admin/analytics.controller';
import {
  adminOfficerListController,
  adminOfficerReviewController,
  adminCreateOfficerController,
} from '../../controllers/admin/officer.controller';
import {
  adminStationCreateController,
  adminStationListController,
} from '../../controllers/admin/station.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { AdminOfficerVerificationController } from '../../controllers/admin/officerVerification.controller';

export const adminRoutes: RouteDefinition[] = [
  // Dashboard
  { method: 'GET', path: '/api/admin/dashboard', handler: adminDashboardController },
  
  // Officer Management
  { method: 'GET', path: '/api/admin/officers', handler: adminOfficerListController },
  { method: 'POST', path: '/api/admin/officers/review', handler: adminOfficerReviewController },
  { method: 'POST', path: '/api/admin/officers/create', handler: adminCreateOfficerController },
  
  // Officer Verification
  { method: 'POST', path: '/api/admin/officer/register', handler: asyncHandler(AdminOfficerVerificationController.registerOfficer) },
  { method: 'POST', path: '/api/admin/officer/send-otp', handler: asyncHandler(AdminOfficerVerificationController.sendOTPToStation) },
  { method: 'POST', path: '/api/admin/officer/verify-otp', handler: asyncHandler(AdminOfficerVerificationController.verifyOfficerWithOTP) },
  { method: 'POST', path: '/api/admin/officer/verify-badge', handler: asyncHandler(AdminOfficerVerificationController.verifyByBadgeAndStation) },
  { method: 'POST', path: '/api/admin/officer/verify-cctns', handler: asyncHandler(AdminOfficerVerificationController.verifyWithCCTNS) },
  { method: 'POST', path: '/api/admin/officer/reject', handler: asyncHandler(AdminOfficerVerificationController.rejectOfficer) },
  { method: 'GET', path: '/api/admin/officer/pending', handler: asyncHandler(AdminOfficerVerificationController.getPendingVerifications) },
  { method: 'POST', path: '/api/admin/officer/details', handler: asyncHandler(AdminOfficerVerificationController.getOfficerDetails) },
  { method: 'POST', path: '/api/admin/officers/by-station', handler: asyncHandler(AdminOfficerVerificationController.getOfficersByStation) },
  
  // Station Management
  { method: 'GET', path: '/api/admin/stations', handler: adminStationListController },
  { method: 'POST', path: '/api/admin/stations', handler: adminStationCreateController },
  
  // BNS Management
  { method: 'GET', path: '/api/admin/bns', handler: adminBnsListController },
];
