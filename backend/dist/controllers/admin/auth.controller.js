"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRegisterController = void 0;
const admin_auth_service_1 = require("../../services/auth/admin.auth.service");
const auth_shared_1 = require("../auth.shared");
const server_shared_1 = require("../../server.shared");
const adminRegisterController = async (req, res, body) => {
    const payload = (0, admin_auth_service_1.ensureAdminPayload)(body);
    const result = await (0, admin_auth_service_1.registerAdmin)(payload);
    (0, auth_shared_1.setAuthCookies)(res, result);
    (0, server_shared_1.sendJson)(res, 201, result);
};
exports.adminRegisterController = adminRegisterController;
