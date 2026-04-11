import type { IncomingMessage, ServerResponse } from 'node:http';
import { Role } from '../../generated/prisma/enums';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { sendJson } from '../../server.shared';
import {
  listAdminOfficers,
  reviewOfficerRegistration,
} from '../../services/admin/officer.service';
import { ApiError } from '../../utils/ApiError';

export const adminOfficerListController = async (
  req: IncomingMessage,
  res: ServerResponse,
) => {
  await getAuthenticatedUser(req, [Role.ADMIN]);
  const url = new URL(req.url ?? '/', 'http://localhost');
  const status = url.searchParams.get('status') ?? undefined;
  const officers = await listAdminOfficers(status);
  sendJson(res, 200, officers);
};

export const adminOfficerReviewController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const admin = await getAuthenticatedUser(req, [Role.ADMIN]);
  const officerId = String(body.officerId ?? '').trim();
  const action = String(body.action ?? '').trim().toLowerCase();

  if (!officerId) {
    throw new ApiError(400, 'officerId is required.');
  }

  if (action !== 'approve' && action !== 'reject') {
    throw new ApiError(400, 'action must be either approve or reject.');
  }

  const result = await reviewOfficerRegistration(officerId, admin.id, action);
  sendJson(res, 200, result);
};
