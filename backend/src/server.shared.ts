import type { IncomingMessage, ServerResponse } from 'node:http';
import { env, isProduction } from './config/env';
import { ApiError } from './utils/ApiError';

export const sendJson = (res: ServerResponse, statusCode: number, body: unknown) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const localhostOriginOk = (o: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(o);

const originIsAllowed = (origin: string | undefined): origin is string => {
  if (!origin) return false;
  if (origin === env.appUrl) return true;
  if (env.corsOrigins.includes(origin)) return true;
  /* Vite often runs on 5174–5177; echoing the real Origin is required for credentialed requests. */
  if (!isProduction && localhostOriginOk(origin)) return true;
  return false;
};

export const setCors = (req: IncomingMessage, res: ServerResponse) => {
  const origin = req.headers.origin;
  if (originIsAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
};

export type ParsedMultipart = {
  fields: Record<string, string>;
  file?: { buffer: Buffer; filename: string; mimeType: string };
};

const readRequestBuffer = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

export const parseMultipartBody = async (req: IncomingMessage): Promise<ParsedMultipart> =>
  (async () => {
    const ct = req.headers['content-type'] ?? '';
    if (!ct.includes('multipart/form-data')) {
      throw new ApiError(400, 'Expected multipart/form-data.');
    }

    const boundaryMatch = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];

    if (!boundary) {
      throw new ApiError(400, 'Multipart boundary is missing.');
    }

    const body = await readRequestBuffer(req);
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const fields: Record<string, string> = {};
    let file: ParsedMultipart['file'];

    let searchFrom = 0;
    while (searchFrom < body.length) {
      const start = body.indexOf(boundaryBuffer, searchFrom);
      if (start === -1) break;

      const partStart = start + boundaryBuffer.length;
      const trailer = body.subarray(partStart, partStart + 2).toString('utf8');
      if (trailer === '--') break;

      const contentStart = partStart + 2;
      const nextBoundary = body.indexOf(boundaryBuffer, contentStart);
      if (nextBoundary === -1) break;

      const part = body.subarray(contentStart, nextBoundary - 2);
      const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
      if (headerEnd === -1) {
        searchFrom = nextBoundary;
        continue;
      }

      const headerText = part.subarray(0, headerEnd).toString('utf8');
      const content = part.subarray(headerEnd + 4);

      const disposition = headerText.match(/content-disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i);
      if (!disposition) {
        searchFrom = nextBoundary;
        continue;
      }

      const [, fieldName, filenameRaw] = disposition;
      const contentTypeMatch = headerText.match(/content-type:\s*([^\r\n]+)/i);

      if (filenameRaw !== undefined) {
        if (fieldName === 'audio') {
          file = {
            buffer: Buffer.from(content),
            filename: filenameRaw || 'recording.webm',
            mimeType: contentTypeMatch?.[1]?.trim() || 'application/octet-stream',
          };
        }
      } else {
        fields[fieldName] = content.toString('utf8');
      }

      searchFrom = nextBoundary;
    }

    return { fields, file };
  })();

export const parseJsonBody = async (req: IncomingMessage): Promise<Record<string, unknown>> => {
  const body = await readRequestBuffer(req);
  if (body.length === 0) {
    return {};
  }

  try {
    return JSON.parse(body.toString('utf8')) as Record<string, unknown>;
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON.');
  }
};

export const parseCookies = (req: IncomingMessage) => {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) {
    return {} as Record<string, string>;
  }

  return rawCookie.split(';').reduce<Record<string, string>>((cookies, pair) => {
    const [rawName, ...valueParts] = pair.trim().split('=');
    if (!rawName) {
      return cookies;
    }
    cookies[rawName] = decodeURIComponent(valueParts.join('='));
    return cookies;
  }, {});
};
