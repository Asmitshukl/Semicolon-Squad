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
        const routeKey = `${req.method ?? 'GET'} ${requestUrl.pathname}`;
        const handler = routes_1.routeMap.get(routeKey);
        if (!handler) {
            throw new ApiError_1.ApiError(404, 'Route not found.');
        }
        const body = req.method === 'GET' ? {} : await (0, server_shared_1.parseJsonBody)(req);
        await handler(req, res, body);
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
