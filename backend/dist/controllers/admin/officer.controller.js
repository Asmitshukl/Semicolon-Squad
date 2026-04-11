"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCreateOfficerController = exports.adminOfficerReviewController = exports.adminOfficerListController = void 0;
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
const adminCreateOfficerController = async (req, res, body) => {
    const admin = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.ADMIN]);
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phone = String(body.phone ?? '').trim();
    const password = String(body.password ?? '');
    const badgeNumber = String(body.badgeNumber ?? '').trim();
    const stationCode = String(body.stationCode ?? '').trim();
    const rank = body.rank ? String(body.rank).trim() : undefined;
    if (!name || name.length < 2)
        throw new ApiError_1.ApiError(400, 'Full name is required.');
    if (!/^\S+@\S+\.\S+$/.test(email))
        throw new ApiError_1.ApiError(400, 'Enter a valid email address.');
    if (!/^[6-9]\d{9}$/.test(phone))
        throw new ApiError_1.ApiError(400, 'Enter a valid 10-digit Indian mobile number.');
    if (!badgeNumber || badgeNumber.length < 3)
        throw new ApiError_1.ApiError(400, 'Badge number is required.');
    if (!stationCode || stationCode.length < 3)
        throw new ApiError_1.ApiError(400, 'Station code is required.');
    if (password.length < 8)
        throw new ApiError_1.ApiError(400, 'Password must be at least 8 characters.');
    const officer = await (0, officer_service_1.adminCreateOfficer)({ name, email, phone, password, badgeNumber, stationCode, rank }, admin.id);
    (0, server_shared_1.sendJson)(res, 201, officer);
};
exports.adminCreateOfficerController = adminCreateOfficerController;
