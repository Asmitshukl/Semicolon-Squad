import type { RouteDefinition } from '../types';
import {
  classifyStatementController,
  createStatementController,
  latestStatementController,
  resolutionController,
} from '../../controllers/victim/complaint.controller';
import { victimRightsController } from '../../controllers/victim/rights.controller';
import {
  victimCaseTrackController,
  victimCasesController,
} from '../../controllers/victim/case.controller';
import { victimStationsController } from '../../controllers/victim/station.controller';

export const victimRoutes: RouteDefinition[] = [
  { method: 'POST', path: '/api/victim/statements', handler: createStatementController },
  { method: 'GET', path: '/api/victim/statements/latest', handler: latestStatementController },
  { method: 'POST', path: '/api/victim/classify', handler: classifyStatementController },
  { method: 'POST', path: '/api/victim/resolution', handler: resolutionController },
  { method: 'POST', path: '/api/victim/rights', handler: victimRightsController },
  { method: 'GET', path: '/api/victim/stations', handler: victimStationsController },
  { method: 'GET', path: '/api/victim/cases', handler: victimCasesController },
  { method: 'GET', path: '/api/victim/cases/track', handler: victimCaseTrackController },
];
