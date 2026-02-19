import { db, sqlite } from "./index";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { join } from "path";

console.log("Running migrations...");
migrate(db, { migrationsFolder: join(process.cwd(), "drizzle", "migrations") });

// Create FTS5 virtual table for full-text search
sqlite.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
    entity_type,
    entity_id UNINDEXED,
    title,
    body,
    department,
    year UNINDEXED
  );
`);

console.log("Migrations complete.");
process.exit(0);
