import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../../server.shared';
import { getVictimRights } from '../../services/victim/rights.service';

export const victimRightsController = async (
  _req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const data = await getVictimRights(body.statementId ? String(body.statementId) : undefined);
  sendJson(res, 200, data);
};
