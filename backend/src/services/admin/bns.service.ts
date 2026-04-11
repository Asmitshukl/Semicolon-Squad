import { prisma } from '../../config/database';

export const listAdminBnsSections = async (query?: string) =>
  prisma.bNSSection.findMany({
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
