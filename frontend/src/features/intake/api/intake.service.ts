import { api } from "@/lib/axios";

// ==========================================
// 1. ENUMS (Exact FastAPI Backend Match)
// ==========================================
export type GenderEnum = "Male" | "Female" | "Other";
export type PriorityEnum = "Routine" | "Urgent" | "STAT";
export type DiscountTypeEnum = "percentage" | "flat" | "none";
export type PaymentMethodEnum = "cash" | "upi" | "card" | "bank_transfer" | "insurance" | "none";
export type PaymentStatusEnum = "unpaid" | "partial" | "paid" | "refunded";
export type IntakeStatusEnum = "registered" | "sample_collected" | "processing" | "completed" | "cancelled";

// ==========================================
// 2. DTO INTERFACES
// ==========================================
export interface PatientPayload {
  name: string;
  age: number;
  gender: GenderEnum;
  phone: string;
  address?: string;
}

export interface ClinicalPayload {
  priority: PriorityEnum;
  doctor_reference?: string;
  clinical_notes?: string;
  test_ids: string[]; // UUID4 strings
}

export interface BillingPayload {
  payment_status: PaymentStatusEnum;
  payment_method: PaymentMethodEnum;
  discount_type: DiscountTypeEnum;
  discount_value: number;
  paid_amount: number;
}

export interface IntakeCreatePayload {
  patient: PatientPayload;
  clinical: ClinicalPayload;
  billing: BillingPayload;
}

export interface IntakeUpdatePayload {
  status?: IntakeStatusEnum;
  sample_collection_date?: string;
  clinical_notes?: string;
  additional_payment?: number;
  payment_method?: PaymentMethodEnum;
  test_ids?: string[];
}

export interface IntakeResponse {
  id: string; // UUID4
  lab_id: string;
  accession_number: string;
  
  patient_name: string;
  patient_phone: string;
  patient_age: number;
  patient_gender: GenderEnum;
  patient_address?: string;
  
  priority: PriorityEnum;
  referring_doctor?: string;
  clinical_notes?: string;
  test_ids: string[];
  
  status: IntakeStatusEnum;
  intake_date: string;
  sample_collection_date?: string;
  updated_at?: string;
  
  payment_status: PaymentStatusEnum;
  payment_method: PaymentMethodEnum;
  discount_type: DiscountTypeEnum;
  discount_value: number;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  balance_due: number;
}

export interface ListIntakesParams {
  status?: IntakeStatusEnum;
  phone?: string;
  limit?: number;
  offset?: number;
}

// ==========================================
// 3. SERVICE METHODS
// ==========================================
export const intakeService = {
  createIntake: async (payload: IntakeCreatePayload): Promise<IntakeResponse> => {
    const response = await api.post<IntakeResponse>("/intakes", payload);
    return response.data;
  },

  listIntakes: async (params?: ListIntakesParams): Promise<IntakeResponse[]> => {
    const response = await api.get<IntakeResponse[]>("/intakes", { params });
    return response.data;
  },

  updateIntake: async (intakeId: string, payload: IntakeUpdatePayload): Promise<IntakeResponse> => {
    const response = await api.put<IntakeResponse>(`/intakes/${intakeId}`, payload);
    return response.data;
  },

  cancelIntake: async (intakeId: string): Promise<void> => {
    await api.delete(`/intakes/${intakeId}`);
  }
};