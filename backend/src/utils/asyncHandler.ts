import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteHandler } from '../routes/types';

export const asyncHandler = (
  fn: RouteHandler
): RouteHandler => {
  return async (req: IncomingMessage, res: ServerResponse, body: Record<string, unknown>): Promise<void> => {
    try {
      await fn(req, res, body);
    } catch (error) {
      // Let the error middleware handle it
      throw error;
    }
  };
};
