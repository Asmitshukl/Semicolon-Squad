import { prisma } from '../../config/database';
import { ensureVictimCatalog } from './catalog.service';

const statePortals: Record<string, string> = {
  Maharashtra: 'https://citizen.mahapolice.gov.in',
  Delhi: 'https://delhipolice.gov.in',
  'Tamil Nadu': 'https://eservices.tnpolice.gov.in',
};

export const listVictimStations = async (query?: string) => {
  await ensureVictimCatalog();

  const stations = await prisma.policeStation.findMany({
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
