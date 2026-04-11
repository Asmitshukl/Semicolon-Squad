import { Role } from '../../generated/prisma/enums';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { hashPassword } from '../../utils/hash';
import { buildAuthResponse, ensureUniqueIdentity } from './shared.auth.service';

type AdminRegistrationInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  bootstrapKey?: string;
};

export const registerAdmin = async (input: AdminRegistrationInput) => {
  const adminCount = await prisma.user.count({
    where: {
      role: Role.ADMIN,
    },
  });

  if (adminCount > 0) {
    const expectedKey = process.env.ADMIN_BOOTSTRAP_KEY;
    if (!expectedKey || input.bootstrapKey !== expectedKey) {
      throw new ApiError(403, 'Admin registration is locked. Provide a valid bootstrap key.');
    }
  }

  await ensureUniqueIdentity(input.email, input.phone);

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      passwordHash: hashPassword(input.password),
      role: Role.ADMIN,
    },
    include: {
      officer: true,
    },
  });

  return buildAuthResponse(user);
};

export const ensureAdminPayload = (body: Record<string, unknown>) => {
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? '').trim();
  const password = String(body.password ?? '');
  const bootstrapKey = body.bootstrapKey ? String(body.bootstrapKey) : undefined;

  if (name.length < 2) {
    throw new ApiError(400, 'Full name must be at least 2 characters.');
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, 'Enter a valid email address.');
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new ApiError(400, 'Enter a valid 10-digit Indian mobile number.');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }

  return { name, email, phone, password, bootstrapKey };
};
