/**
 * Database migration script
 * Run with: npm run db:migrate
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool, { query, testConnection, closePool } from "./connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log("🚀 Starting database migrations...\n");

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error("Cannot proceed without database connection");
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, "migrations");

  try {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();

    console.log(`Found ${sqlFiles.length} migration file(s)\n`);

    for (const file of sqlFiles) {
      console.log(`📄 Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, "utf-8");

      // Split by semicolons and execute each statement
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        try {
          await query(statement);
        } catch (error: any) {
          // Ignore "table already exists" errors
          if (!error.message.includes("already exists")) {
            throw error;
          }
        }
      }

      console.log(`✅ Completed: ${file}\n`);
    }

    console.log("🎉 All migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run migrations
runMigrations();
