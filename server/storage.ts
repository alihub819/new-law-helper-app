import { type User, type InsertUser, type SearchHistory, type InsertSearchHistory, users, searchHistory } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSearchHistory(search: InsertSearchHistory): Promise<SearchHistory>;
  getSearchHistoryByUserId(userId: string): Promise<SearchHistory[]>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    console.log(`[DB] Getting user by ID: ${id}`);
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const user = result[0];
    console.log(`[DB] User found: ${user ? 'YES' : 'NO'}`);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log(`[DB] Getting user by email: ${email}`);
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = result[0];
    console.log(`[DB] User found: ${user ? 'YES' : 'NO'}`);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log(`[DB] Creating user with email: ${insertUser.email}`);
    const result = await db.insert(users).values(insertUser).returning();
    const user = result[0];
    console.log(`[DB] User created with ID: ${user.id}`);
    return user;
  }

  async createSearchHistory(insertSearch: InsertSearchHistory): Promise<SearchHistory> {
    console.log(`[DB] Creating search history for user: ${insertSearch.userId}`);
    const result = await db.insert(searchHistory).values(insertSearch).returning();
    const search = result[0];
    console.log(`[DB] Search history created with ID: ${search.id}`);
    return search;
  }

  async getSearchHistoryByUserId(userId: string): Promise<SearchHistory[]> {
    console.log(`[DB] Getting search history for user: ${userId}`);
    const result = await db.select()
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(10);
    console.log(`[DB] Found ${result.length} search history records`);
    return result;
  }

  // Legacy method for backward compatibility
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.getUserByEmail(username);
  }
}

export const storage = new DatabaseStorage();
