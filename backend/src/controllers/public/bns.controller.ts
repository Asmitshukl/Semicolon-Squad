import type { IncomingMessage, ServerResponse } from 'node:http';
import { BNSIPCTranslatorService } from '../../services/bns/bnsipc.translator';
import { sendJson } from '../../server.shared';
import { ApiError } from '../../utils/ApiError';

export class PublicBNSController {
  static async searchBNS(req: IncomingMessage, res: ServerResponse, body: any) {
    const { query } = body;

    if (!query || query.trim().length === 0) {
      throw new ApiError(400, 'Search query is required');
    }

    const results = await BNSIPCTranslatorService.searchBNSSection(query);

    sendJson(res, 200, {
      success: true,
      data: results,
      count: results.length,
    });
  }

  static async getBNSBySectionNumber(req: IncomingMessage, res: ServerResponse, body: any) {
    const { sectionNumber } = body;

    if (!sectionNumber) {
      throw new ApiError(400, 'Section number is required');
    }

    const translation = await BNSIPCTranslatorService.getBNSSectionByNumber(sectionNumber);

    sendJson(res, 200, {
      success: true,
      data: translation,
    });
  }

  static async getBNSSectionDetails(req: IncomingMessage, res: ServerResponse, body: any) {
    const { bnsSectionId } = body;

    if (!bnsSectionId) {
      throw new ApiError(400, 'BNS section ID is required');
    }

    const details = await BNSIPCTranslatorService.getBNSSectionDetails(bnsSectionId);

    sendJson(res, 200, {
      success: true,
      data: details,
    });
  }

  static async compareBNSAndIPC(req: IncomingMessage, res: ServerResponse, body: any) {
    const { bnsSectionId } = body;

    if (!bnsSectionId) {
      throw new ApiError(400, 'BNS section ID is required');
    }

    const comparison = await BNSIPCTranslatorService.getIPCEquivalent(bnsSectionId);

    sendJson(res, 200, {
      success: true,
      data: comparison,
    });
  }

  static async getAllBNSSectionsByCategory(req: IncomingMessage, res: ServerResponse, body: any) {
    const categories = await BNSIPCTranslatorService.getAllBNSSectionsByCategory();

    sendJson(res, 200, {
      success: true,
      data: categories,
    });
  }

  static async getKeyChangesFromIPCtoBNS(req: IncomingMessage, res: ServerResponse, body: any) {
    const changes = await BNSIPCTranslatorService.getKeyChangesFromIPCtoBNS();

    sendJson(res, 200, {
      success: true,
      data: changes,
      message: 'Key changes from IPC 1860 to BNS 2023',
    });
  }
}
