"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthenticatedUser = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const server_shared_1 = require("../server.shared");
const jwt_1 = require("../utils/jwt");
const getAuthenticatedUser = async (req, allowedRoles) => {
    const authHeader = req.headers.authorization;
    const cookies = (0, server_shared_1.parseCookies)(req);
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const accessToken = bearerToken || cookies.accessToken;
    if (!accessToken) {
        throw new ApiError_1.ApiError(401, 'Authentication required.');
    }
    const tokenPayload = (0, jwt_1.verifyAccessToken)(accessToken);
    const user = await database_1.prisma.user.findUnique({
        where: { id: tokenPayload.sub },
        include: { officer: true },
    });
    if (!user || !user.isActive) {
        throw new ApiError_1.ApiError(401, 'Session is no longer valid.');
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        throw new ApiError_1.ApiError(403, 'You are not allowed to access this resource.');
    }
    return user;
};
exports.getAuthenticatedUser = getAuthenticatedUser;
