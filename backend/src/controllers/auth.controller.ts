import type { IncomingMessage, ServerResponse } from 'node:http';
import { OfficerVerificationStatus, Role } from '../generated/prisma/enums';
import { PrismaClientKnownRequestError } from '../generated/prisma/internal/prismaNamespace';
import { prisma } from '../config/database';
import { verifyPassword } from '../utils/hash';
import { ApiError } from '../utils/ApiError';
import { sendJson, parseCookies } from '../server.shared';
import { clearAuthCookies, setAuthCookies } from './auth.shared';
import { buildAuthResponse, toSafeUser } from '../services/auth/shared.auth.service';
import { verifyAccessToken, verifyRefreshToken } from '../utils/jwt';

const findUserForLogin = async (email: string) =>
  prisma.user
    .findUnique({
      where: {
        email,
      },
      include: {
        officer: true,
      },
    })
    .catch((error: unknown) => {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2021'
      ) {
        throw new ApiError(
          500,
          'Database tables are missing. Run the Prisma schema sync before using auth.',
        );
      }

      throw error;
    });

export const loginController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, 'Enter a valid email address.');
  }

  if (!password) {
    throw new ApiError(400, 'Password is required.');
  }

  const user = await findUserForLogin(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account is inactive. Please contact support.');
  }

  if (
    user.role === Role.OFFICER &&
    user.officer?.verificationStatus !== OfficerVerificationStatus.VERIFIED
  ) {
    throw new ApiError(403, 'Officer account is pending admin approval.');
  }

  const result = buildAuthResponse(user);
  setAuthCookies(res, result);
  sendJson(res, 200, result);
};

export const refreshController = async (
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>,
) => {
  const cookies = parseCookies(req);
  const refreshToken = String(body.refreshToken ?? cookies.refreshToken ?? '');

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required.');
  }

  const tokenPayload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({
    where: {
      id: tokenPayload.sub,
    },
    include: {
      officer: true,
    },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Session is no longer valid.');
  }

  if (
    user.role === Role.OFFICER &&
    user.officer?.verificationStatus !== OfficerVerificationStatus.VERIFIED
  ) {
    throw new ApiError(403, 'Officer account is pending admin approval.');
  }

  const result = buildAuthResponse(user);
  setAuthCookies(res, result);
  sendJson(res, 200, result);
};

export const meController = async (req: IncomingMessage, res: ServerResponse) => {
  const authHeader = req.headers.authorization;
  const cookies = parseCookies(req);
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const accessToken = bearerToken || cookies.accessToken;

  if (!accessToken) {
    throw new ApiError(401, 'Authentication required.');
  }

  const tokenPayload = verifyAccessToken(accessToken);
  const user = await prisma.user.findUnique({
    where: {
      id: tokenPayload.sub,
    },
    include: {
      officer: true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  sendJson(res, 200, toSafeUser(user));
};

export const logoutController = async (_req: IncomingMessage, res: ServerResponse) => {
  clearAuthCookies(res);
  sendJson(res, 200, { success: true, message: 'Logged out successfully.' });
};
