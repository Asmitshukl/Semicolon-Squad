"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeMap = exports.routes = void 0;
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
