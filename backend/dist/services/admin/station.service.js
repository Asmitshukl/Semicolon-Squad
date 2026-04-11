"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminStation = exports.listAdminStations = void 0;
const database_1 = require("../../config/database");
const ApiError_1 = require("../../utils/ApiError");
const listAdminStations = async () => database_1.prisma.policeStation.findMany({
    orderBy: [{ state: 'asc' }, { district: 'asc' }, { name: 'asc' }],
});
exports.listAdminStations = listAdminStations;
const createAdminStation = async (payload) => {
    if (!payload.name.trim()) {
        throw new ApiError_1.ApiError(400, 'Station name is required.');
    }
    if (!payload.stationCode.trim()) {
        throw new ApiError_1.ApiError(400, 'Station code is required.');
    }
    return database_1.prisma.policeStation.create({
        data: {
            name: payload.name.trim(),
            stationCode: payload.stationCode.trim().toUpperCase(),
            address: payload.address.trim(),
            district: payload.district.trim(),
            state: payload.state.trim(),
            pincode: payload.pincode.trim(),
            latitude: payload.latitude,
            longitude: payload.longitude,
            phone: payload.phone.trim(),
            email: payload.email?.trim() || null,
            jurisdictionArea: payload.jurisdictionArea?.trim() || null,
        },
    });
};
exports.createAdminStation = createAdminStation;
