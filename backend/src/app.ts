import type { IncomingMessage, ServerResponse } from 'node:http';
import { ApiError } from './utils/ApiError';
import { parseJsonBody, parseMultipartBody, sendJson, setCors } from './server.shared';
import { matchRoute } from './routes';

export const app = async (req: IncomingMessage, res: ServerResponse) => {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const requestUrl = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';
    const matchedRoute = matchRoute(method, requestUrl.pathname);
    const query = Object.fromEntries(requestUrl.searchParams.entries());

    if (!matchedRoute) {
      throw new ApiError(404, 'Route not found.');
    }

    let body: Record<string, unknown> = {
      ...query,
      ...matchedRoute.params,
    };
    if (method !== 'GET') {
      const contentType = req.headers['content-type'] ?? '';
      if (contentType.includes('multipart/form-data')) {
        const mp = await parseMultipartBody(req);
        body = {
          ...body,
          __multipart: true,
          ...mp.fields,
          ...(mp.file
            ? {
                audioBuffer: mp.file.buffer,
                audioMimeType: mp.file.mimeType,
                audioFilename: mp.file.filename,
              }
            : {}),
        };
      } else {
        body = {
          ...body,
          ...(await parseJsonBody(req)),
        };
      }
    }
    await matchedRoute.handler(req, res, body);
  } catch (error) {
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : 'Something went wrong on the server.';

    sendJson(res, statusCode, {
      success: false,
      message,
    });
  }
};
