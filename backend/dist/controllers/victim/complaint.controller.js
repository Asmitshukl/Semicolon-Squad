"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolutionController = exports.classifyStatementController = exports.latestStatementController = exports.createStatementController = void 0;
const enums_1 = require("../../generated/prisma/enums");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const server_shared_1 = require("../../server.shared");
const complaint_service_1 = require("../../services/victim/complaint.service");
const statement_service_1 = require("../../services/victim/statement.service");
const createStatementController = async (req, res, body) => {
    const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.VICTIM]);
    const statement = await (0, statement_service_1.createVictimStatement)(user.id, {
        rawText: String(body.rawText ?? ''),
        translatedText: body.translatedText ? String(body.translatedText) : undefined,
        language: body.language ? String(body.language) : undefined,
        incidentDate: body.incidentDate ? String(body.incidentDate) : undefined,
        incidentTime: body.incidentTime ? String(body.incidentTime) : undefined,
        incidentLocation: body.incidentLocation ? String(body.incidentLocation) : undefined,
        witnessDetails: body.witnessDetails ? String(body.witnessDetails) : undefined,
    });
    (0, server_shared_1.sendJson)(res, 201, statement);
};
exports.createStatementController = createStatementController;
const latestStatementController = async (req, res) => {
    const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.VICTIM]);
    const statement = await (0, statement_service_1.getLatestVictimStatement)(user.id);
    (0, server_shared_1.sendJson)(res, 200, statement);
};
exports.latestStatementController = latestStatementController;
const classifyStatementController = async (req, res, body) => {
    const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.VICTIM]);
    const classification = await (0, complaint_service_1.classifyVictimStatement)(user.id, body.statementId ? String(body.statementId) : undefined);
    (0, server_shared_1.sendJson)(res, 200, classification);
};
exports.classifyStatementController = classifyStatementController;
const resolutionController = async (req, res, body) => {
    const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.VICTIM]);
    const resolution = await (0, complaint_service_1.getVictimResolution)(String(body.statementId ?? ''), user.id);
    (0, server_shared_1.sendJson)(res, 200, resolution);
};
exports.resolutionController = resolutionController;
