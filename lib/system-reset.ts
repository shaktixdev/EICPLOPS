import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

/** Wipe operational data and restore default fleet + single admin account. */
export async function resetSystemToDefaults() {
  // Child records first (Mongo relations are not cascading deletes)
  await prisma.invoiceLine.deleteMany({})
  await prisma.advance.deleteMany({})
  await prisma.ledgerEntry.deleteMany({})
  await prisma.trip.deleteMany({})
  await prisma.invoice.deleteMany({})

  // Unlink truck↔driver before deleting masters
  await prisma.truck.updateMany({ data: { assignedDriverId: null } })
  await prisma.truck.deleteMany({})
  await prisma.driver.deleteMany({})
  await prisma.operator.deleteMany({})
  await prisma.counter.deleteMany({})
  await prisma.user.deleteMany({})

  const hash = await bcrypt.hash('Ogx@6666', 10)
  const admin = await prisma.user.create({
    data: {
      username: 'admin@eicpl.com',
      password: hash,
      name: 'System Admin',
      role: 'admin',
    },
  })

  const licenseExpiry = new Date()
  licenseExpiry.setFullYear(licenseExpiry.getFullYear() + 2)

  const fleet = [
    { name: 'Anand Swaroop', phone: '9000004601', registrationNumber: 'JH-09-BF-4601' },
    { name: 'Bhakti Pad Mahto', phone: '9000002239', registrationNumber: 'JH-09-BF-2239' },
    { name: 'Munni Lal Rai', phone: '9000008484', registrationNumber: 'JH-09-BF-8484' },
  ]

  const drivers = []
  const trucks = []

  for (const row of fleet) {
    const driver = await prisma.driver.create({
      data: {
        name: row.name,
        phone: row.phone,
        status: 'active',
        advanceBalance: 0,
        licenseExpiry,
      },
    })
    const truck = await prisma.truck.create({
      data: {
        registrationNumber: row.registrationNumber,
        vehicleType: 'truck',
        ownershipType: 'owned',
        capacityTons: 30,
        status: 'active',
        assignedDriverId: driver.id,
      },
    })
    drivers.push(driver.name)
    trucks.push(truck.registrationNumber)
  }

  return {
    admin: admin.username,
    drivers,
    trucks,
  }
}
