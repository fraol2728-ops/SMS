import { prisma } from "../lib/prisma";

async function main() {
  const megenagna = await prisma.campus.upsert({
    where: { name: "Megenagna" },
    update: {},
    create: {
      name: "Megenagna",
      location: "Megenagna Square, Addis Ababa",
      isActive: true,
    },
  });

  const mexico = await prisma.campus.upsert({
    where: { name: "Mexico" },
    update: {},
    create: {
      name: "Mexico",
      location: "Mexico Square, Addis Ababa",
      isActive: true,
    },
  });

  for (const campus of [megenagna, mexico]) {
    for (let i = 1; i <= 10; i++) {
      await prisma.lab.upsert({
        where: {
          campusId_name: {
            campusId: campus.id,
            name: `Lab ${i}`,
          },
        },
        update: {},
        create: {
          name: `Lab ${i}`,
          campusId: campus.id,
          isActive: true,
        },
      });
    }
  }

  console.log("Seeded: Megenagna and Mexico campuses with 10 labs each");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
