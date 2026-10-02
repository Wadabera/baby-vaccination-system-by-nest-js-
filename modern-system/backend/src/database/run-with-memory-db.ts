/**
 * Boots the API against an in-memory MongoDB.
 *
 * Useful when Docker is unavailable: `npm run dev:memory` starts a real
 * server on the configured PORT with a throwaway database, so the frontend
 * and the smoke test can both be used end to end.
 */
import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  // Use the external database when one is reachable and configured.
  if (uri && !uri.includes('mongodb-memory')) {
    console.log('Using MONGODB_URI from .env');
    return;
  }

  const mongo = await MongoMemoryServer.create({
    instance: { dbName: 'vaccination' },
  });
  process.env.MONGODB_URI = mongo.getUri('vaccination');
  console.log(`In-memory MongoDB started at ${mongo.getUri('vaccination')}`);

  const shutdown = async () => {
    await mongo.stop();
    process.exit(0);
  };
  // Signal handlers are not awaited by the emitter, so wrap in a void call.
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

void main().catch((error) => {
  console.error('Failed to start the in-memory database:', error);
  process.exit(1);
});
