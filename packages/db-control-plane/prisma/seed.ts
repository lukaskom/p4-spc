import { PrismaClient } from '../generated/client/index.js';
import { breweryDefaultConfig } from '@p4-spc/config-sdk';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const dataPlaneUrl =
    process.env.DATA_PLANE_DATABASE_URL_DEMO ??
    'postgresql://p4spc:p4spc_dev@localhost:5432/p4spc_tenant_demo?schema=public';

  console.log('Seeding control-plane DB...');

  const org = await prisma.organization.upsert({
    where: { slug: breweryDefaultConfig.tenantId },
    update: {
      name: breweryDefaultConfig.tenantName,
      dataPlaneDatabaseUrl: dataPlaneUrl,
    },
    create: {
      slug: breweryDefaultConfig.tenantId,
      name: breweryDefaultConfig.tenantName,
      dataPlaneDatabaseUrl: dataPlaneUrl,
    },
  });
  console.log(`  organization upserted: ${org.slug} (${org.id})`);

  const existingActive = await prisma.tenantConfig.findFirst({
    where: { organizationId: org.id, active: true },
    orderBy: { version: 'desc' },
  });

  if (!existingActive) {
    const config = await prisma.tenantConfig.create({
      data: {
        organizationId: org.id,
        version: 1,
        active: true,
        document: breweryDefaultConfig as unknown as object,
        notes: 'Initial seed — brewery default config.',
      },
    });
    console.log(`  tenant config created: v${config.version}`);
  } else {
    console.log(`  tenant config already present: v${existingActive.version}`);
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
