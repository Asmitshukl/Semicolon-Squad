"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.env = void 0;
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: node_path_1.default.resolve(process.cwd(), '.env') });
(0, dotenv_1.config)({ path: node_path_1.default.resolve(process.cwd(), '..', '.env'), override: false });
const readNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const readBoolean = (value, fallback) => {
    if (value == null) {
        return fallback;
    }
    return value === 'true' || value === '1';
};
const splitOrigins = (raw) => (raw ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: readNumber(process.env.PORT, 5000),
    appUrl: (process.env.APP_URL ?? 'http://localhost:5173').trim().replace(/\/$/, ''),
    /** Extra allowed browser origins for CORS (comma-separated), in addition to `appUrl`. */
    corsOrigins: splitOrigins(process.env.CORS_ORIGINS),
    /** Base URL of the Python ML service (Whisper → NER → IndicBERT → rights). No trailing slash. */
    mlServiceUrl: (process.env.ML_SERVICE_URL ?? '').trim().replace(/\/$/, ''),
    mlServiceTimeoutMs: readNumber(process.env.ML_SERVICE_TIMEOUT_MS, 120_000),
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
    accessTokenTtlSeconds: readNumber(process.env.ACCESS_TOKEN_TTL_SECONDS, 60 * 15),
    refreshTokenTtlSeconds: readNumber(process.env.REFRESH_TOKEN_TTL_SECONDS, 60 * 60 * 24 * 7),
    cookieSecure: readBoolean(process.env.COOKIE_SECURE, false),
};
exports.isProduction = exports.env.nodeEnv === 'production';
