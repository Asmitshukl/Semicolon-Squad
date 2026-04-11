"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficerDashboardController = void 0;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const enums_1 = require("../../generated/prisma/enums");
const portal_service_1 = require("../../services/officer/portal.service");
const server_shared_1 = require("../../server.shared");
class OfficerDashboardController {
    static async getDashboard(req, res) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER]);
        const dashboard = await portal_service_1.OfficerPortalService.getDashboard(user.id);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: dashboard,
        });
    }
    static async getProfile(req, res) {
        const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER]);
        const profile = await portal_service_1.OfficerPortalService.getOfficerProfile(user.id);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: profile,
        });
    }
}
exports.OfficerDashboardController = OfficerDashboardController;
