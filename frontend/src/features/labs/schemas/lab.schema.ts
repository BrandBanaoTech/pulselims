import { z } from "zod";

// ==========================================
// SHARED UTILITIES & PATTERNS
// ==========================================
const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Strict E.164 Format

// Shared URL validator that gracefully accepts empty strings from React Hook Form
const optionalUrlSchema = z
  .url("Must be a valid secure URL (HTTPS)")
  .trim()
  .or(z.literal(""))
  .nullable()
  .optional();

// ==========================================
// 1. NESTED ADDRESS SCHEMA
// ==========================================
export const addressSchema = z.object({
  street_1: z.string().trim().min(1, "Street address is required.").max(255),
  street_2: z.string().trim().max(255).nullable().optional(),
  city: z.string().trim().min(1, "City is required.").max(100),
  state: z.string().trim().min(1, "State/Province is required.").max(100),
  postal_code: z.string().trim().min(1, "Postal code is required.").max(20),
  country: z.string().trim().min(1, "Country is required.").max(100),
});

// ==========================================
// 2. CREATE LABSPACE SCHEMA (Strict)
// ==========================================
export const createLabSchema = z.object({
  name: z.string().trim().min(2, "Lab name must be at least 2 characters.").max(255),
  license_number: z.string().trim().max(100).nullable().optional(),
  
  support_email: z.email("Must be a valid email address.").trim().toLowerCase(),
  contact_phone: z.string().trim().regex(phoneRegex, "Must match E.164 format (e.g., +919876543210)"),
  timezone: z.string().trim(),
  
  // URLs use the shared safe parser
  logo_url: optionalUrlSchema,
  website: optionalUrlSchema,
  
  report_header_text: z.string().trim().max(500).nullable().optional(),
  report_footer_text: z.string().trim().max(1000).nullable().optional(),
  
  director_name: z.string().trim().max(150).nullable().optional(),
  director_signature_url: optionalUrlSchema,
  
  address: addressSchema,
});

// ==========================================
// 3. UPDATE LABSPACE SCHEMA (Partial)
// ==========================================
export const labUpdateSchema = z.object({
  name: z.string().trim().min(2, "Lab name must be at least 2 characters.").max(255).optional(),
  license_number: z.string().trim().max(100).nullable().optional(),
  
  support_email: z.email("Invalid email format").trim().toLowerCase().optional(),
  contact_phone: z.string().trim().regex(phoneRegex, "Must match E.164 format (e.g., +919876543210)").optional(),
  timezone: z.string().trim().optional(),
  
  logo_url: optionalUrlSchema,
  website: optionalUrlSchema,
  
  report_header_text: z.string().trim().max(500).nullable().optional(),
  report_footer_text: z.string().trim().max(1000).nullable().optional(),
  
  director_name: z.string().trim().max(150).nullable().optional(),
  director_signature_url: optionalUrlSchema,
  
  address: addressSchema.optional(),
  is_active: z.boolean().optional(),
});

// ==========================================
// 4. DESTRUCTIVE ACTION SCHEMA
// ==========================================
export const labDeletionChallengeSchema = z.object({
  lab_name_confirmation: z.string().trim().min(1, "You must type the exact name to confirm"),
  owner_password: z.string().min(1, "Password verification is required for destructive events"), // No trim on passwords
});

// ==========================================
// INFERRED TYPES FOR FRONTEND COMPONENTS
// ==========================================
export type AddressFormValues = z.infer<typeof addressSchema>;
export type CreateLabFormValues = z.infer<typeof createLabSchema>;
export type LabUpdateValues = z.infer<typeof labUpdateSchema>;
export type LabDeletionChallengeValues = z.infer<typeof labDeletionChallengeSchema>;