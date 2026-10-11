import { api } from "@/lib/axios";
import { LabTest } from "./intake.service";


export const tests = {
    get: async (): Promise<LabTest[]> => {
    const response = await api.get<LabTest[]>("/tests?is_active=true");
    return response.data;
  },

}