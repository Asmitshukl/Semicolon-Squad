const path = require("node:path");
const { config: loadEnv } = require("dotenv");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../dist/generated/prisma/client.js");

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
    const stations = await prisma.policeStation.findMany({
      select: {
        id: true,
        stationCode: true,
        name: true,
        district: true,
      },
    });

    if (stations.length === 0) {
      console.log("❌ No police stations found in the database.");
      console.log("\nCreating a default station...");

      const newStation = await prisma.policeStation.create({
        data: {
          name: "Central Police Station",
          stationCode: "CENTRAL01",
          district: "Central District",
          phone: "9876543210",
          address: "123 Police Station Road",
        },
      });

      console.log("✅ Station created successfully!");
      console.log(`Station Code: ${newStation.stationCode}`);
      console.log(`Station Name: ${newStation.name}`);
    } else {
      console.log("✅ Available Police Stations:");
      console.log("");
      stations.forEach((station) => {
        console.log(`Code: ${station.stationCode}`);
        console.log(`Name: ${station.name}`);
        console.log(`District: ${station.district}`);
        console.log("---");
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
