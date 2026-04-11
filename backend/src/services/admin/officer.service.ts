import { OfficerVerificationStatus, Role } from '../../generated/prisma/enums';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export const listAdminOfficers = async (status?: string) => {
  const normalizedStatus = status?.toUpperCase();
  const where =
    normalizedStatus &&
    Object.values(OfficerVerificationStatus).includes(
      normalizedStatus as OfficerVerificationStatus,
    )
      ? {
          verificationStatus: normalizedStatus as OfficerVerificationStatus,
        }
      : undefined;

  const officers = await prisma.officer.findMany({
    where,
    include: {
      user: true,
      station: true,
    },
    orderBy: [{ verificationStatus: 'asc' }, { createdAt: 'desc' }],
  });

  return officers.map((officer) => ({
    id: officer.id,
    badgeNumber: officer.badgeNumber,
    rank: officer.rank,
    department: officer.department,
    verificationStatus: officer.verificationStatus,
    verifiedAt: officer.verifiedAt,
    createdAt: officer.createdAt,
    user: {
      id: officer.user.id,
      name: officer.user.name,
      email: officer.user.email,
      phone: officer.user.phone,
      isActive: officer.user.isActive,
      role: officer.user.role.toLowerCase(),
    },
    station: {
      id: officer.station.id,
      name: officer.station.name,
      stationCode: officer.station.stationCode,
      district: officer.station.district,
      state: officer.station.state,
    },
  }));
};

export const reviewOfficerRegistration = async (
  officerId: string,
  adminUserId: string,
  action: 'approve' | 'reject',
) => {
  const officer = await prisma.officer.findUnique({
    where: {
      id: officerId,
    },
    include: {
      user: true,
      station: true,
    },
  });

  if (!officer) {
    throw new ApiError(404, 'Officer registration not found.');
  }

  const verificationStatus =
    action === 'approve'
      ? OfficerVerificationStatus.VERIFIED
      : OfficerVerificationStatus.REJECTED;

  const updatedOfficer = await prisma.officer.update({
    where: {
      id: officerId,
    },
    data: {
      verificationStatus,
      verifiedAt: action === 'approve' ? new Date() : null,
      verifiedByAdminId: adminUserId,
      user: {
        update: {
          isActive: action === 'approve',
          role: Role.OFFICER,
        },
      },
    },
    include: {
      user: true,
      station: true,
    },
  });

  return {
    id: updatedOfficer.id,
    verificationStatus: updatedOfficer.verificationStatus,
    verifiedAt: updatedOfficer.verifiedAt,
    user: {
      id: updatedOfficer.user.id,
      name: updatedOfficer.user.name,
      email: updatedOfficer.user.email,
      isActive: updatedOfficer.user.isActive,
    },
    station: {
      id: updatedOfficer.station.id,
      name: updatedOfficer.station.name,
      stationCode: updatedOfficer.station.stationCode,
    },
  };
};
