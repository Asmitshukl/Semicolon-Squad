import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { Role } from '../../generated/prisma/enums';
import { OfficerPortalService } from '../../services/officer/portal.service';
import { sendJson } from '../../server.shared';

export class OfficerDashboardController {
  static async getDashboard(req: IncomingMessage, res: ServerResponse) {
    const user = await getAuthenticatedUser(req, [Role.OFFICER]);
    const dashboard = await OfficerPortalService.getDashboard(user.id);

    sendJson(res, 200, {
      success: true,
      data: dashboard,
    });
  }

  static async getProfile(req: IncomingMessage, res: ServerResponse) {
    const user = await getAuthenticatedUser(req, [Role.OFFICER]);
    const profile = await OfficerPortalService.getOfficerProfile(user.id);

    sendJson(res, 200, {
      success: true,
      data: profile,
    });
  }
}
