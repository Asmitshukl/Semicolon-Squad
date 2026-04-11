"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.victimRightsController = void 0;
const server_shared_1 = require("../../server.shared");
const rights_service_1 = require("../../services/victim/rights.service");
const victimRightsController = async (_req, res, body) => {
    const data = await (0, rights_service_1.getVictimRights)(body.statementId ? String(body.statementId) : undefined);
    (0, server_shared_1.sendJson)(res, 200, data);
};
exports.victimRightsController = victimRightsController;
