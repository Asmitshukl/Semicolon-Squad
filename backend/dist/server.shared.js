"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCookies = exports.parseJsonBody = exports.setCors = exports.sendJson = void 0;
const env_1 = require("./config/env");
const ApiError_1 = require("./utils/ApiError");
const sendJson = (res, statusCode, body) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
};
exports.sendJson = sendJson;
const setCors = (req, res) => {
    const origin = req.headers.origin;
    if (origin && origin === env_1.env.appUrl) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    else {
        res.setHeader('Access-Control-Allow-Origin', env_1.env.appUrl);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
};
exports.setCors = setCors;
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
