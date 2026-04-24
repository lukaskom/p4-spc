import { PrismaClient } from '../generated/client/index.js';

export * from '../generated/client/index.js';

const clients = new Map<string, PrismaClient>();

export function getDataPlaneClient(databaseUrl: string): PrismaClient {
  const existing = clients.get(databaseUrl);
  if (existing) return existing;
  const client = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  clients.set(databaseUrl, client);
  return client;
}

export async function disconnectDataPlane(): Promise<void> {
  for (const client of clients.values()) {
    await client.$disconnect();
  }
  clients.clear();
}
