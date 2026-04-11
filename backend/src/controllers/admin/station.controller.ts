import type { IncomingMessage, ServerResponse } from 'node:http';
import { Role } from '../../generated/prisma/enums';
import { getAuthenticatedUser } from '../../middleware/auth.middleware';
import { sendJson } from '../../server.shared';
import {
  createAdminStation,
  listAdminStations,
} from '../../services/admin/station.service';

export const adminStationListController = async (
  req: IncomingMessage,
  res: ServerResponse,
) => {
  await getAuthenticatedUser(req, [Role.ADMIN]);
  const stations = await listAdminStations();
  sendJson(res, 200, stations);
};

export const adminStationCreateController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  await getAuthenticatedUser(req, [Role.ADMIN]);
  const station = await createAdminStation({
    name: String(body.name ?? ''),
    stationCode: String(body.stationCode ?? ''),
    address: String(body.address ?? ''),
    district: String(body.district ?? ''),
    state: String(body.state ?? ''),
    pincode: String(body.pincode ?? ''),
    latitude: Number(body.latitude ?? 0),
    longitude: Number(body.longitude ?? 0),
    phone: String(body.phone ?? ''),
    email: body.email ? String(body.email) : undefined,
    jurisdictionArea: body.jurisdictionArea ? String(body.jurisdictionArea) : undefined,
  });

  sendJson(res, 201, station);
};
