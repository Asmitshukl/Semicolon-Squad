"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutController = exports.meController = exports.refreshController = exports.loginController = void 0;
const enums_1 = require("../generated/prisma/enums");
const client_1 = require("../generated/prisma/client");
const database_1 = require("../config/database");
const hash_1 = require("../utils/hash");
const ApiError_1 = require("../utils/ApiError");
const databaseError_1 = require("../utils/databaseError");
const server_shared_1 = require("../server.shared");
const auth_shared_1 = require("./auth.shared");
const shared_auth_service_1 = require("../services/auth/shared.auth.service");
const jwt_1 = require("../utils/jwt");
const findUserForLogin = async (email) => database_1.prisma.user
    .findFirst({
    where: {
        email,
    },
    include: {
        officer: true,
    },
})
    .catch((error) => {
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        (0, databaseError_1.normalizeDatabaseError)(error);
    }
    (0, databaseError_1.normalizeDatabaseError)(error);
});
const loginController = async (req, res, body) => {
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new ApiError_1.ApiError(400, 'Enter a valid email address.');
    }
    if (!password) {
        throw new ApiError_1.ApiError(400, 'Password is required.');
    }
    const user = await findUserForLogin(email);
    if (!user || !(0, hash_1.verifyPassword)(password, user.passwordHash)) {
        throw new ApiError_1.ApiError(401, 'Invalid email or password.');
    }
    if (!user.isActive) {
        throw new ApiError_1.ApiError(403, 'This account is inactive. Please contact support.');
    }
    if (user.role === enums_1.Role.OFFICER &&
        user.officer?.verificationStatus !== enums_1.OfficerVerificationStatus.VERIFIED) {
        throw new ApiError_1.ApiError(403, 'Officer account is pending admin approval.');
    }
    const result = (0, shared_auth_service_1.buildAuthResponse)(user);
    (0, auth_shared_1.setAuthCookies)(res, result);
    (0, server_shared_1.sendJson)(res, 200, result);
};
exports.loginController = loginController;
const refreshController = async (req, res, body) => {
    const cookies = (0, server_shared_1.parseCookies)(req);
    const refreshToken = String(body.refreshToken ?? cookies.refreshToken ?? '');
    if (!refreshToken) {
        throw new ApiError_1.ApiError(401, 'Refresh token is required.');
    }
    const tokenPayload = (0, jwt_1.verifyRefreshToken)(refreshToken);
    const user = await database_1.prisma.user
        .findUnique({
        where: {
            id: tokenPayload.sub,
        },
        include: {
            officer: true,
        },
    })
        .catch((error) => (0, databaseError_1.normalizeDatabaseError)(error));
    if (!user || !user.isActive) {
        throw new ApiError_1.ApiError(401, 'Session is no longer valid.');
    }
    if (user.role === enums_1.Role.OFFICER &&
        user.officer?.verificationStatus !== enums_1.OfficerVerificationStatus.VERIFIED) {
        throw new ApiError_1.ApiError(403, 'Officer account is pending admin approval.');
    }
    const result = (0, shared_auth_service_1.buildAuthResponse)(user);
    (0, auth_shared_1.setAuthCookies)(res, result);
    (0, server_shared_1.sendJson)(res, 200, result);
};
exports.refreshController = refreshController;
const meController = async (req, res) => {
    const authHeader = req.headers.authorization;
    const cookies = (0, server_shared_1.parseCookies)(req);
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const accessToken = bearerToken || cookies.accessToken;
    if (!accessToken) {
        throw new ApiError_1.ApiError(401, 'Authentication required.');
    }
    const tokenPayload = (0, jwt_1.verifyAccessToken)(accessToken);
    const user = await database_1.prisma.user
        .findUnique({
        where: {
            id: tokenPayload.sub,
        },
        include: {
            officer: true,
        },
    })
        .catch((error) => (0, databaseError_1.normalizeDatabaseError)(error));
    if (!user) {
        throw new ApiError_1.ApiError(404, 'User not found.');
    }
    (0, server_shared_1.sendJson)(res, 200, (0, shared_auth_service_1.toSafeUser)(user));
};
exports.meController = meController;
const logoutController = async (_req, res) => {
    (0, auth_shared_1.clearAuthCookies)(res);
    (0, server_shared_1.sendJson)(res, 200, { success: true, message: 'Logged out successfully.' });
};
exports.logoutController = logoutController;
