"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.victimRightsController = void 0;
const enums_1 = require("../../generated/prisma/enums");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const server_shared_1 = require("../../server.shared");
const rights_service_1 = require("../../services/victim/rights.service");
const victimRightsController = async (req, res, body) => {
    const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.VICTIM]);
    const data = await (0, rights_service_1.getVictimRights)(user.id, body.statementId ? String(body.statementId) : undefined);
    (0, server_shared_1.sendJson)(res, 200, data);
};
exports.victimRightsController = victimRightsController;
