import { z } from "zod";

// 1. Regex Matchers mirroring Pydantic parameters exactly
const phoneRegex = /^\+?[1-9]\d{1,14}$/; // International E.164 structure
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;

// 2. Base Client-Side Input Schemas
export const stepOneSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters.")
    .max(150, "Full name cannot exceed 150 characters.")
    .trim()
    .refine((val) => val.length > 0, { message: "Full name cannot be empty spaces." }),
  
  email: z
    .email("Please provide a valid, secure corporate email address.")
    .toLowerCase(),
  
  mobile: z
    .string()
    .regex(phoneRegex, "Phone number must match E.164 standards (e.g., +919876543210).")
    .min(10, "Mobile input too short.")
    .max(15, "Mobile input too long."),
  
  password: z
    .string()
    .min(12, "Password must be at least 12 characters long.")
    .max(128, "Password cannot exceed 128 characters.")
    .regex(passwordRegex, {
      message: "Password requires 1 uppercase, 1 lowercase, 1 digit, and 1 special symbol.",
    }),
});

export const stepTwoSchema = z.object({
  mobile_otp: z.string().length(6, "Mobile verification code must be exactly 6 digits."),
  email_otp: z.string().length(6, "Email verification code must be exactly 6 digits."),
});

// 3. Complete Compound Architecture mapping OwnerRegisterRequest
export const registerFormSchema = stepOneSchema.merge(stepTwoSchema);

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type StepOneValues = z.infer<typeof stepOneSchema>;
export type StepTwoValues = z.infer<typeof stepTwoSchema>;