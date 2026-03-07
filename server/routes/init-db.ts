import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

export const initDbRouter = Router();

initDbRouter.get("/api/init-db", async (req, res) => {
  try {
    const migrationPath = path.resolve(process.cwd(), "migrations", "0000_busy_junta.sql");
    let migrationSql = "";
    
    if (fs.existsSync(migrationPath)) {
      migrationSql = fs.readFileSync(migrationPath, "utf-8");
    } else {
      // Look in vercel standard paths
      const fallbackPath = path.resolve(__dirname, "../../migrations", "0000_busy_junta.sql");
      if (fs.existsSync(fallbackPath)) {
        migrationSql = fs.readFileSync(fallbackPath, "utf-8");
      } else {
         return res.status(500).json({ error: "Migration file not found", paths: [migrationPath, fallbackPath] });
      }
    }

    // Split statements (simple heuristic based on Drizzle's output)
    const statements = migrationSql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
      await db.execute(sql.raw(statement));
    }

    res.json({ success: true, message: "Database tables created successfully!" });
  } catch (error: any) {
    console.error("Migration error:", error);
    res.status(500).json({ error: "Failed to initialize database", details: error.message || error });
  }
});
