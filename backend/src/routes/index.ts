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

export const matchRoute = (method: string, pathname: string) => {
  const exact = routeMap.get(`${method} ${pathname}`);
  if (exact) {
    return { handler: exact, params: {} as Record<string, string> };
  }

  const requestSegments = pathname.split('/').filter(Boolean);

  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }

    const routeSegments = route.path.split('/').filter(Boolean);
    if (routeSegments.length !== requestSegments.length) {
      continue;
    }

    const params: Record<string, string> = {};
    let matched = true;

    for (let i = 0; i < routeSegments.length; i += 1) {
      const routeSegment = routeSegments[i];
      const requestSegment = requestSegments[i];

      if (routeSegment.startsWith(':')) {
        params[routeSegment.slice(1)] = decodeURIComponent(requestSegment);
        continue;
      }

      if (routeSegment !== requestSegment) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return { handler: route.handler, params };
    }
  }

  return null;
};
