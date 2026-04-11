"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.victimStationsController = void 0;
const server_shared_1 = require("../../server.shared");
const station_service_1 = require("../../services/victim/station.service");
const victimStationsController = async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const query = url.searchParams.get('query') ?? undefined;
    const stations = await (0, station_service_1.listVictimStations)(query);
    (0, server_shared_1.sendJson)(res, 200, stations);
};
exports.victimStationsController = victimStationsController;
