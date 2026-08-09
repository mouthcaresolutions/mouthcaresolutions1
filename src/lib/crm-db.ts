import { createClient, Client } from '@libsql/client';

const globalForCRM = globalThis as unknown as { crm: Client | undefined };

export function getCRM(): Client {
  if (!globalForCRM.crm) {
    globalForCRM.crm = createClient({
      url: process.env.DATABASE_URL || '',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return globalForCRM.crm;
}
