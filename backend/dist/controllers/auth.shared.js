"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthCookies = exports.setAuthCookies = void 0;
const env_1 = require("../config/env");
const cookieBase = [
    'Path=/',
    'SameSite=Lax',
    env_1.env.cookieSecure || env_1.isProduction ? 'Secure' : '',
]
    .filter(Boolean)
    .join('; ');
const buildCookie = (name, value, maxAgeSeconds, httpOnly = true) => `${name}=${encodeURIComponent(value)}; ${cookieBase}; Max-Age=${maxAgeSeconds}; ${httpOnly ? 'HttpOnly; ' : ''}`;
const setAuthCookies = (res, payload) => {
    res.setHeader('Set-Cookie', [
        buildCookie('accessToken', payload.token, env_1.env.accessTokenTtlSeconds),
        buildCookie('refreshToken', payload.refreshToken, env_1.env.refreshTokenTtlSeconds),
    ]);
};
exports.setAuthCookies = setAuthCookies;
const clearAuthCookies = (res) => {
    res.setHeader('Set-Cookie', [
        `${buildCookie('accessToken', '', 0)}`,
        `${buildCookie('refreshToken', '', 0)}`,
    ]);
};
exports.clearAuthCookies = clearAuthCookies;
