import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function runMigrations() {
  console.log('[migrate] Connecting to database...');

  await AppDataSource.initialize();
  console.log('[migrate] Connected.');

  const pending = await AppDataSource.showMigrations();
  if (!pending) {
    console.log('[migrate] No pending migrations. Skipping.');
    await AppDataSource.destroy();
    return;
  }

  console.log('[migrate] Running pending migrations...');
  const ran = await AppDataSource.runMigrations({ transaction: 'each' });
  console.log(`[migrate] Done. ${ran.length} migration(s) executed.`);

  await AppDataSource.destroy();
}

runMigrations().catch((err) => {
  console.error('[migrate] FAILED:', err);
  process.exit(1);
});
