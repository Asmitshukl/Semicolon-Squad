"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchRoute = exports.routeMap = exports.routes = void 0;
const admin_routes_1 = require("./v1/admin.routes");
const officer_routes_1 = require("./v1/officer.routes");
const public_routes_1 = require("./v1/public.routes");
const victim_routes_1 = require("./v1/victim.routes");
exports.routes = [
    ...public_routes_1.publicRoutes,
    ...victim_routes_1.victimRoutes,
    ...officer_routes_1.officerRoutes,
    ...admin_routes_1.adminRoutes,
];
exports.routeMap = new Map(exports.routes.map((route) => [`${route.method} ${route.path}`, route.handler]));
const matchRoute = (method, pathname) => {
    const exact = exports.routeMap.get(`${method} ${pathname}`);
    if (exact) {
        return { handler: exact, params: {} };
    }
    const requestSegments = pathname.split('/').filter(Boolean);
    for (const route of exports.routes) {
        if (route.method !== method) {
            continue;
        }
        const routeSegments = route.path.split('/').filter(Boolean);
        if (routeSegments.length !== requestSegments.length) {
            continue;
        }
        const params = {};
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
exports.matchRoute = matchRoute;
