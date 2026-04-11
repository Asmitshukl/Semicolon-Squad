"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.victimCaseTrackController = exports.victimCasesController = void 0;
const enums_1 = require("../../generated/prisma/enums");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const ApiError_1 = require("../../utils/ApiError");
const server_shared_1 = require("../../server.shared");
const tracker_service_1 = require("../../services/victim/tracker.service");
const victimCasesController = async (req, res) => {
    const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.VICTIM]);
    const cases = await (0, tracker_service_1.getVictimCases)(user.id);
    (0, server_shared_1.sendJson)(res, 200, cases);
};
exports.victimCasesController = victimCasesController;
const victimCaseTrackController = async (req, res) => {
    const user = await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.VICTIM]);
    const url = new URL(req.url ?? '/', 'http://localhost');
    const acknowledgmentNo = url.searchParams.get('acknowledgmentNo');
    if (!acknowledgmentNo) {
        throw new ApiError_1.ApiError(400, 'acknowledgmentNo is required.');
    }
    const fir = await (0, tracker_service_1.trackVictimCase)(user.id, acknowledgmentNo);
    (0, server_shared_1.sendJson)(res, 200, fir);
};
exports.victimCaseTrackController = victimCaseTrackController;
