"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOfficerReviewController = exports.adminOfficerListController = void 0;
const enums_1 = require("../../generated/prisma/enums");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const server_shared_1 = require("../../server.shared");
const officer_service_1 = require("../../services/admin/officer.service");
const ApiError_1 = require("../../utils/ApiError");
const adminOfficerListController = async (req, res) => {
    await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
    const url = new URL(req.url ?? '/', 'http://localhost');
    const status = url.searchParams.get('status') ?? undefined;
    const officers = await (0, officer_service_1.listAdminOfficers)(status);
    (0, server_shared_1.sendJson)(res, 200, officers);
};
exports.adminOfficerListController = adminOfficerListController;
const adminOfficerReviewController = async (req, res, body) => {
    const admin = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
    const officerId = String(body.officerId ?? '').trim();
    const action = String(body.action ?? '').trim().toLowerCase();
    if (!officerId) {
        throw new ApiError_1.ApiError(400, 'officerId is required.');
    }
    if (action !== 'approve' && action !== 'reject') {
        throw new ApiError_1.ApiError(400, 'action must be either approve or reject.');
    }
    const result = await (0, officer_service_1.reviewOfficerRegistration)(officerId, admin.id, action);
    (0, server_shared_1.sendJson)(res, 200, result);
};
exports.adminOfficerReviewController = adminOfficerReviewController;
