import type { IncomingMessage, ServerResponse } from 'node:http';
import { ensureOfficerPayload, registerOfficer } from '../../services/auth/officer.auth.service';
import { sendJson } from '../../server.shared';

export const officerRegisterController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const payload = ensureOfficerPayload(body);
  const result = await registerOfficer(payload);
  sendJson(res, 201, result);
};
