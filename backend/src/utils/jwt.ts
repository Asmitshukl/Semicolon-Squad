import { createHmac } from 'node:crypto';
import { env } from '../config/env';

type TokenKind = 'access' | 'refresh';

type BaseTokenPayload = {
  sub: string;
  role: 'victim' | 'officer' | 'admin';
  kind: TokenKind;
  exp: number;
};

const base64UrlEncode = (value: string) => Buffer.from(value).toString('base64url');
const base64UrlDecode = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

const sign = (value: string, secret: string) =>
  createHmac('sha256', secret).update(value).digest('base64url');

const issueToken = (
  payload: Omit<BaseTokenPayload, 'kind' | 'exp'>,
  kind: TokenKind,
  secret: string,
  ttlSeconds: number,
) => {
  const body: BaseTokenPayload = {
    ...payload,
    kind,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = base64UrlEncode(JSON.stringify(body));
  const signature = sign(encoded, secret);
  return `${encoded}.${signature}`;
};

const verifyToken = (token: string, secret: string, expectedKind: TokenKind): BaseTokenPayload => {
  const [encoded, signature] = token.split('.');

  if (!encoded || !signature) {
    throw new Error('Malformed token');
  }

  const expectedSignature = sign(encoded, secret);
  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(base64UrlDecode(encoded)) as BaseTokenPayload;

  if (payload.kind !== expectedKind) {
    throw new Error('Invalid token kind');
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
};

export const createAccessToken = (payload: Omit<BaseTokenPayload, 'kind' | 'exp'>) =>
  issueToken(payload, 'access', env.jwtAccessSecret, env.accessTokenTtlSeconds);

export const createRefreshToken = (payload: Omit<BaseTokenPayload, 'kind' | 'exp'>) =>
  issueToken(payload, 'refresh', env.jwtRefreshSecret, env.refreshTokenTtlSeconds);

export const verifyAccessToken = (token: string) =>
  verifyToken(token, env.jwtAccessSecret, 'access');

export const verifyRefreshToken = (token: string) =>
  verifyToken(token, env.jwtRefreshSecret, 'refresh');
