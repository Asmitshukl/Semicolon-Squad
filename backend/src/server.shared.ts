import type { IncomingMessage, ServerResponse } from 'node:http';
import { env } from './config/env';
import { ApiError } from './utils/ApiError';

export const sendJson = (res: ServerResponse, statusCode: number, body: unknown) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

export const setCors = (req: IncomingMessage, res: ServerResponse) => {
  const origin = req.headers.origin;
  if (origin && origin === env.appUrl) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', env.appUrl);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
};

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
