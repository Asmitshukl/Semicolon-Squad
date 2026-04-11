"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = exports.hashPassword = void 0;
const node_crypto_1 = require("node:crypto");
const KEY_LENGTH = 64;
const hashPassword = (password) => {
    const salt = (0, node_crypto_1.randomBytes)(16).toString('hex');
    const hash = (0, node_crypto_1.scryptSync)(password, salt, KEY_LENGTH).toString('hex');
    return `${salt}:${hash}`;
};
exports.hashPassword = hashPassword;
const verifyPassword = (password, passwordHash) => {
    const [salt, storedHash] = passwordHash.split(':');
    if (!salt || !storedHash) {
        return false;
    }
    const derivedHash = (0, node_crypto_1.scryptSync)(password, salt, KEY_LENGTH);
    const storedHashBuffer = Buffer.from(storedHash, 'hex');
    if (derivedHash.length !== storedHashBuffer.length) {
        return false;
    }
    return (0, node_crypto_1.timingSafeEqual)(derivedHash, storedHashBuffer);
};
exports.verifyPassword = verifyPassword;
