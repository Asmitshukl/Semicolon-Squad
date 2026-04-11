const path = require("node:path");
const { config: loadEnv } = require("dotenv");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../dist/generated/prisma/client.js");
const { hashPassword } = require("../dist/utils/hash.js");

loadEnv({ path: path.resolve(__dirname, "..", ".env") });
loadEnv({ path: path.resolve(__dirname, "..", "..", ".env"), override: false });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

async function main() {
  try {
    // Get first available station or create one
    let station = await prisma.policeStation.findFirst();

    if (!station) {
      console.log("No police stations found. Creating one...");
      station = await prisma.policeStation.create({
        data: {
          name: "Central Police Station",
          stationCode: "CENTRAL01",
          district: "Central District",
          phone: "9876543210",
          address: "123 Police Station Road",
        },
      });
      console.log("Created police station:", station.stationCode);
    }

    // Create user for officer
    const user = await prisma.user.create({
      data: {
        name: "Uday Kashyap",
        email: "uday.officer@example.com",
        phone: "9876543211",
        passwordHash: hashPassword("OfficerPass@123"),
        role: "OFFICER",
      },
    });

    console.log("Created user:", user.email);

    // Create officer
    const officer = await prisma.officer.create({
      data: {
        userId: user.id,
        badgeNumber: "BADGE154",
        rank: "Sub-Inspector",
        department: station.district,
        stationId: station.id,
        verificationStatus: "PENDING",
        joinedAt: new Date(),
      },
      include: {
        user: true,
        station: true,
      },
    });

    console.log("✅ Officer created successfully!");
    console.log("Officer Details:");
    console.log(`  ID: ${officer.id}`);
    console.log(`  Name: ${officer.user.name}`);
    console.log(`  Email: ${officer.user.email}`);
    console.log(`  Phone: ${officer.user.phone}`);
    console.log(`  Badge: ${officer.badgeNumber}`);
    console.log(`  Rank: ${officer.rank}`);
    console.log(`  Station: ${officer.station.name}`);
    console.log(`  Status: ${officer.verificationStatus}`);
    console.log(`\nLogin credentials:`);
    console.log(`  Email: ${officer.user.email}`);
    console.log(`  Password: OfficerPass@123`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
