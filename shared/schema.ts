import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, decimal, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const CaseStatus = z.enum(["active", "pending", "closed"]);
export type CaseStatus = z.infer<typeof CaseStatus>;

export const CaseType = z.enum([
  "personal-injury",
  "contract-dispute",
  "employment",
  "intellectual-property",
  "real-estate",
  "family",
  "criminal",
  "medical-malpractice",
  "product-liability",
  "other"
]);
export type CaseType = z.infer<typeof CaseType>;

export const DocumentType = z.enum([
  "demand-letter",
  "medical-summary",
  "medical-chronology",
  "medical-bill-analysis",
  "discovery-response",
  "interrogatories",
  "request-for-production",
  "legal-brief",
  "contract",
  "other"
]);
export type DocumentType = z.infer<typeof DocumentType>;
export const FileFormat = z.enum(["pdf", "docx", "txt"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const searchHistory = pgTable("search_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'legal-research', 'brief-summarizer', 'risk-analysis'
  query: text("query").notNull(),
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  caseName: text("case_name").notNull(),
  caseNumber: text("case_number"),
  clientName: text("client_name").notNull(),
  caseType: text("case_type").$type<CaseType>().notNull(),
  status: text("status").$type<CaseStatus>().notNull().default("active"),
  description: text("description"),
  jurisdiction: text("jurisdiction"),
  practiceArea: text("practice_area"),
  leadAttorney: text("lead_attorney"),
  opposingParty: text("opposing_party"),
  opposingCounsel: text("opposing_counsel"),
  valueLow: decimal("value_low", { precision: 12, scale: 2 }),
  valueHigh: decimal("value_high", { precision: 12, scale: 2 }),
  keyDeadlines: jsonb("key_deadlines"),
  dateOpened: timestamp("date_opened").defaultNow().notNull(),
  dateClosed: timestamp("date_closed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userCaseIdx: index("user_case_idx").on(table.userId, table.caseName),
  statusIdx: index("status_idx").on(table.status),
}));

export const savedDocuments = pgTable("saved_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  caseId: varchar("case_id").references(() => cases.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  documentType: text("document_type").$type<DocumentType>().notNull(),
  content: text("content").notNull(),
  fileFormat: text("file_format"),
  generatorTool: text("generator_tool"),
  aiModel: text("ai_model"),
  version: integer("version").default(1),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userDocIdx: index("user_doc_idx").on(table.userId, table.caseId, table.documentType),
}));

export const medicalRecords = pgTable("medical_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  caseId: varchar("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  recordType: text("record_type").notNull(), // 'treatment', 'bill', 'imaging', 'lab', etc.
  providerName: text("provider_name"),
  serviceDate: timestamp("service_date"),
  diagnosisCodes: text("diagnosis_codes").array(),
  procedureCodes: text("procedure_codes").array(),
  treatment: text("treatment"),
  medications: text("medications").array(),
  chargeAmount: decimal("charge_amount", { precision: 10, scale: 2 }),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  rawContent: text("raw_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  caseRecordIdx: index("case_record_idx").on(table.caseId, table.serviceDate),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).pick({
  userId: true,
  type: true,
  query: true,
  results: true,
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  caseType: CaseType,
  status: CaseStatus.optional(),
});

export const insertDocumentSchema = createInsertSchema(savedDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  documentType: DocumentType,
  fileFormat: FileFormat.optional(),
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type SavedDocument = typeof savedDocuments.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
