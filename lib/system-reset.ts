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

  const driver1 = await prisma.driver.create({
    data: {
      name: 'Ramesh Patil',
      phone: '9876543210',
      licenseNumber: 'KA04-2019-4821',
      licenseExpiry,
      status: 'active',
      advanceBalance: 0,
    },
  })

  const driver2 = await prisma.driver.create({
    data: {
      name: 'Suresh Kulkarni',
      phone: '9876501234',
      licenseNumber: 'MH12-2020-7734',
      licenseExpiry,
      status: 'active',
      advanceBalance: 0,
    },
  })

  const truck1 = await prisma.truck.create({
    data: {
      registrationNumber: 'KA-04-MB-4821',
      ownershipType: 'owned',
      capacityTons: 30,
      status: 'active',
      assignedDriverId: driver1.id,
    },
  })

  const truck2 = await prisma.truck.create({
    data: {
      registrationNumber: 'MH-12-AB-7734',
      ownershipType: 'hired',
      capacityTons: 25,
      status: 'active',
      assignedDriverId: driver2.id,
    },
  })

  return {
    admin: admin.username,
    drivers: [driver1.name, driver2.name],
    trucks: [truck1.registrationNumber, truck2.registrationNumber],
  }
}
