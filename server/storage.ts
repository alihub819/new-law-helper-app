import {
  type User, type InsertUser,
  type SearchHistory, type InsertSearchHistory,
  type Case, type InsertCase,
  type SavedDocument, type InsertDocument,
  type MedicalRecord, type InsertMedicalRecord,
  type KnowledgeBase, type InsertKnowledgeBase,
  type Appointment, type InsertAppointment,
  type IntakeForm, type InsertIntakeForm,
  users, searchHistory, cases, savedDocuments, medicalRecords, knowledgeBase, appointments, intakeForms
} from "../shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, sql as dsql } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
const { Pool } = pg;

const MemoryStore = createMemoryStore(session);

import { db } from "./db";

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

  // Knowledge Base
  getKnowledgeBaseByUser(userId: string): Promise<KnowledgeBase[]>;
  createKnowledgeBase(kbData: InsertKnowledgeBase): Promise<KnowledgeBase>;
  deleteKnowledgeBase(id: string, userId: string): Promise<void>;

  // Appointments
  getAppointments(userId: string): Promise<Appointment[]>;
  createAppointment(apt: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, apt: Partial<InsertAppointment>): Promise<Appointment>;

  // Intake Forms
  getIntakeForm(id: string): Promise<IntakeForm | undefined>;
  createIntakeForm(form: InsertIntakeForm): Promise<IntakeForm>;
  updateIntakeForm(id: string, form: Partial<InsertIntakeForm>): Promise<IntakeForm>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('pseudo')) {
      const PgSession = connectPgSimple(session);
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
      });
      this.sessionStore = new PgSession({
        pool,
        tableName: 'session',
        createTableIfMissing: true,
      });
    } else {
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000, // 24 hours
      });
    }
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

  async getKnowledgeBaseByUser(userId: string): Promise<KnowledgeBase[]> {
    console.log(`[DB] Getting knowledge base for user: ${userId}`);
    return await db.select().from(knowledgeBase).where(eq(knowledgeBase.userId, userId));
  }

  async createKnowledgeBase(kbData: InsertKnowledgeBase): Promise<KnowledgeBase> {
    console.log(`[DB] Creating knowledge base entry: ${kbData.title}`);
    const result = await db.insert(knowledgeBase).values(kbData).returning();
    return result[0];
  }

  async deleteKnowledgeBase(id: string, userId: string): Promise<void> {
    console.log(`[DB] Deleting knowledge base entry: ${id} for user: ${userId}`);
    await db.delete(knowledgeBase).where(and(eq(knowledgeBase.id, id), eq(knowledgeBase.userId, userId)));
  }

  async getAppointments(userId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.userId, userId));
  }

  async createAppointment(apt: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values(apt).returning();
    return result[0];
  }

  async updateAppointment(id: string, apt: Partial<InsertAppointment>): Promise<Appointment> {
    const result = await db.update(appointments).set(apt).where(eq(appointments.id, id)).returning();
    return result[0];
  }

  async getIntakeForm(id: string): Promise<IntakeForm | undefined> {
    const result = await db.select().from(intakeForms).where(eq(intakeForms.id, id));
    return result[0];
  }

  async createIntakeForm(form: InsertIntakeForm): Promise<IntakeForm> {
    const result = await db.insert(intakeForms).values(form).returning();
    return result[0];
  }

  async updateIntakeForm(id: string, form: Partial<InsertIntakeForm>): Promise<IntakeForm> {
    const result = await db.update(intakeForms).set(form).where(eq(intakeForms.id, id)).returning();
    return result[0];
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private cases: Map<string, Case> = new Map();
  private documents: Map<string, SavedDocument> = new Map();
  private searchHistory: Map<string, SearchHistory[]> = new Map();
  private medicalRecords: Map<string, MedicalRecord> = new Map();
  private knowledgeBase: Map<string, KnowledgeBase> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private intakeForms: Map<string, IntakeForm> = new Map();
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date(), password: insertUser.password || "" };
    this.users.set(id, user);
    return user;
  }

  async createSearchHistory(insertSearch: InsertSearchHistory): Promise<SearchHistory> {
    const id = randomUUID();
    const history: SearchHistory = { ...insertSearch, id, createdAt: new Date(), results: insertSearch.results || null };
    const userHistory = this.searchHistory.get(insertSearch.userId) || [];
    userHistory.unshift(history);
    this.searchHistory.set(insertSearch.userId, userHistory.slice(0, 10));
    return history;
  }

  async getSearchHistoryByUserId(userId: string): Promise<SearchHistory[]> {
    return this.searchHistory.get(userId) || [];
  }

  async getCasesByUser(userId: string): Promise<Case[]> {
    return Array.from(this.cases.values()).filter(c => c.userId === userId);
  }

  async getCase(id: string): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const id = randomUUID();
    const newCase: Case = {
      ...caseData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: caseData.status || "active",
      caseNumber: caseData.caseNumber || null,
      description: caseData.description || null,
      jurisdiction: caseData.jurisdiction || null,
      practiceArea: caseData.practiceArea || null,
      leadAttorney: caseData.leadAttorney || null,
      opposingParty: caseData.opposingParty || null,
      opposingCounsel: caseData.opposingCounsel || null,
      valueLow: caseData.valueLow || null,
      valueHigh: caseData.valueHigh || null,
      keyDeadlines: caseData.keyDeadlines || null,
      dateOpened: caseData.dateOpened || new Date(),
      dateClosed: caseData.dateClosed || null
    };
    this.cases.set(id, newCase);
    return newCase;
  }

  async updateCase(id: string, caseData: Partial<InsertCase>): Promise<Case> {
    const existing = this.cases.get(id);
    if (!existing) throw new Error("Case not found");
    const updated = { ...existing, ...caseData, updatedAt: new Date() };
    this.cases.set(id, updated);
    return updated;
  }

  async deleteCase(id: string): Promise<void> {
    this.cases.delete(id);
  }

  async getDocumentsByUser(userId: string): Promise<SavedDocument[]> {
    return Array.from(this.documents.values()).filter(d => d.userId === userId);
  }

  async getDocumentsByCase(caseId: string): Promise<SavedDocument[]> {
    return Array.from(this.documents.values()).filter(d => d.caseId === caseId);
  }

  async getDocument(id: string): Promise<SavedDocument | undefined> {
    return this.documents.get(id);
  }

  async createDocument(docData: InsertDocument): Promise<SavedDocument> {
    const id = randomUUID();
    const doc: SavedDocument = {
      ...docData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      caseId: docData.caseId || null,
      fileFormat: docData.fileFormat || null,
      generatorTool: docData.generatorTool || null,
      aiModel: docData.aiModel || null,
      version: docData.version || 1,
      metadata: docData.metadata || null
    };
    this.documents.set(id, doc);
    return doc;
  }

  async updateDocument(id: string, docData: Partial<InsertDocument>): Promise<SavedDocument> {
    const existing = this.documents.get(id);
    if (!existing) throw new Error("Document not found");
    const updated = { ...existing, ...docData, updatedAt: new Date() };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
  }

  async getMedicalRecordsByCase(caseId: string): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values()).filter(r => r.caseId === caseId);
  }

  async getMedicalRecord(id: string): Promise<MedicalRecord | undefined> {
    return this.medicalRecords.get(id);
  }

  async createMedicalRecord(recordData: InsertMedicalRecord): Promise<MedicalRecord> {
    const id = randomUUID();
    const record: MedicalRecord = {
      ...recordData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      providerName: (recordData as any).providerName || null,
      serviceDate: recordData.serviceDate || new Date(),
      diagnosisCodes: recordData.diagnosisCodes || null,
      procedureCodes: recordData.procedureCodes || null,
      treatment: recordData.treatment || null,
      medications: recordData.medications || null,
      chargeAmount: recordData.chargeAmount || null,
      paidAmount: recordData.paidAmount || null,
      notes: recordData.notes || null,
      rawContent: recordData.rawContent || null
    };
    this.medicalRecords.set(id, record);
    return record;
  }

  async updateMedicalRecord(id: string, recordData: Partial<InsertMedicalRecord>): Promise<MedicalRecord> {
    const existing = this.medicalRecords.get(id);
    if (!existing) throw new Error("Medical record not found");
    const updated = { ...existing, ...recordData, updatedAt: new Date() };
    this.medicalRecords.set(id, updated);
    return updated;
  }

  async deleteMedicalRecord(id: string): Promise<void> {
    this.medicalRecords.delete(id);
  }

  async getKnowledgeBaseByUser(userId: string): Promise<KnowledgeBase[]> {
    return Array.from(this.knowledgeBase.values()).filter(k => k.userId === userId);
  }

  async createKnowledgeBase(kbData: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const id = randomUUID();
    const entry: KnowledgeBase = {
      ...kbData,
      id,
      createdAt: new Date(),
      fileName: kbData.fileName || null
    };
    this.knowledgeBase.set(id, entry);
    return entry;
  }

  async deleteKnowledgeBase(id: string, userId: string): Promise<void> {
    const entry = this.knowledgeBase.get(id);
    if (entry && entry.userId === userId) {
      this.knowledgeBase.delete(id);
    }
  }

  async getAppointments(userId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(a => a.userId === userId);
  }

  async createAppointment(apt: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const newApt: Appointment = {
      ...apt,
      id,
      status: apt.status || "scheduled",
      type: apt.type || "consultation",
      clientId: apt.clientId || null,
      notes: apt.notes || null,
      createdAt: new Date()
    };
    this.appointments.set(id, newApt);
    return newApt;
  }

  async updateAppointment(id: string, apt: Partial<InsertAppointment>): Promise<Appointment> {
    const existing = this.appointments.get(id);
    if (!existing) throw new Error("Appointment not found");
    const updated = { ...existing, ...apt };
    this.appointments.set(id, updated);
    return updated;
  }

  async getIntakeForm(id: string): Promise<IntakeForm | undefined> {
    return this.intakeForms.get(id);
  }

  async createIntakeForm(form: InsertIntakeForm): Promise<IntakeForm> {
    const id = randomUUID();
    const newForm: IntakeForm = {
      ...form,
      id,
      status: form.status || "pending",
      appointmentId: form.appointmentId || null,
      aiAnalysis: form.aiAnalysis || null,
      createdAt: new Date()
    };
    this.intakeForms.set(id, newForm);
    return newForm;
  }

  async updateIntakeForm(id: string, form: Partial<InsertIntakeForm>): Promise<IntakeForm> {
    const existing = this.intakeForms.get(id);
    if (!existing) throw new Error("Intake form not found");
    const updated = { ...existing, ...form };
    this.intakeForms.set(id, updated);
    return updated;
  }
}

export const storage = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') ? new DatabaseStorage() : new MemStorage();
console.log(`[STORAGE] Initialized ${storage.constructor.name}`);

