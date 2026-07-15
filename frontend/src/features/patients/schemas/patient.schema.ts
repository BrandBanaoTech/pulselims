import { z } from "zod";

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const patientIntakeSchema = z.object({
  first_name: z.string().min(2, "First name is required").trim(),
  last_name: z.string().trim().optional(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"] as const, {
    error: "Please select a gender",
  }),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  mobile: z.string().regex(phoneRegex, "Must be a valid mobile number"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  blood_group: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  address: z.object({
    street_1: z.string().min(3, "Street address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    postal_code: z.string().regex(/^\d{6}$/, "Must be a 6-digit PIN code"),
  }),
});

export type PatientIntakeValues = z.infer<typeof patientIntakeSchema>;