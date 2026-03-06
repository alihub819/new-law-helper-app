import { db } from "./server/db";
import { migrate } from "drizzle-orm/neon-http/migrator";
async function run() {
  await migrate(db, { migrationsFolder: "./migrations" });
  console.log("Migrated!");
}
run();
