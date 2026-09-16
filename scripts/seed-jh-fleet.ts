import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const fleet = [
  { reg: 'JH-09-BF-4601', driver: 'Anand Swaroop', phone: '9000004601' },
  { reg: 'JH-09-BF-2239', driver: 'Bhakti Pad Mahto', phone: '9000002239' },
  { reg: 'JH-09-BF-8484', driver: 'Munni Lal Rai', phone: '9000008484' },
]

async function upsertPair(row: { reg: string; driver: string; phone: string }) {
  const licenseExpiry = new Date()
  licenseExpiry.setFullYear(licenseExpiry.getFullYear() + 2)

  let driver = await prisma.driver.findFirst({ where: { name: row.driver } })
  if (driver) {
    driver = await prisma.driver.update({
      where: { id: driver.id },
      data: { phone: row.phone, status: 'active' },
    })
  } else {
    driver = await prisma.driver.create({
      data: {
        name: row.driver,
        phone: row.phone,
        status: 'active',
        advanceBalance: 0,
        licenseExpiry,
      },
    })
  }

  await prisma.truck.updateMany({
    where: { assignedDriverId: driver.id },
    data: { assignedDriverId: null },
  })

  const existing = await prisma.truck.findUnique({
    where: { registrationNumber: row.reg },
  })

  const truck = existing
    ? await prisma.truck.update({
        where: { id: existing.id },
        data: {
          vehicleType: 'truck',
          ownershipType: 'owned',
          capacityTons: 30,
          status: 'active',
          assignedDriverId: driver.id,
        },
      })
    : await prisma.truck.create({
        data: {
          registrationNumber: row.reg,
          vehicleType: 'truck',
          ownershipType: 'owned',
          capacityTons: 30,
          status: 'active',
          assignedDriverId: driver.id,
        },
      })

  return { truck: truck.registrationNumber, driver: driver.name }
}

async function main() {
  const results = []
  for (const row of fleet) {
    results.push(await upsertPair(row))
  }
  console.log(JSON.stringify(results, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
