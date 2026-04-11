import {
  loginController,
  logoutController,
  meController,
  refreshController,
} from '../../controllers/auth.controller';
import { officerRegisterController } from '../../controllers/officer/auth.controller';
import { victimRegisterController } from '../../controllers/victim/auth.controller';
import type { RouteDefinition } from '../types';
import { asyncHandler } from '../../utils/asyncHandler';
import { PublicBNSController } from '../../controllers/public/bns.controller';
import { CrimeClassificationController } from '../../controllers/public/crimeClassification.controller';

export const publicRoutes: RouteDefinition[] = [
  // Auth
  { method: 'POST', path: '/api/auth/login', handler: loginController },
  { method: 'POST', path: '/api/auth/victim/register', handler: victimRegisterController },
  { method: 'POST', path: '/api/auth/officer/register', handler: officerRegisterController },
  { method: 'POST', path: '/api/auth/refresh', handler: refreshController },
  { method: 'POST', path: '/api/auth/logout', handler: logoutController },
  { method: 'GET', path: '/api/auth/me', handler: meController },
  
  // BNS/IPC Translator
  { method: 'POST', path: '/api/bns/search', handler: asyncHandler(PublicBNSController.searchBNS) },
  { method: 'POST', path: '/api/bns/section', handler: asyncHandler(PublicBNSController.getBNSBySectionNumber) },
  { method: 'POST', path: '/api/bns/details', handler: asyncHandler(PublicBNSController.getBNSSectionDetails) },
  { method: 'POST', path: '/api/bns/compare-ipc', handler: asyncHandler(PublicBNSController.compareBNSAndIPC) },
  { method: 'GET', path: '/api/bns/categories', handler: asyncHandler(PublicBNSController.getAllBNSSectionsByCategory) },
  { method: 'GET', path: '/api/bns/changes', handler: asyncHandler(PublicBNSController.getKeyChangesFromIPCtoBNS) },
  
  // Crime Classification
  { method: 'POST', path: '/api/classify/statement', handler: asyncHandler(CrimeClassificationController.classifyStatement) },
  { method: 'POST', path: '/api/classify/get', handler: asyncHandler(CrimeClassificationController.getClassification) },
  { method: 'POST', path: '/api/classify/update', handler: asyncHandler(CrimeClassificationController.updateScore) },
];
