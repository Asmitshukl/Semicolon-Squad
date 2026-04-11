"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecureOTP = exports.generateOTP = void 0;
const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
};
exports.generateOTP = generateOTP;
const generateSecureOTP = (length = 6) => {
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += (array[i] % 10).toString();
    }
    return otp;
};
exports.generateSecureOTP = generateSecureOTP;
