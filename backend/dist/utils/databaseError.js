"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDatabaseError = void 0;
const ApiError_1 = require("./ApiError");
const normalizeDatabaseError = (error) => {
    const dbError = error;
    if (dbError?.code === 'P2021') {
        throw new ApiError_1.ApiError(500, 'Database tables are missing. Run the Prisma schema sync before using auth.');
    }
    if (dbError?.code === 'ETIMEDOUT' || dbError?.code === 'EAI_AGAIN') {
        throw new ApiError_1.ApiError(503, 'Database connection failed. Check DATABASE_URL, internet access, and whether the remote database is reachable.');
    }
    if (error instanceof Error) {
        throw new ApiError_1.ApiError(500, error.message);
    }
    throw new ApiError_1.ApiError(500, 'Database request failed.');
};
exports.normalizeDatabaseError = normalizeDatabaseError;
