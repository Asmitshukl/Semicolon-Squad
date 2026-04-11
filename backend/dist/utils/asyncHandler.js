"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
const asyncHandler = (fn) => {
    return async (req, res, body) => {
        try {
            await fn(req, res, body);
        }
        catch (error) {
            // Let the error middleware handle it
            throw error;
        }
    };
};
exports.asyncHandler = asyncHandler;
