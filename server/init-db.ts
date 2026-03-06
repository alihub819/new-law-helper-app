import { db } from "./db";
import { sql } from "drizzle-orm";

const migration = `CREATE TABLE IF NOT EXISTS "appointments" (
\t"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
\t"user_id" varchar NOT NULL,
\t"client_id" varchar,
\t"client_name" text NOT NULL,
\t"client_email" text NOT NULL,
\t"date" timestamp NOT NULL,
\t"status" text DEFAULT 'scheduled' NOT NULL,
\t"type" text DEFAULT 'consultation' NOT NULL,
\t"notes" text,
\t"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cases" (
\t"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
\t"user_id" varchar NOT NULL,
\t"case_name" text NOT NULL,
\t"case_number" text,
\t"client_name" text NOT NULL,
\t"case_type" text NOT NULL,
\t"status" text DEFAULT 'active' NOT NULL,
\t"description" text,
\t"jurisdiction" text,
\t"practice_area" text,
\t"lead_attorney" text,
\t"opposing_party" text,
\t"opposing_counsel" text,
\t"value_low" numeric(12, 2),
\t"value_high" numeric(12, 2),
\t"key_deadlines" jsonb,
\t"date_opened" timestamp DEFAULT now() NOT NULL,
\t"date_closed" timestamp,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_forms" (
\t"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
\t"appointment_id" varchar,
\t"client_name" text NOT NULL,
\t"client_email" text NOT NULL,
\t"case_type" text NOT NULL,
\t"data" jsonb NOT NULL,
\t"ai_analysis" jsonb,
\t"status" text DEFAULT 'pending' NOT NULL,
\t"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_base" (
\t"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
\t"user_id" varchar NOT NULL,
\t"title" text NOT NULL,
\t"content" text NOT NULL,
\t"file_name" text,
\t"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "medical_records" (
\t"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
\t"user_id" varchar NOT NULL,
\t"case_id" varchar NOT NULL,
\t"record_type" text NOT NULL,
\t"provider_name" text,
\t"service_date" timestamp,
\t"diagnosis_codes" text[],
\t"procedure_codes" text[],
\t"treatment" text,
\t"medications" text[],
\t"charge_amount" numeric(10, 2),
\t"paid_amount" numeric(10, 2),
\t"notes" text,
\t"raw_content" text,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_documents" (
\t"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
\t"user_id" varchar NOT NULL,
\t"case_id" varchar,
\t"title" text NOT NULL,
\t"document_type" text NOT NULL,
\t"content" text NOT NULL,
\t"file_format" text,
\t"generator_tool" text,
\t"ai_model" text,
\t"version" integer DEFAULT 1,
\t"metadata" jsonb,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_history" (
\t"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
\t"user_id" varchar NOT NULL,
\t"type" text NOT NULL,
\t"query" text NOT NULL,
\t"results" jsonb,
\t"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
\t"sid" varchar PRIMARY KEY NOT NULL,
\t"sess" json NOT NULL,
\t"expire" timestamp (6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
\t"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
\t"name" text NOT NULL,
\t"email" text NOT NULL,
\t"password" text NOT NULL,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\tCONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $ BEGIN
    ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $;
--> statement-breakpoint
DO $ BEGIN
    ALTER TABLE "cases" ADD CONSTRAINT "cases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $;
--> statement-breakpoint
DO $ BEGIN
    ALTER TABLE "intake_forms" ADD CONSTRAINT "intake_forms_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $;
--> statement-breakpoint
DO $ BEGIN
    ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $;
--> statement-breakpoint
DO $ BEGIN
    ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $;
--> statement-breakpoint
DO $ BEGIN
    ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $;
--> statement-breakpoint
DO $ BEGIN
    ALTER TABLE "saved_documents" ADD CONSTRAINT "saved_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $;
--> statement-breakpoint
DO $ BEGIN
    ALTER TABLE "saved_documents" ADD CONSTRAINT "saved_documents_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $;
--> statement-breakpoint
DO $ BEGIN
    ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $;
`;

export async function ensureDatabase() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost')) return;
  
  console.log("[DB] Ensuring tables exist in database...");
  const statements = migration.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
  
  for (const statement of statements) {
    try {
      await db.execute(sql.raw(statement));
    } catch (e: any) {
      // Ignore "relation already exists" errors
      if (!e.message?.includes("already exists")) {
         console.warn("[DB] Migration warning:", e.message);
      }
    }
  }
  console.log("[DB] Tables verified.");
}
