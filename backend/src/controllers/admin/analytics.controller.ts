import type { IncomingMessage, ServerResponse } from 'node:http';
import { Role } from '../../generated/prisma/enums';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { sendJson } from '../../server.shared';
import { getAdminDashboard } from '../../services/admin/dashboard.service';
import { listAdminBnsSections } from '../../services/admin/bns.service';

export const adminDashboardController = async (
  req: IncomingMessage,
  res: ServerResponse,
) => {
  await getAuthenticatedUser(req, [Role.ADMIN]);
  const data = await getAdminDashboard();
  sendJson(res, 200, data);
};

export const adminBnsListController = async (
  req: IncomingMessage,
  res: ServerResponse,
) => {
  await getAuthenticatedUser(req, [Role.ADMIN]);
  const url = new URL(req.url ?? '/', 'http://localhost');
  const query = url.searchParams.get('query') ?? undefined;
  const sections = await listAdminBnsSections(query);
  sendJson(res, 200, sections);
};
