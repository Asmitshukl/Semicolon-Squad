"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCookies = exports.parseJsonBody = exports.parseMultipartBody = exports.setCors = exports.sendJson = void 0;
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
const readRequestBuffer = async (req) => {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
};
const parseMultipartBody = async (req) => (async () => {
    const ct = req.headers['content-type'] ?? '';
    if (!ct.includes('multipart/form-data')) {
        throw new ApiError_1.ApiError(400, 'Expected multipart/form-data.');
    }
    const boundaryMatch = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];
    if (!boundary) {
        throw new ApiError_1.ApiError(400, 'Multipart boundary is missing.');
    }
    const body = await readRequestBuffer(req);
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const fields = {};
    let file;
    let searchFrom = 0;
    while (searchFrom < body.length) {
        const start = body.indexOf(boundaryBuffer, searchFrom);
        if (start === -1)
            break;
        const partStart = start + boundaryBuffer.length;
        const trailer = body.subarray(partStart, partStart + 2).toString('utf8');
        if (trailer === '--')
            break;
        const contentStart = partStart + 2;
        const nextBoundary = body.indexOf(boundaryBuffer, contentStart);
        if (nextBoundary === -1)
            break;
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
        }
        else {
            fields[fieldName] = content.toString('utf8');
        }
        searchFrom = nextBoundary;
    }
    return { fields, file };
})();
exports.parseMultipartBody = parseMultipartBody;
const parseJsonBody = async (req) => {
    const body = await readRequestBuffer(req);
    if (body.length === 0) {
        return {};
    }
    try {
        return JSON.parse(body.toString('utf8'));
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
