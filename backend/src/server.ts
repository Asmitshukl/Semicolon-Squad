import { createServer } from 'node:http';
import { env } from './config/env';
import { prisma } from './config/database';
import { app } from './app';

const server = createServer(app);

const start = async () => {
  await prisma.$connect();

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend server listening on http://localhost:${env.port}`);
  });
};

void start();
