CREATE TYPE "public"."dose_unit" AS ENUM('mg', 'mcg', 'IU', 'mL', 'units');--> statement-breakpoint
CREATE TYPE "public"."med_form" AS ENUM('tablet', 'capsule', 'liquid', 'injection', 'topical', 'inhaler', 'patch', 'drops', 'powder', 'gummy', 'softgel', 'subcutaneous_injection', 'intramuscular_injection', 'nasal_spray');--> statement-breakpoint
CREATE TYPE "public"."med_frequency" AS ENUM('once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed', 'weekly', 'monthly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."injection_route" AS ENUM('subcutaneous', 'intramuscular', 'intravenous');--> statement-breakpoint
CREATE TYPE "public"."interaction_source" AS ENUM('openFDA', 'rxnorm', 'manual', 'user_confirmed', 'ai');--> statement-breakpoint
CREATE TYPE "public"."med_type" AS ENUM('medication', 'supplement', 'vitamin', 'herbal', 'peptide');--> statement-breakpoint
CREATE TYPE "public"."contact_relationship" AS ENUM('spouse', 'parent', 'child', 'sibling', 'friend', 'caregiver', 'doctor', 'other');--> statement-breakpoint
CREATE TYPE "public"."interaction_severity" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."med_shape" AS ENUM('round', 'oval', 'capsule', 'rectangle', 'triangle', 'diamond', 'other');--> statement-breakpoint
CREATE TYPE "public"."share_type" AS ENUM('doctor', 'family', 'caregiver');--> statement-breakpoint
CREATE TYPE "public"."app_theme" AS ENUM('vital', 'after-dark', 'bento', 'clear');--> statement-breakpoint
CREATE TABLE "drug_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"medication_a_id" uuid,
	"medication_b_id" uuid,
	"medication_a_name" text,
	"medication_b_name" text,
	"severity" "interaction_severity" NOT NULL,
	"confidence" integer,
	"description" text NOT NULL,
	"mechanism" text,
	"clinical_effects" text[] DEFAULT '{}',
	"recommendations" text[] DEFAULT '{}',
	"source" "interaction_source",
	"acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"created_date" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"relationship" "contact_relationship" NOT NULL,
	"phone" text NOT NULL,
	"phone_secondary" text,
	"email" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"can_view_medications" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_date" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medication_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"medication_id" uuid NOT NULL,
	"scheduled_time" text NOT NULL,
	"date" date NOT NULL,
	"taken" boolean DEFAULT false NOT NULL,
	"taken_at" timestamp with time zone,
	"skipped" boolean DEFAULT false NOT NULL,
	"notes" text,
	"injection_site" text,
	"adherence_streak" integer DEFAULT 0 NOT NULL,
	"created_date" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "med_type" DEFAULT 'medication' NOT NULL,
	"generic_name" text,
	"brand_name" text,
	"dosage" text,
	"form" "med_form",
	"color" text,
	"shape" "med_shape",
	"imprint" text,
	"reminder_enabled" boolean DEFAULT true NOT NULL,
	"side_effects" text,
	"frequency" "med_frequency" DEFAULT 'once_daily' NOT NULL,
	"custom_frequency" text,
	"times" text[] DEFAULT '{}',
	"with_food" boolean DEFAULT false,
	"instructions" text,
	"prescribing_doctor" text,
	"start_date" date,
	"end_date" date,
	"pharmacy" text,
	"ndc_number" text,
	"rxnorm_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"quantity" integer,
	"refills_left" integer,
	"refill_due_date" date,
	"supplement_purpose" text,
	"ingredient_list" text[] DEFAULT '{}',
	"vial_amount_mg" numeric,
	"bac_water_ml" numeric,
	"concentration_mcg_per_ml" numeric,
	"dose_amount" numeric,
	"dose_unit" "dose_unit",
	"injection_route" "injection_route",
	"injection_sites" text[] DEFAULT '{}',
	"cycle_weeks_on" integer,
	"cycle_weeks_off" integer,
	"cycle_start_date" date,
	"created_date" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pharmacies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"phone" text,
	"fax" text,
	"hours" text,
	"latitude" numeric,
	"longitude" numeric,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_date" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email" text,
	"full_name" text,
	"allergies" text[] DEFAULT '{}',
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"notification_lead_time" integer DEFAULT 15 NOT NULL,
	"theme" "app_theme" DEFAULT 'vital' NOT NULL,
	"created_date" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"medication_ids" uuid[] DEFAULT '{}',
	"recipient_email" text,
	"recipient_name" text,
	"share_type" "share_type",
	"include_schedule" boolean DEFAULT true NOT NULL,
	"favorite_pharmacy" text,
	"access_code" text,
	"expires_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_date" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;