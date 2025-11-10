import { 
  type User, type InsertUser, 
  type SearchHistory, type InsertSearchHistory,
  type Case, type InsertCase,
  type SavedDocument, type InsertDocument,
  type MedicalRecord, type InsertMedicalRecord,
  users, searchHistory, cases, savedDocuments, medicalRecords
} from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, sql as dsql } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSearchHistory(search: InsertSearchHistory): Promise<SearchHistory>;
  getSearchHistoryByUserId(userId: string): Promise<SearchHistory[]>;
  
  // Case Management
  getCasesByUser(userId: string): Promise<Case[]>;
  getCase(id: string): Promise<Case | undefined>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: string, caseData: Partial<InsertCase>): Promise<Case>;
  deleteCase(id: string): Promise<void>;
  
  // Document Management
  getDocumentsByUser(userId: string): Promise<SavedDocument[]>;
  getDocumentsByCase(caseId: string): Promise<SavedDocument[]>;
  getDocument(id: string): Promise<SavedDocument | undefined>;
  createDocument(docData: InsertDocument): Promise<SavedDocument>;
  updateDocument(id: string, docData: Partial<InsertDocument>): Promise<SavedDocument>;
  deleteDocument(id: string): Promise<void>;
  
  // Medical Records
  getMedicalRecordsByCase(caseId: string): Promise<MedicalRecord[]>;
  getMedicalRecord(id: string): Promise<MedicalRecord | undefined>;
  createMedicalRecord(recordData: InsertMedicalRecord): Promise<MedicalRecord>;
  updateMedicalRecord(id: string, recordData: Partial<InsertMedicalRecord>): Promise<MedicalRecord>;
  deleteMedicalRecord(id: string): Promise<void>;
  
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

  // Case Management Methods
  async getCasesByUser(userId: string): Promise<Case[]> {
    console.log(`[DB] Getting cases for user: ${userId}`);
    const result = await db.select()
      .from(cases)
      .where(eq(cases.userId, userId))
      .orderBy(desc(cases.createdAt));
    console.log(`[DB] Found ${result.length} cases`);
    return result;
  }

  async getCase(id: string): Promise<Case | undefined> {
    console.log(`[DB] Getting case by ID: ${id}`);
    const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
    return result[0];
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    console.log(`[DB] Creating case: ${caseData.caseName}`);
    const result = await db.insert(cases).values(caseData).returning();
    const newCase = result[0];
    console.log(`[DB] Case created with ID: ${newCase.id}`);
    return newCase;
  }

  async updateCase(id: string, caseData: Partial<InsertCase>): Promise<Case> {
    console.log(`[DB] Updating case: ${id}`);
    const result = await db.update(cases)
      .set({ ...caseData, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();
    return result[0];
  }

  async deleteCase(id: string): Promise<void> {
    console.log(`[DB] Deleting case: ${id}`);
    await db.delete(cases).where(eq(cases.id, id));
  }

  // Document Management Methods
  async getDocumentsByUser(userId: string): Promise<SavedDocument[]> {
    console.log(`[DB] Getting documents for user: ${userId}`);
    const result = await db.select()
      .from(savedDocuments)
      .where(eq(savedDocuments.userId, userId))
      .orderBy(desc(savedDocuments.createdAt));
    console.log(`[DB] Found ${result.length} documents`);
    return result;
  }

  async getDocumentsByCase(caseId: string): Promise<SavedDocument[]> {
    console.log(`[DB] Getting documents for case: ${caseId}`);
    const result = await db.select()
      .from(savedDocuments)
      .where(eq(savedDocuments.caseId, caseId))
      .orderBy(desc(savedDocuments.createdAt));
    console.log(`[DB] Found ${result.length} documents for case`);
    return result;
  }

  async getDocument(id: string): Promise<SavedDocument | undefined> {
    console.log(`[DB] Getting document by ID: ${id}`);
    const result = await db.select().from(savedDocuments).where(eq(savedDocuments.id, id)).limit(1);
    return result[0];
  }

  async createDocument(docData: InsertDocument): Promise<SavedDocument> {
    console.log(`[DB] Creating document: ${docData.title}`);
    const result = await db.insert(savedDocuments).values(docData).returning();
    const newDoc = result[0];
    console.log(`[DB] Document created with ID: ${newDoc.id}`);
    return newDoc;
  }

  async updateDocument(id: string, docData: Partial<InsertDocument>): Promise<SavedDocument> {
    console.log(`[DB] Updating document: ${id}`);
    const result = await db.update(savedDocuments)
      .set({ ...docData, updatedAt: new Date() })
      .where(eq(savedDocuments.id, id))
      .returning();
    return result[0];
  }

  async deleteDocument(id: string): Promise<void> {
    console.log(`[DB] Deleting document: ${id}`);
    await db.delete(savedDocuments).where(eq(savedDocuments.id, id));
  }

  // Medical Records Methods
  async getMedicalRecordsByCase(caseId: string): Promise<MedicalRecord[]> {
    console.log(`[DB] Getting medical records for case: ${caseId}`);
    const result = await db.select()
      .from(medicalRecords)
      .where(eq(medicalRecords.caseId, caseId))
      .orderBy(desc(medicalRecords.serviceDate));
    console.log(`[DB] Found ${result.length} medical records`);
    return result;
  }

  async getMedicalRecord(id: string): Promise<MedicalRecord | undefined> {
    console.log(`[DB] Getting medical record by ID: ${id}`);
    const result = await db.select().from(medicalRecords).where(eq(medicalRecords.id, id)).limit(1);
    return result[0];
  }

  async createMedicalRecord(recordData: InsertMedicalRecord): Promise<MedicalRecord> {
    console.log(`[DB] Creating medical record for case: ${recordData.caseId}`);
    const result = await db.insert(medicalRecords).values(recordData).returning();
    const newRecord = result[0];
    console.log(`[DB] Medical record created with ID: ${newRecord.id}`);
    return newRecord;
  }

  async updateMedicalRecord(id: string, recordData: Partial<InsertMedicalRecord>): Promise<MedicalRecord> {
    console.log(`[DB] Updating medical record: ${id}`);
    const result = await db.update(medicalRecords)
      .set({ ...recordData, updatedAt: new Date() })
      .where(eq(medicalRecords.id, id))
      .returning();
    return result[0];
  }

  async deleteMedicalRecord(id: string): Promise<void> {
    console.log(`[DB] Deleting medical record: ${id}`);
    await db.delete(medicalRecords).where(eq(medicalRecords.id, id));
  }
}

export const storage = new DatabaseStorage();
