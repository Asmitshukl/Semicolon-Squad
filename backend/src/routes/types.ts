import type { IncomingMessage, ServerResponse } from 'node:http';

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => Promise<void>;

export type RouteDefinition = {
  method: string;
  path: string;
  handler: RouteHandler;
};
