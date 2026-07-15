import { api } from "@/lib/axios";
import { PatientIntakeValues } from "../schemas/patient.schema";

export const patientService = {
  createPatient: async (data: PatientIntakeValues) => {
    const response = await api.post("/patients", data);
    return response.data;
  },
};