import type { IncomingMessage, ServerResponse } from 'node:http';
import { Role } from '../../generated/prisma/enums';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { sendJson } from '../../server.shared';
import { getVictimRights } from '../../services/victim/rights.service';

export const victimRightsController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const user = await getAuthenticatedUser(req, [Role.VICTIM]);
  const data = await getVictimRights(user.id, body.statementId ? String(body.statementId) : undefined);
  sendJson(res, 200, data);
};
