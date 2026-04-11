import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export const getVictimCases = async (userId: string) =>
  prisma.fIR.findMany({
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

export const trackVictimCase = async (userId: string, acknowledgmentNo: string) => {
  const fir = await prisma.fIR.findFirst({
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
    throw new ApiError(404, 'No case found for this acknowledgment number.');
  }

  return fir;
};
