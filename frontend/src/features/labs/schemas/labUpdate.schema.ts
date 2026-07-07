import { z } from "zod";

export const addressSchema = z.object({
  street_1: z.string().min(1, "Street address is required").max(255),
  street_2: z.string().max(255).optional().nullable(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  postal_code: z.string().min(1, "Postal code is required").max(20),
  country: z.string(),
});

export const labUpdateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  license_number: z.string().max(100).optional().nullable(),
  support_email: z.email("Invalid email format").optional(),
  contact_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Must be a valid E.164 phone number").optional(),
  timezone: z.string(),
  address: addressSchema.optional(),
  logo_url: z.url("Must be a valid URL").optional().nullable().or(z.literal("")),
  website: z.url("Must be a valid URL").optional().nullable().or(z.literal("")),
  report_header_text: z.string().max(500).optional().nullable(),
  report_footer_text: z.string().max(1000).optional().nullable(),
  director_name: z.string().max(150).optional().nullable(),
  director_signature_url: z.url("Must be a valid URL").optional().nullable().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const labDeletionChallengeSchema = z.object({
  lab_name_confirmation: z.string().min(1, "You must type the exact name to confirm"),
  owner_password: z.string().min(1, "Password verification is required for destructive events"),
});

export type LabUpdateValues = z.infer<typeof labUpdateSchema>;
export type LabDeletionChallengeValues = z.infer<typeof labDeletionChallengeSchema>;