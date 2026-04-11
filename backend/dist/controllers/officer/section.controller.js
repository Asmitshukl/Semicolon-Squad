"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficerSectionController = void 0;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const enums_1 = require("../../generated/prisma/enums");
const bnsipc_translator_1 = require("../../services/bns/bnsipc.translator");
const server_shared_1 = require("../../server.shared");
class OfficerSectionController {
    static async search(req, res, body) {
        await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER]);
        const query = String(body.q ?? body.query ?? '').trim();
        const sections = await bnsipc_translator_1.BNSIPCTranslatorService.searchBNSSection(query);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: sections,
            count: sections.length,
        });
    }
    static async getBySectionNumber(req, res, body) {
        await (0, auth_middleware_1.getAuthenticatedUser)(req, [enums_1.Role.OFFICER]);
        const sectionNumber = String(body.sectionNumber ?? '').trim();
        const section = await bnsipc_translator_1.BNSIPCTranslatorService.getBNSSectionByNumber(sectionNumber);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: section,
        });
    }
}
exports.OfficerSectionController = OfficerSectionController;
