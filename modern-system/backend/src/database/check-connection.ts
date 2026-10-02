/**
 * Verifies that the configured MongoDB is reachable and usable.
 *
 * Run this first when switching databases, since a bad connection string, a
 * wrong password or an IP that is not in the Atlas access list all surface here
 * with a clear message instead of a timeout inside the Nest bootstrap.
 *
 * Usage:
 *   npm run db:check
 *   MONGODB_URI="mongodb+srv://..." npm run db:check
 */
import 'dotenv/config';
import mongoose from 'mongoose';

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not set. Copy .env.example to .env first.');
    process.exit(1);
  }

  // Never print the password back to the console.
  const redacted = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  const isAtlas = uri.startsWith('mongodb+srv://');
  console.log(`Target: ${redacted}`);
  console.log(
    `Type:  ${isAtlas ? 'MongoDB Atlas (SRV)' : 'direct connection'}`,
  );

  if (isAtlas) {
    // `mongodb+srv://` resolves `_mongodb._tcp.<host>` SRV records, not A
    // records. The hostname itself intentionally has no A record, so an
    // A-record lookup gives a false "does not exist".
    const host = new URL(uri.replace('mongodb+srv://', 'https://')).hostname;
    const records = await resolveSrv(`_mongodb._tcp.${host}`);

    if (records.length === 0) {
      console.error(`\nERROR: no SRV records for _mongodb._tcp.${host}.`);
      console.error(
        'The Atlas cluster hostname does not exist. The cluster was most',
      );
      console.error(
        'likely deleted or its free tier expired. Check the Atlas UI for',
      );
      console.error('your current connection string.');
      process.exit(1);
    }

    console.log(`DNS:   ${records.length} shard(s) advertised via SRV`);
    for (const record of records) {
      console.log(`         ${record.name}:${record.port}`);
    }
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  } catch (error) {
    console.error(`\nERROR: could not connect.\n${(error as Error).message}\n`);
    console.error('Common causes:');
    console.error(
      '  - password is not URL-encoded (an "@" must be written "%40")',
    );
    console.error('  - your IP is not in the Atlas "Network Access" list');
    console.error('  - the database name in the URI does not exist');
    process.exit(1);
  }

  const db = mongoose.connection.db;
  const host = mongoose.connection.host;

  console.log(`\nConnected to: ${host}/${db?.databaseName}`);

  const collections = await db!.listCollections().toArray();
  const names = collections.map((c) => c.name);
  console.log(`Collections: ${names.length ? names.join(', ') : '(none yet)'}`);

  // Report which collections Mongoose has already indexed.
  const tracked = ['users', 'mothers', 'children', 'clinics', 'posts'];
  const present = tracked.filter((name) => names.includes(name));
  if (present.length > 0) {
    const indexes = await db!.collection(present[0]).indexes();
    console.log(
      `Indexes on ${present[0]}: ${indexes.map((i) => i.name).join(', ')}`,
    );
  }

  console.log('\nConnection is healthy.');
  await mongoose.disconnect();
}

/** Resolve SRV records; an empty array means the name does not exist. */
function resolveSrv(
  name: string,
): Promise<Array<{ name: string; port: number }>> {
  return new Promise((resolve) => {
    import('node:dns')
      .then(({ promises }) => promises.resolveSrv(name))
      .then((entries) =>
        resolve(
          entries.map((e) => ({
            name: e.name.replace(/\.$/, ''),
            port: e.port,
          })),
        ),
      )
      // ENOTFOUND / ENODATA both mean "no record", not a transient failure.
      .catch(() => resolve([]));
  });
}

main().catch((error) => {
  console.error('Database check failed:', error);
  process.exit(1);
});
