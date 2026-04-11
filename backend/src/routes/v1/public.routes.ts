import {
  loginController,
  logoutController,
  meController,
  refreshController,
} from '../../controllers/auth.controller';
import { adminRegisterController } from '../../controllers/admin/auth.controller';
import { officerRegisterController } from '../../controllers/officer/auth.controller';
import { victimRegisterController } from '../../controllers/victim/auth.controller';
import type { RouteDefinition } from '../types';

export const publicRoutes: RouteDefinition[] = [
  { method: 'POST', path: '/api/auth/login', handler: loginController },
  { method: 'POST', path: '/api/auth/victim/register', handler: victimRegisterController },
  { method: 'POST', path: '/api/auth/officer/register', handler: officerRegisterController },
  { method: 'POST', path: '/api/auth/admin/register', handler: adminRegisterController },
  { method: 'POST', path: '/api/auth/refresh', handler: refreshController },
  { method: 'POST', path: '/api/auth/logout', handler: logoutController },
  { method: 'GET', path: '/api/auth/me', handler: meController },
];
