"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.victimRegisterController = void 0;
const victim_auth_service_1 = require("../../services/auth/victim.auth.service");
const server_shared_1 = require("../../server.shared");
const auth_shared_1 = require("../auth.shared");
const victimRegisterController = async (req, res, body) => {
    const payload = (0, victim_auth_service_1.ensureVictimPayload)(body);
    const result = await (0, victim_auth_service_1.registerVictim)(payload);
    (0, auth_shared_1.setAuthCookies)(res, result);
    (0, server_shared_1.sendJson)(res, 201, result);
};
exports.victimRegisterController = victimRegisterController;
