import prisma from "./client.js";
import { hashPassword } from "../utils/hash.js";

async function main() {
  const email = "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await hashPassword("admin123");

  await prisma.user.create({
    data: {
      name: "Admin Tester",
      email,
      password: passwordHash,
      role: "ADMIN",
      house: "CITIZEN",
      politicalLeaning: "CENTER",
    },
  });

  console.log("✅ Admin user created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
