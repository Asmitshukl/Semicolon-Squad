import type { IncomingMessage } from 'node:http';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { parseCookies } from '../server.shared';
import { verifyAccessToken } from '../utils/jwt';
import { Role } from '../generated/prisma/enums';

export const getAuthenticatedUser = async (
  req: IncomingMessage,
  allowedRoles?: Role[],
) => {
  const authHeader = req.headers.authorization;
  const cookies = parseCookies(req);
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const accessToken = bearerToken || cookies.accessToken;

  if (!accessToken) {
    throw new ApiError(401, 'Authentication required.');
  }

  const tokenPayload = verifyAccessToken(accessToken);
  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.sub },
    include: { officer: true },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Session is no longer valid.');
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new ApiError(403, 'You are not allowed to access this resource.');
  }

  return user;
};
