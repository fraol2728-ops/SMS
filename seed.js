const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: 'postgresql://neondb_owner:npg_9dNDkMbjKGm2@ep-falling-sky-aplikygp.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require' })
const prisma = new PrismaClient({ adapter })

async function main() {
  const meg = await prisma.campus.upsert({ where: { name: 'Megenagna' }, update: {}, create: { name: 'Megenagna', location: 'Megenagna Square, Addis Ababa', isActive: true } })
  const mex = await prisma.campus.upsert({ where: { name: 'Mexico' }, update: {}, create: { name: 'Mexico', location: 'Mexico Square, Addis Ababa', isActive: true } })
  for (const campus of [meg, mex]) {
    for (let i = 1; i <= 10; i++) {
      await prisma.lab.upsert({ where: { campusId_name: { campusId: campus.id, name: 'Lab ' + i } }, update: {}, create: { name: 'Lab ' + i, campusId: campus.id, isActive: true } })
    }
  }
  console.log('Done! Seeded 2 campuses and 20 labs.')
  await prisma.disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
