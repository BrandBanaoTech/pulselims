import { create } from "zustand";

// --- Types ---
export type TemplateStyle = "classic" | "modern" | "minimal";
export type ReportStatus = "Draft" | "Approved";
export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";
export type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer" | "insurance" | "none";

interface ReportConfig {
  template: TemplateStyle;
  themeColor: string;
  showHeader: boolean;
  showFooter: boolean;
  showQR: boolean;
}

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F" | "Other";
  phone: string;
  refDoctor: string;
  registeredAt: string;
  barcode: string;
}

interface ReportState {
  // 1. Patient Context
  patient: PatientRecord | null;
  setPatient: (patient: PatientRecord) => void;

  // 2. Clinical Data (The Form Inputs)
  metrics: Record<string, string>;
  setMetric: (paramId: string, value: string) => void;
  
  pathologistNote: string;
  setPathologistNote: (note: string) => void;
  
  status: ReportStatus;
  setStatus: (status: ReportStatus) => void;

  // 3. Design Configuration (The Settings Drawer)
  config: ReportConfig;
  updateConfig: (updates: Partial<ReportConfig>) => void;

  // 4. Reset Action
  resetReport: () => void;
}

// --- The Zustand Store ---
export const useReportStore = create<ReportState>((set) => ({
  // Initial State
  patient: null,
  metrics: {},
  pathologistNote: "",
  status: "Draft",
  config: {
    template: "modern",
    themeColor: "#0d9488", // Default Teal
    showHeader: true,
    showFooter: true,
    showQR: true,
  },

  // Actions
  setPatient: (patient) => set({ patient }),
  
  setMetric: (paramId, value) => 
    set((state) => ({
      metrics: { ...state.metrics, [paramId]: value },
    })),
    
  setPathologistNote: (note) => set({ pathologistNote: note }),
  
  setStatus: (status) => set({ status }),

  updateConfig: (updates) => 
    set((state) => ({
      config: { ...state.config, ...updates },
    })),

  // Called when leaving the page to clear memory
  resetReport: () => 
    set({
      patient: null,
      metrics: {},
      pathologistNote: "",
      status: "Draft",
      // We keep the config so their design preferences persist between patients!
    }),
}));