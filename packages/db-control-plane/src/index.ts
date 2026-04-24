import { PrismaClient } from '../generated/client/index.js';

export * from '../generated/client/index.js';

let singleton: PrismaClient | null = null;

export function getControlPlaneClient(databaseUrl?: string): PrismaClient {
  if (singleton) return singleton;
  singleton = new PrismaClient(
    databaseUrl
      ? { datasources: { db: { url: databaseUrl } } }
      : undefined,
  );
  return singleton;
}

export async function disconnectControlPlane(): Promise<void> {
  if (singleton) {
    await singleton.$disconnect();
    singleton = null;
  }
}
