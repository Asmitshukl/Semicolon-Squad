import { OfficerVerificationStatus, Role } from '../../generated/prisma/enums';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { hashPassword } from '../../utils/hash';
import { ensureUniqueIdentity } from './shared.auth.service';

type OfficerRegistrationInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  badgeNumber: string;
  stationCode: string;
  rank?: string;
};

export const registerOfficer = async (input: OfficerRegistrationInput) => {
  await ensureUniqueIdentity(input.email, input.phone);

  const existingOfficer = await prisma.officer.findUnique({
    where: {
      badgeNumber: input.badgeNumber,
    },
  });

  if (existingOfficer) {
    throw new ApiError(409, 'An officer with this badge number already exists.');
  }

  const station = await prisma.policeStation.findUnique({
    where: {
      stationCode: input.stationCode,
    },
  });

  if (!station) {
    throw new ApiError(404, 'Police station not found for this station code.');
  }

  await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      passwordHash: hashPassword(input.password),
      role: Role.OFFICER,
      officer: {
        create: {
          badgeNumber: input.badgeNumber.trim().toUpperCase(),
          stationId: station.id,
          rank: input.rank?.trim() || 'Officer',
          department: station.district,
          verificationStatus: OfficerVerificationStatus.PENDING,
        },
      },
    },
  });

  return {
    message:
      'Officer registration submitted successfully. An admin must verify the account before login.',
  };
};

export const ensureOfficerPayload = (body: Record<string, unknown>) => {
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? '').trim();
  const password = String(body.password ?? '');
  const badgeNumber = String(body.badgeNumber ?? '').trim().toUpperCase();
  const stationCode = String(body.stationCode ?? '').trim().toUpperCase();
  const rank = body.rank ? String(body.rank).trim() : undefined;

  if (name.length < 2) {
    throw new ApiError(400, 'Full name is required.');
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, 'Enter a valid email address.');
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new ApiError(400, 'Enter a valid 10-digit Indian mobile number.');
  }

  if (badgeNumber.length < 3) {
    throw new ApiError(400, 'Badge number is required.');
  }

  if (stationCode.length < 3) {
    throw new ApiError(400, 'Station code is required.');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }

  return { name, email, phone, password, badgeNumber, stationCode, rank };
};
