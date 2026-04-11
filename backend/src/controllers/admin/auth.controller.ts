import type { IncomingMessage, ServerResponse } from 'node:http';
import { ensureAdminPayload, registerAdmin } from '../../services/auth/admin.auth.service';
import { setAuthCookies } from '../auth.shared';
import { sendJson } from '../../server.shared';

export const adminRegisterController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const payload = ensureAdminPayload(body);
  const result = await registerAdmin(payload);
  setAuthCookies(res, result);
  sendJson(res, 201, result);
};
