"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const ApiError_1 = require("./utils/ApiError");
const server_shared_1 = require("./server.shared");
const routes_1 = require("./routes");
const app = async (req, res) => {
    (0, server_shared_1.setCors)(req, res);
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }
    try {
        const requestUrl = new URL(req.url ?? '/', 'http://localhost');
        const method = req.method ?? 'GET';
        const matchedRoute = (0, routes_1.matchRoute)(method, requestUrl.pathname);
        const query = Object.fromEntries(requestUrl.searchParams.entries());
        if (!matchedRoute) {
            throw new ApiError_1.ApiError(404, 'Route not found.');
        }
        let body = {
            ...query,
            ...matchedRoute.params,
        };
        if (method !== 'GET') {
            const contentType = req.headers['content-type'] ?? '';
            if (contentType.includes('multipart/form-data')) {
                const mp = await (0, server_shared_1.parseMultipartBody)(req);
                body = {
                    ...body,
                    __multipart: true,
                    ...mp.fields,
                    ...(mp.file
                        ? {
                            audioBuffer: mp.file.buffer,
                            audioMimeType: mp.file.mimeType,
                            audioFilename: mp.file.filename,
                        }
                        : {}),
                };
            }
            else {
                body = {
                    ...body,
                    ...(await (0, server_shared_1.parseJsonBody)(req)),
                };
            }
        }
        await matchedRoute.handler(req, res, body);
    }
    catch (error) {
        const statusCode = error instanceof ApiError_1.ApiError ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : 'Something went wrong on the server.';
        (0, server_shared_1.sendJson)(res, statusCode, {
            success: false,
            message,
        });
    }
};
exports.app = app;
