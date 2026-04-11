"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackVictimCase = exports.getVictimCases = void 0;
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const getVictimCases = async (userId) => database_1.prisma.fIR.findMany({
    where: { victimId: userId },
    include: {
        station: true,
        bnsSections: true,
        caseUpdates: {
            orderBy: { createdAt: 'desc' },
        },
    },
    orderBy: { createdAt: 'desc' },
});
exports.getVictimCases = getVictimCases;
const trackVictimCase = async (userId, acknowledgmentNo) => {
    const fir = await database_1.prisma.fIR.findFirst({
        where: {
            victimId: userId,
            acknowledgmentNo,
        },
        include: {
            station: true,
            bnsSections: true,
            caseUpdates: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });
    if (!fir) {
        throw new ApiError_1.ApiError(404, 'No case found for this acknowledgment number.');
    }
    return fir;
};
exports.trackVictimCase = trackVictimCase;
