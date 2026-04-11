import { OfficerVerificationStatus } from '../../generated/prisma/enums';
import { prisma } from '../../config/database';

export const getAdminDashboard = async () => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [pendingOfficerActions, policeStations, firsFiled24h, bnsSectionsLive, recentOfficers] =
    await Promise.all([
      prisma.officer.count({
        where: {
          verificationStatus: OfficerVerificationStatus.PENDING,
        },
      }),
      prisma.policeStation.count(),
      prisma.fIR.count({
        where: {
          createdAt: {
            gte: since,
          },
        },
      }),
      prisma.bNSSection.count(),
      prisma.officer.findMany({
        include: {
          user: true,
          station: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ]);

  return {
    stats: {
      pendingOfficerActions,
      policeStations,
      firsFiled24h,
      bnsSectionsLive,
    },
    recentOfficers: recentOfficers.map((officer) => ({
      id: officer.id,
      badgeNumber: officer.badgeNumber,
      verificationStatus: officer.verificationStatus,
      submittedAt: officer.createdAt,
      name: officer.user.name,
      stationName: officer.station.name,
    })),
    systemStatus: {
      lastSync: new Date().toISOString(),
      apiGateway: 'Nominal',
      auditLogStream: 'CCTNS-LINK-READY',
    },
  };
};
