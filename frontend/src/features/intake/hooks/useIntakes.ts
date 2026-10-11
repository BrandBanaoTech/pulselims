import { useState, useEffect, useCallback, useMemo } from "react";
import { intakeApi } from "../api/intake.api";
import type { IntakeRecord } from "@/features/intake/schemas/intake.schema";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/lib/toast";

export function useIntakes() {
  const { token } = useAuthStore();

  // 1. Raw State
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 2. Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // 3. API Actions
  const fetchIntakes = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const data = await intakeApi.getAll(); // 🚀 Using your clean API layer!
      setIntakes(data);
    } catch (error) {
      toast.error("Failed to load operations queue.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchIntakes();
  }, [fetchIntakes]);

  const updateStatus = async (id: string, currentStatus: string) => {
    const next = currentStatus === "processing" ? "completed" : currentStatus === "completed" ? "registered" : "processing";
    try {
      if (currentStatus !== "completed") {
      await intakeApi.updateStatus(id, {status: next});
      toast.success("Status Updated");
      fetchIntakes();
      }
      else {
        toast.error("Report is Ready.");
      }
    } catch { 
      toast.error("Update failed."); 
    }
  };

  const deleteIntake = async (id: string, name: string) => {
    if (!window.confirm(`Cancel order for ${name}?`)) return;
    try {
      await intakeApi.delete(id);
      toast.success("Order Cancelled");
      fetchIntakes();
    } catch { 
      toast.error("Deletion failed."); 
    }
  };

  // 4. Derived State (High-Performance Filtering)
  const filteredIntakes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return intakes.filter(p => {
      const matchSearch = (p.patient_name || "").toLowerCase().includes(query) || 
                          (p.patient_phone || "").toLowerCase().includes(query) || 
                          (p.accession_number || "").toLowerCase().includes(query);
      const matchStatus = statusFilter === "All" ? true : p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [intakes, searchQuery, statusFilter]);

  const counts = useMemo(() => ({
    all: intakes.length,
    registered: intakes.filter(i => i.status === "registered").length,
    processing: intakes.filter(i => i.status === "processing").length,
    completed: intakes.filter(i => i.status === "completed").length,
  }), [intakes]);

  // 5. Expose the API to the UI
  return {
    intakes: filteredIntakes,
    counts,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    refresh: fetchIntakes,
    updateStatus,
    deleteIntake
  };
}