import type { IncomingMessage, ServerResponse } from 'node:http';
import busboy from 'busboy';
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

export const parseMultipartBody = async (req: IncomingMessage): Promise<ParsedMultipart> =>
  new Promise((resolve, reject) => {
    const ct = req.headers['content-type'] ?? '';
    if (!ct.includes('multipart/form-data')) {
      reject(new ApiError(400, 'Expected multipart/form-data.'));
      return;
    }

    const bb = busboy({ headers: req.headers });
    const fields: Record<string, string> = {};
    const chunks: Buffer[] = [];
    let filename = 'recording.webm';
    let mimeType = 'audio/webm';

    bb.on('file', (name, file, info) => {
      if (name !== 'audio') {
        file.resume();
        return;
      }
      filename = info.filename || filename;
      mimeType = info.mimeType || mimeType;
      file.on('data', (data: Buffer) => {
        chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
      });
    });

    bb.on('field', (name, val) => {
      fields[name] = val;
    });

    bb.on('error', (err: Error) => reject(err));
    bb.on('finish', () => {
      resolve({
        fields,
        file: chunks.length ? { buffer: Buffer.concat(chunks), filename, mimeType } : undefined,
      });
    });

    req.pipe(bb);
  });

export const parseJsonBody = async (req: IncomingMessage): Promise<Record<string, unknown>> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
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
