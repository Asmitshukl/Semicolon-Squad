import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { Role } from '../../generated/prisma/enums';
import { BNSIPCTranslatorService } from '../../services/bns/bnsipc.translator';
import { sendJson } from '../../server.shared';

export class OfficerSectionController {
  static async search(req: IncomingMessage, res: ServerResponse, body: Record<string, unknown>) {
    await getAuthenticatedUser(req, [Role.OFFICER]);
    const query = String(body.q ?? body.query ?? '').trim();
    const sections = await BNSIPCTranslatorService.searchBNSSection(query);

    sendJson(res, 200, {
      success: true,
      data: sections,
      count: sections.length,
    });
  }

  static async getBySectionNumber(req: IncomingMessage, res: ServerResponse, body: Record<string, unknown>) {
    await getAuthenticatedUser(req, [Role.OFFICER]);
    const sectionNumber = String(body.sectionNumber ?? '').trim();
    const section = await BNSIPCTranslatorService.getBNSSectionByNumber(sectionNumber);

    sendJson(res, 200, {
      success: true,
      data: section,
    });
  }
}
