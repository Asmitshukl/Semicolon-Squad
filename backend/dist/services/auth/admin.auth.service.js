"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAdminPayload = exports.registerAdmin = void 0;
const enums_1 = require("../../generated/prisma/enums");
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const hash_1 = require("../../utils/hash");
const shared_auth_service_1 = require("./shared.auth.service");
const registerAdmin = async (input) => {
    const adminCount = await database_1.prisma.user.count({
        where: {
            role: enums_1.Role.ADMIN,
        },
    });
    if (adminCount > 0) {
        const expectedKey = process.env.ADMIN_BOOTSTRAP_KEY;
        if (!expectedKey || input.bootstrapKey !== expectedKey) {
            throw new ApiError_1.ApiError(403, 'Admin registration is locked. Provide a valid bootstrap key.');
        }
    }
    await (0, shared_auth_service_1.ensureUniqueIdentity)(input.email, input.phone);
    const user = await database_1.prisma.user.create({
        data: {
            name: input.name.trim(),
            email: input.email.trim().toLowerCase(),
            phone: input.phone.trim(),
            passwordHash: (0, hash_1.hashPassword)(input.password),
            role: enums_1.Role.ADMIN,
        },
        include: {
            officer: true,
        },
    });
    return (0, shared_auth_service_1.buildAuthResponse)(user);
};
exports.registerAdmin = registerAdmin;
const ensureAdminPayload = (body) => {
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phone = String(body.phone ?? '').trim();
    const password = String(body.password ?? '');
    const bootstrapKey = body.bootstrapKey ? String(body.bootstrapKey) : undefined;
    if (name.length < 2) {
        throw new ApiError_1.ApiError(400, 'Full name must be at least 2 characters.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new ApiError_1.ApiError(400, 'Enter a valid email address.');
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
        throw new ApiError_1.ApiError(400, 'Enter a valid 10-digit Indian mobile number.');
    }
    if (password.length < 8) {
        throw new ApiError_1.ApiError(400, 'Password must be at least 8 characters.');
    }
    return { name, email, phone, password, bootstrapKey };
};
exports.ensureAdminPayload = ensureAdminPayload;
