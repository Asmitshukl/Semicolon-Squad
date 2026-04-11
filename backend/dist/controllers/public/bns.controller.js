"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicBNSController = void 0;
const bnsipc_translator_1 = require("../../services/bns/bnsipc.translator");
const server_shared_1 = require("../../server.shared");
const ApiError_1 = require("../../utils/ApiError");
class PublicBNSController {
    static async searchBNS(req, res, body) {
        const { query } = body;
        if (!query || query.trim().length === 0) {
            throw new ApiError_1.ApiError(400, 'Search query is required');
        }
        const results = await bnsipc_translator_1.BNSIPCTranslatorService.searchBNSSection(query);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: results,
            count: results.length,
        });
    }
    static async getBNSBySectionNumber(req, res, body) {
        const { sectionNumber } = body;
        if (!sectionNumber) {
            throw new ApiError_1.ApiError(400, 'Section number is required');
        }
        const translation = await bnsipc_translator_1.BNSIPCTranslatorService.getBNSSectionByNumber(sectionNumber);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: translation,
        });
    }
    static async getBNSSectionDetails(req, res, body) {
        const { bnsSectionId } = body;
        if (!bnsSectionId) {
            throw new ApiError_1.ApiError(400, 'BNS section ID is required');
        }
        const details = await bnsipc_translator_1.BNSIPCTranslatorService.getBNSSectionDetails(bnsSectionId);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: details,
        });
    }
    static async compareBNSAndIPC(req, res, body) {
        const { bnsSectionId } = body;
        if (!bnsSectionId) {
            throw new ApiError_1.ApiError(400, 'BNS section ID is required');
        }
        const comparison = await bnsipc_translator_1.BNSIPCTranslatorService.getIPCEquivalent(bnsSectionId);
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: comparison,
        });
    }
    static async getAllBNSSectionsByCategory(req, res, body) {
        const categories = await bnsipc_translator_1.BNSIPCTranslatorService.getAllBNSSectionsByCategory();
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: categories,
        });
    }
    static async getKeyChangesFromIPCtoBNS(req, res, body) {
        const changes = await bnsipc_translator_1.BNSIPCTranslatorService.getKeyChangesFromIPCtoBNS();
        (0, server_shared_1.sendJson)(res, 200, {
            success: true,
            data: changes,
            message: 'Key changes from IPC 1860 to BNS 2023',
        });
    }
}
exports.PublicBNSController = PublicBNSController;
