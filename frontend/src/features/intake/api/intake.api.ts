import { api } from "@/lib/axios";
import { IntakeRecord, CreateIntakePayload } from "../schemas/intake.schema";

/**
 * Service orchestrating all HTTP calls for the Intakes domain.
 */
export const intakeApi = {
  
  // Get all active intakes in the queue
  getAll: async (): Promise<IntakeRecord[]> => {
    const response = await api.get<IntakeRecord[]>('/intakes');
    return response.data;
  },

  // Get a single intake by ID
  getById: async (id: string): Promise<IntakeRecord> => {
    const response = await api.get<IntakeRecord>(`/intakes/${id}`);
    return response.data;
  },

  // Create a new intake
  create: async (payload: CreateIntakePayload): Promise<IntakeRecord> => {
    const response = await api.post<IntakeRecord>('/intakes', payload);
    return response.data;
  },

  // Update workflow status
  updateStatus: async (id: string, status: string): Promise<IntakeRecord> => {
    const response = await api.put<IntakeRecord>(`/intakes/${id}`, { status });
    return response.data;
  },

  // Process an additional balance payment
  collectBalance: async (id: string, amount: number, method: string): Promise<IntakeRecord> => {
    const response = await api.put<IntakeRecord>(`/intakes/${id}`, {
      additional_payment: amount,
      payment_method: method
    });
    return response.data;
  },

  // Cancel/Delete an intake
  delete: async (id: string): Promise<void> => {
    await api.delete(`/intakes/${id}`);
  }
};