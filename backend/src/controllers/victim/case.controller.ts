import type { IncomingMessage, ServerResponse } from 'node:http';
import { Role } from '../../generated/prisma/enums';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { ApiError } from '../../utils/ApiError';
import { sendJson } from '../../server.shared';
import { getVictimCases, trackVictimCase } from '../../services/victim/tracker.service';

export const victimCasesController = async (req: IncomingMessage, res: ServerResponse) => {
  const user = await getAuthenticatedUser(req, [Role.VICTIM]);
  const cases = await getVictimCases(user.id);
  sendJson(res, 200, cases);
};

export const victimCaseTrackController = async (req: IncomingMessage, res: ServerResponse) => {
  const user = await getAuthenticatedUser(req, [Role.VICTIM]);
  const url = new URL(req.url ?? '/', 'http://localhost');
  const acknowledgmentNo = url.searchParams.get('acknowledgmentNo');

  if (!acknowledgmentNo) {
    throw new ApiError(400, 'acknowledgmentNo is required.');
  }

  const fir = await trackVictimCase(user.id, acknowledgmentNo);
  sendJson(res, 200, fir);
};
