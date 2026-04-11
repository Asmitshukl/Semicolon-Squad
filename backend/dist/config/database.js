"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../generated/prisma/client");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to start the backend.');
}
exports.prisma = globalThis.__prisma__ ??
    new client_1.PrismaClient({
        adapter: new adapter_pg_1.PrismaPg(databaseUrl),
    });
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma__ = exports.prisma;
}
