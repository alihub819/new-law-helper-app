import { type User, type InsertUser, type SearchHistory, type InsertSearchHistory } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSearchHistory(search: InsertSearchHistory): Promise<SearchHistory>;
  getSearchHistoryByUserId(userId: string): Promise<SearchHistory[]>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private searchHistories: Map<string, SearchHistory>;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.searchHistories = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createSearchHistory(insertSearch: InsertSearchHistory): Promise<SearchHistory> {
    const id = randomUUID();
    const search: SearchHistory = {
      ...insertSearch,
      id,
      createdAt: new Date(),
      results: insertSearch.results || null,
    };
    this.searchHistories.set(id, search);
    return search;
  }

  async getSearchHistoryByUserId(userId: string): Promise<SearchHistory[]> {
    return Array.from(this.searchHistories.values())
      .filter((search) => search.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10); // Return last 10 searches
  }

  // Legacy method for backward compatibility
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.getUserByEmail(username);
  }
}

export const storage = new MemStorage();
