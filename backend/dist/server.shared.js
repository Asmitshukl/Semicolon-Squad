"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCookies = exports.parseJsonBody = exports.parseMultipartBody = exports.setCors = exports.sendJson = void 0;
const busboy_1 = __importDefault(require("busboy"));
const env_1 = require("./config/env");
const ApiError_1 = require("./utils/ApiError");
const sendJson = (res, statusCode, body) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
};
exports.sendJson = sendJson;
const localhostOriginOk = (o) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(o);
const originIsAllowed = (origin) => {
    if (!origin)
        return false;
    if (origin === env_1.env.appUrl)
        return true;
    if (env_1.env.corsOrigins.includes(origin))
        return true;
    /* Vite often runs on 5174–5177; echoing the real Origin is required for credentialed requests. */
    if (!env_1.isProduction && localhostOriginOk(origin))
        return true;
    return false;
};
const setCors = (req, res) => {
    const origin = req.headers.origin;
    if (originIsAllowed(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
};
exports.setCors = setCors;
const parseMultipartBody = async (req) => new Promise((resolve, reject) => {
    const ct = req.headers['content-type'] ?? '';
    if (!ct.includes('multipart/form-data')) {
        reject(new ApiError_1.ApiError(400, 'Expected multipart/form-data.'));
        return;
    }
    const bb = (0, busboy_1.default)({ headers: req.headers });
    const fields = {};
    const chunks = [];
    let filename = 'recording.webm';
    let mimeType = 'audio/webm';
    bb.on('file', (name, file, info) => {
        if (name !== 'audio') {
            file.resume();
            return;
        }
        filename = info.filename || filename;
        mimeType = info.mimeType || mimeType;
        file.on('data', (data) => {
            chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
        });
    });
    bb.on('field', (name, val) => {
        fields[name] = val;
    });
    bb.on('error', (err) => reject(err));
    bb.on('finish', () => {
        resolve({
            fields,
            file: chunks.length ? { buffer: Buffer.concat(chunks), filename, mimeType } : undefined,
        });
    });
    req.pipe(bb);
});
exports.parseMultipartBody = parseMultipartBody;
const parseJsonBody = async (req) => {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length === 0) {
        return {};
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
    catch {
        throw new ApiError_1.ApiError(400, 'Request body must be valid JSON.');
    }
};
exports.parseJsonBody = parseJsonBody;
const parseCookies = (req) => {
    const rawCookie = req.headers.cookie;
    if (!rawCookie) {
        return {};
    }
    return rawCookie.split(';').reduce((cookies, pair) => {
        const [rawName, ...valueParts] = pair.trim().split('=');
        if (!rawName) {
            return cookies;
        }
        cookies[rawName] = decodeURIComponent(valueParts.join('='));
        return cookies;
    }, {});
};
exports.parseCookies = parseCookies;
