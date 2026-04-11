import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../../server.shared';
import { listVictimStations } from '../../services/victim/station.service';

export const victimStationsController = async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const query = url.searchParams.get('query') ?? undefined;
  const stations = await listVictimStations(query);
  sendJson(res, 200, stations);
};
