import type { IncomingMessage, ServerResponse } from 'node:http';
import { ensureVictimPayload, registerVictim } from '../../services/auth/victim.auth.service';
import { sendJson } from '../../server.shared';
import { setAuthCookies } from '../auth.shared';

export const victimRegisterController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const payload = ensureVictimPayload(body);
  const result = await registerVictim(payload);
  setAuthCookies(res, result);
  sendJson(res, 201, result);
};
