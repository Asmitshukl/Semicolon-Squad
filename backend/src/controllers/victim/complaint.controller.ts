import type { IncomingMessage, ServerResponse } from 'node:http';
import { Role } from '../../generated/prisma/enums';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { sendJson } from '../../server.shared';
import {
  classifyVictimStatement,
  getVictimResolution,
} from '../../services/victim/complaint.service';
import {
  createVictimStatement,
  getLatestVictimStatement,
} from '../../services/victim/statement.service';

export const createStatementController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const user = await getAuthenticatedUser(req, [Role.VICTIM]);
  const statement = await createVictimStatement(user.id, {
    rawText: String(body.rawText ?? ''),
    translatedText: body.translatedText ? String(body.translatedText) : undefined,
    language: body.language ? String(body.language) : undefined,
    incidentDate: body.incidentDate ? String(body.incidentDate) : undefined,
    incidentTime: body.incidentTime ? String(body.incidentTime) : undefined,
    incidentLocation: body.incidentLocation ? String(body.incidentLocation) : undefined,
    witnessDetails: body.witnessDetails ? String(body.witnessDetails) : undefined,
  });

  sendJson(res, 201, statement);
};

export const latestStatementController = async (
  req: IncomingMessage,
  res: ServerResponse,
) => {
  const user = await getAuthenticatedUser(req, [Role.VICTIM]);
  const statement = await getLatestVictimStatement(user.id);
  sendJson(res, 200, statement);
};

export const classifyStatementController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const user = await getAuthenticatedUser(req, [Role.VICTIM]);
  const classification = await classifyVictimStatement(
    user.id,
    body.statementId ? String(body.statementId) : undefined,
  );
  sendJson(res, 200, classification);
};

export const resolutionController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const user = await getAuthenticatedUser(req, [Role.VICTIM]);
  const resolution = await getVictimResolution(String(body.statementId ?? ''), user.id);
  sendJson(res, 200, resolution);
};
