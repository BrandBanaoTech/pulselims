import { z } from "zod";

// ==========================================
// 1. ENUMS
// ==========================================
export const IntakeStatusEnum = z.enum(["registered", "sample_collected", "processing", "completed", "cancelled"]);
export const PriorityEnum = z.enum(["Routine", "Urgent", "STAT"]);
export const GenderEnum = z.enum(["Male", "Female", "Other"]);
export const PaymentStatusEnum = z.enum(["unpaid", "partial", "paid", "refunded"]);
export const PaymentMethodEnum = z.enum(["cash", "upi", "card", "bank_transfer", "insurance", "none"]);
export const DiscountTypeEnum = z.enum(["percentage", "flat", "none"]);

// ==========================================
// 2. CORE RECORD SCHEMA (What the API returns)
// ==========================================
export const IntakeRecordSchema = z.object({
  id: z.uuid(),
  lab_id: z.string(),
  accession_number: z.string(),
  
  // Demographics
  patient_name: z.string(),
  patient_phone: z.string(),
  patient_age: z.number().min(0).max(120),
  patient_gender: GenderEnum,
  
  // Clinical
  priority: PriorityEnum,
  test_ids: z.array(z.string()),
  status: IntakeStatusEnum,
  intake_date: z.iso.datetime(),
  
  // Billing
  payment_status: PaymentStatusEnum,
  payment_method: PaymentMethodEnum,
  discount_type: DiscountTypeEnum,
  discount_value: z.number().min(0),
  gross_amount: z.number().min(0),
  discount_amount: z.number().min(0),
  net_amount: z.number().min(0),
  paid_amount: z.number().min(0),
  balance_due: z.number().min(0),
});

// ==========================================
// 3. CREATION PAYLOAD SCHEMA (What we send to the API)
// ==========================================
export const CreateIntakeSchema = z.object({
  patient: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    age: z.number().min(0).max(120),
    gender: GenderEnum,
    phone: z.string().min(10, "Valid phone number required"),
  }),
  clinical: z.object({
    priority: PriorityEnum,
    test_ids: z.array(z.string()).min(1, "At least one test is required"),
  }),
  billing: z.object({
    payment_status: PaymentStatusEnum,
    payment_method: PaymentMethodEnum,
    discount_type: DiscountTypeEnum,
    discount_value: z.number().min(0),
    paid_amount: z.number().min(0),
  })
});

// ==========================================
// 4. INFERRED TYPESCRIPT TYPES
// ==========================================
export type IntakeRecord = z.infer<typeof IntakeRecordSchema>;
export type CreateIntakePayload = z.infer<typeof CreateIntakeSchema>;