"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBnsListController = exports.adminDashboardController = void 0;
const enums_1 = require("../../generated/prisma/enums");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const server_shared_1 = require("../../server.shared");
const dashboard_service_1 = require("../../services/admin/dashboard.service");
const bns_service_1 = require("../../services/admin/bns.service");
const adminDashboardController = async (req, res) => {
    await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
    const data = await (0, dashboard_service_1.getAdminDashboard)();
    (0, server_shared_1.sendJson)(res, 200, data);
};
exports.adminDashboardController = adminDashboardController;
const adminBnsListController = async (req, res) => {
    await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
    const url = new URL(req.url ?? '/', 'http://localhost');
    const query = url.searchParams.get('query') ?? undefined;
    const sections = await (0, bns_service_1.listAdminBnsSections)(query);
    (0, server_shared_1.sendJson)(res, 200, sections);
};
exports.adminBnsListController = adminBnsListController;
