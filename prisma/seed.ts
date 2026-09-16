import { resetSystemToDefaults } from '../lib/system-reset'
import { prisma } from '../lib/prisma'

async function main() {
  console.log('Seeding defaults (factory reset)…')
  const result = await resetSystemToDefaults()
  console.log('Defaults restored:', result)
  console.log('Login: Admin@EICPL.com / Ogx@6666')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
