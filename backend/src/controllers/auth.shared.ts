import type { ServerResponse } from 'node:http';
import { env, isProduction } from '../config/env';
import type { AuthSuccessResponse } from '../types/auth.types';

const cookieBase = [
  'Path=/',
  'SameSite=Lax',
  env.cookieSecure || isProduction ? 'Secure' : '',
]
  .filter(Boolean)
  .join('; ');

const buildCookie = (name: string, value: string, maxAgeSeconds: number, httpOnly = true) =>
  `${name}=${encodeURIComponent(value)}; ${cookieBase}; Max-Age=${maxAgeSeconds}; ${
    httpOnly ? 'HttpOnly; ' : ''
  }`;

export const setAuthCookies = (res: ServerResponse, payload: AuthSuccessResponse) => {
  res.setHeader('Set-Cookie', [
    buildCookie('accessToken', payload.token, env.accessTokenTtlSeconds),
    buildCookie('refreshToken', payload.refreshToken, env.refreshTokenTtlSeconds),
  ]);
};

export const clearAuthCookies = (res: ServerResponse) => {
  res.setHeader('Set-Cookie', [
    `${buildCookie('accessToken', '', 0)}`,
    `${buildCookie('refreshToken', '', 0)}`,
  ]);
};
