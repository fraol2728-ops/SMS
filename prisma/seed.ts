import { prisma } from "../lib/prisma";

async function main() {
  await prisma.campus.upsert({
    where: { name: "Megenagna" },
    update: {},
    create: {
      name: "Megenagna",
      location: "Megenagna Square, Addis Ababa",
      isActive: true,
    },
  });

  await prisma.campus.upsert({
    where: { name: "Mexico" },
    update: {},
    create: {
      name: "Mexico",
      location: "Mexico Square, Addis Ababa",
      isActive: true,
    },
  });

  console.log("Campuses seeded: Megenagna and Mexico");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
