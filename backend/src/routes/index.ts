import { adminRoutes } from './v1/admin.routes';
import { officerRoutes } from './v1/officer.routes';
import { publicRoutes } from './v1/public.routes';
import { victimRoutes } from './v1/victim.routes';
import type { RouteDefinition, RouteHandler } from './types';

export const routes: RouteDefinition[] = [
  ...publicRoutes,
  ...victimRoutes,
  ...officerRoutes,
  ...adminRoutes,
];

export const routeMap = new Map<string, RouteHandler>(
  routes.map((route) => [`${route.method} ${route.path}`, route.handler]),
);
