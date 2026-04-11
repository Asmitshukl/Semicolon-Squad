import type { IncomingMessage, ServerResponse } from 'node:http';
import { Role } from '../../generated/prisma/enums';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { sendJson } from '../../server.shared';
import {
  adminCreateOfficer,
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

export const adminCreateOfficerController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const admin = await getAuthenticatedUser(req, [Role.ADMIN]);

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? '').trim();
  const password = String(body.password ?? '');
  const badgeNumber = String(body.badgeNumber ?? '').trim();
  const stationCode = String(body.stationCode ?? '').trim();
  const rank = body.rank ? String(body.rank).trim() : undefined;

  if (!name || name.length < 2) throw new ApiError(400, 'Full name is required.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new ApiError(400, 'Enter a valid email address.');
  if (!/^[6-9]\d{9}$/.test(phone)) throw new ApiError(400, 'Enter a valid 10-digit Indian mobile number.');
  if (!badgeNumber || badgeNumber.length < 3) throw new ApiError(400, 'Badge number is required.');
  if (!stationCode || stationCode.length < 3) throw new ApiError(400, 'Station code is required.');
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters.');

  const officer = await adminCreateOfficer(
    { name, email, phone, password, badgeNumber, stationCode, rank },
    admin.id,
  );

  sendJson(res, 201, officer);
};
