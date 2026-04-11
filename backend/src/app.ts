import type { IncomingMessage, ServerResponse } from 'node:http';
import { ApiError } from './utils/ApiError';
import { parseJsonBody, parseMultipartBody, sendJson, setCors } from './server.shared';
import { routeMap } from './routes';

export const app = async (req: IncomingMessage, res: ServerResponse) => {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const requestUrl = new URL(req.url ?? '/', 'http://localhost');
    const routeKey = `${req.method ?? 'GET'} ${requestUrl.pathname}`;
    const handler = routeMap.get(routeKey);

    if (!handler) {
      throw new ApiError(404, 'Route not found.');
    }

    let body: Record<string, unknown> = {};
    if (req.method !== 'GET') {
      const contentType = req.headers['content-type'] ?? '';
      if (contentType.includes('multipart/form-data')) {
        const mp = await parseMultipartBody(req);
        body = {
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
        body = await parseJsonBody(req);
      }
    }
    await handler(req, res, body);
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
