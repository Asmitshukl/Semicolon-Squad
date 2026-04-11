"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.officerRegisterController = void 0;
const officer_auth_service_1 = require("../../services/auth/officer.auth.service");
const server_shared_1 = require("../../server.shared");
const officerRegisterController = async (req, res, body) => {
    const payload = (0, officer_auth_service_1.ensureOfficerPayload)(body);
    const result = await (0, officer_auth_service_1.registerOfficer)(payload);
    (0, server_shared_1.sendJson)(res, 201, result);
};
exports.officerRegisterController = officerRegisterController;
