"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiResponse = void 0;
const apiResponse = (data, message) => ({
    success: true,
    message,
    ...data,
});
exports.apiResponse = apiResponse;
