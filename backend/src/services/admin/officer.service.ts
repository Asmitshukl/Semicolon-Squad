import { OfficerVerificationStatus, Role } from '../../generated/prisma/enums';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { hashPassword } from '../../utils/hash';
import { ensureUniqueIdentity } from '../auth/shared.auth.service';

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

/**
 * Create a new officer account from the admin dashboard.
 * The officer is immediately VERIFIED and active — no approval queue needed.
 */
export const adminCreateOfficer = async (
  input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    badgeNumber: string;
    stationCode: string;
    rank?: string;
  },
  adminId: string,
) => {
  await ensureUniqueIdentity(input.email, input.phone);

  const existingOfficer = await prisma.officer.findUnique({
    where: { badgeNumber: input.badgeNumber.trim().toUpperCase() },
  });
  if (existingOfficer) {
    throw new ApiError(409, 'An officer with this badge number already exists.');
  }

  const station = await prisma.policeStation.findUnique({
    where: { stationCode: input.stationCode.trim().toUpperCase() },
  });
  if (!station) {
    throw new ApiError(404, 'Police station not found for this station code.');
  }

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      passwordHash: hashPassword(input.password),
      role: Role.OFFICER,
      isActive: true,
      officer: {
        create: {
          badgeNumber: input.badgeNumber.trim().toUpperCase(),
          stationId: station.id,
          rank: input.rank?.trim() || 'Officer',
          department: station.district,
          verificationStatus: OfficerVerificationStatus.VERIFIED,
          verifiedAt: new Date(),
          verifiedByAdminId: adminId,
        },
      },
    },
    include: {
      officer: {
        include: { station: true },
      },
    },
  });

  const officer = user.officer!;
  return {
    id: officer.id,
    badgeNumber: officer.badgeNumber,
    rank: officer.rank,
    department: officer.department,
    verificationStatus: officer.verificationStatus,
    verifiedAt: officer.verifiedAt,
    createdAt: officer.createdAt,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      role: user.role.toLowerCase(),
    },
    station: {
      id: officer.station.id,
      name: officer.station.name,
      stationCode: officer.station.stationCode,
      district: officer.station.district,
      state: officer.station.state,
    },
  };
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
