import { api } from "@/lib/axios"; // Your central authenticated Axios instance
import { LabUpdateValues, LabDeletionChallengeValues } from "../schemas/labUpdate.schema";

export interface LabResponse {
  id: string;
  owner_id: string;
  name: string;
  license_number?: string;
  support_email: string;
  contact_phone: string;
  timezone: string;
  logo_url?: string;
  website?: string;
  report_header_text?: string;
  report_footer_text?: string;
  director_name?: string;
  director_signature_url?: string;
  address: {
    street_1: string;
    street_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export const labService = {
  // Existing methods (createLab, etc.) should stay here
  // Fetches all labs the current user has access to.
  getMyWorkspaces: async (): Promise<LabResponse[]> => {
    const response = await api.get<LabResponse[]>('/labs'); // Adjust endpoint if needed
    return response.data;
  },

  // Get active lab configuration
  getLabDetails: async (labId: string): Promise<LabResponse> => {
    const response = await api.get<LabResponse>(`/labs/${labId}`);
    return response.data;
  },

  // Securely update partial lab configurations
  updateLab: async (labId: string, payload: LabUpdateValues): Promise<LabResponse> => {
    // Sanitize empty string URLs to null to fit backend HttpUrl fields
    const sanitizedPayload = { ...payload };
    if (sanitizedPayload.logo_url === "") sanitizedPayload.logo_url = null;
    if (sanitizedPayload.website === "") sanitizedPayload.website = null;
    if (sanitizedPayload.director_signature_url === "") sanitizedPayload.director_signature_url = null;

    const response = await api.patch<LabResponse>(`/labs/${labId}`, sanitizedPayload);
    return response.data;
  },

  // High-risk hard-deletion event verifying identity and exact workspace confirmation matching
  deleteLab: async (labId: string, challenge: LabDeletionChallengeValues): Promise<void> => {
    await api.post(`/labs/${labId}`, challenge);
  }
};