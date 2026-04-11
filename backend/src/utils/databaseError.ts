import { ApiError } from './ApiError';

type KnownDatabaseError = {
  code?: string;
  message?: string;
};

export const normalizeDatabaseError = (error: unknown): never => {
  const dbError = error as KnownDatabaseError;

  if (dbError?.code === 'P2021') {
    throw new ApiError(
      500,
      'Database tables are missing. Run the Prisma schema sync before using auth.',
    );
  }

  if (dbError?.code === 'ETIMEDOUT' || dbError?.code === 'EAI_AGAIN') {
    throw new ApiError(
      503,
      'Database connection failed. Check DATABASE_URL, internet access, and whether the remote database is reachable.',
    );
  }

  if (error instanceof Error) {
    throw new ApiError(500, error.message);
  }

  throw new ApiError(500, 'Database request failed.');
};
