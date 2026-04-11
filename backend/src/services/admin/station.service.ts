import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export const listAdminStations = async () =>
  prisma.policeStation.findMany({
    orderBy: [{ state: 'asc' }, { district: 'asc' }, { name: 'asc' }],
  });

export const createAdminStation = async (payload: {
  name: string;
  stationCode: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  jurisdictionArea?: string;
}) => {
  if (!payload.name.trim()) {
    throw new ApiError(400, 'Station name is required.');
  }

  if (!payload.stationCode.trim()) {
    throw new ApiError(400, 'Station code is required.');
  }

  return prisma.policeStation.create({
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
