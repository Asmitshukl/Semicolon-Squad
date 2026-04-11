const path = require('node:path');
const { config: loadEnv } = require('dotenv');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../dist/generated/prisma/client.js');
const { hashPassword } = require('../dist/utils/hash.js');

loadEnv({ path: path.resolve(__dirname, '..', '.env') });
loadEnv({ path: path.resolve(__dirname, '..', '..', '.env'), override: false });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const readArg = (name) => {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : '';
};

const fallbackAdmin = {
  name: process.env.DEFAULT_ADMIN_NAME || 'Admin User',
  email: (process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com').toLowerCase(),
  phone: process.env.DEFAULT_ADMIN_PHONE || '9876543210',
  password: process.env.DEFAULT_ADMIN_PASSWORD || 'StrongPass123',
};

const name = readArg('name') || fallbackAdmin.name;
const email = (readArg('email') || fallbackAdmin.email).toLowerCase();
const phone = readArg('phone') || fallbackAdmin.phone;
const password = readArg('password') || fallbackAdmin.password;

if (!name || !email || !phone || !password) {
  console.error(
    'Usage: npm run create:admin -- --name="Admin User" --email="admin@example.com" --phone="9876543210" --password="StrongPass123"',
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

const normalizeDatabaseError = (error) => {
  if (error?.code === 'P2021') {
    throw new Error(
      'Database tables are missing. Run: npx prisma db push --schema ../prisma/schema.prisma',
    );
  }

  if (error?.code === 'ETIMEDOUT' || error?.code === 'EAI_AGAIN') {
    throw new Error(
      'Database connection failed. Check DATABASE_URL, internet access, and whether the remote database host is reachable.',
    );
  }

  throw error instanceof Error ? error : new Error('Database request failed.');
};

async function main() {
  const existingByEmail = await prisma.user
    .findFirst({
      where: {
        email,
      },
    })
    .catch(normalizeDatabaseError);

  if (existingByEmail && existingByEmail.role !== 'ADMIN') {
    throw new Error('A non-admin user already exists with this email.');
  }

  const existingByPhone = await prisma.user
    .findFirst({
      where: {
        phone,
        NOT: existingByEmail ? { id: existingByEmail.id } : undefined,
      },
    })
    .catch(normalizeDatabaseError);

  if (existingByPhone && existingByPhone.role !== 'ADMIN') {
    throw new Error('A non-admin user already exists with this phone.');
  }

  const passwordHash = hashPassword(password);

  const admin = existingByEmail
    ? await prisma.user
        .update({
          where: { id: existingByEmail.id },
          data: {
            name,
            phone,
            passwordHash,
            role: 'ADMIN',
            isActive: true,
          },
        })
        .catch(normalizeDatabaseError)
    : await prisma.user
        .create({
          data: {
            name,
            email,
            phone,
            passwordHash,
            role: 'ADMIN',
            isActive: true,
          },
        })
        .catch(normalizeDatabaseError);

  console.log(`Admin ready: ${admin.email} (${admin.id})`);
  console.log('Admin credentials are active and can be used for login.');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
