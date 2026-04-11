"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listVictimStations = void 0;
const database_1 = require("../../config/database");
const catalog_service_1 = require("./catalog.service");
const statePortals = {
    Maharashtra: 'https://citizen.mahapolice.gov.in',
    Delhi: 'https://delhipolice.gov.in',
    'Tamil Nadu': 'https://eservices.tnpolice.gov.in',
};
const listVictimStations = async (query) => {
    await (0, catalog_service_1.ensureVictimCatalog)();
    const stations = await database_1.prisma.policeStation.findMany({
        where: query
            ? {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { district: { contains: query, mode: 'insensitive' } },
                    { state: { contains: query, mode: 'insensitive' } },
                    { stationCode: { contains: query, mode: 'insensitive' } },
                ],
            }
            : undefined,
        orderBy: [{ state: 'asc' }, { district: 'asc' }, { name: 'asc' }],
        take: 20,
    });
    return stations.map((station) => ({
        ...station,
        onlineFirPortal: statePortals[station.state] ?? null,
    }));
};
exports.listVictimStations = listVictimStations;
