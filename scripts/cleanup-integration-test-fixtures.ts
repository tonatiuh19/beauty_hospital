/**
 * Purge leftover integration-test fixtures from the shared DB.
 *
 *   npm run test:cleanup-fixtures
 *   npm run test:cleanup-fixtures -- --dry-run
 *
 * Deletes patients and staff whose email ends with @example.test only.
 */
import "dotenv/config";
import {
  createIntegrationTestPool,
  previewExampleTestFixtures,
  purgeAllExampleTestFixtures,
} from "../api/testDbCleanup";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!process.env.DB_HOST) {
    console.error("DB_HOST required (.env)");
    process.exit(1);
  }
  const pool = createIntegrationTestPool();
  try {
    const preview = await previewExampleTestFixtures(pool);
    console.log(
      `[cleanup] @example.test patients=${preview.patients} users=${preview.users}`,
    );
    if (dryRun) {
      console.log("[cleanup] dry-run — no rows deleted");
      return;
    }
    await purgeAllExampleTestFixtures(pool);
    const after = await previewExampleTestFixtures(pool);
    console.log(
      `[cleanup] remaining patients=${after.patients} users=${after.users}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
