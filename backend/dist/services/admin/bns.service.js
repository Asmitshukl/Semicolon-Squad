"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAdminBnsSections = void 0;
const database_1 = require("../../config/database");
const listAdminBnsSections = async (query) => database_1.prisma.bNSSection.findMany({
    where: query
        ? {
            OR: [
                { sectionNumber: { contains: query, mode: 'insensitive' } },
                { sectionTitle: { contains: query, mode: 'insensitive' } },
                { ipcEquivalent: { contains: query, mode: 'insensitive' } },
            ],
        }
        : undefined,
    orderBy: [{ sectionNumber: 'asc' }],
    take: 100,
});
exports.listAdminBnsSections = listAdminBnsSections;
