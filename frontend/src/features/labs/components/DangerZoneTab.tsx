"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { labDeletionChallengeSchema, LabDeletionChallengeValues } from "../schemas/labUpdate.schema";
import { labService, LabResponse } from "../api/lab.service";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/features/auth/api/auth.service";
import { AlertTriangle, Trash2, Power, Loader2 } from "lucide-react";

interface DangerZoneTabProps {
  labData: LabResponse;
}

export function DangerZoneTab({ labData }: DangerZoneTabProps) {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isActive, setIsActive] = useState(labData.is_active);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showDeleteChallenge, setShowDeleteChallenge] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<LabDeletionChallengeValues>({
    resolver: zodResolver(labDeletionChallengeSchema),
  });

  // 1. SOFT SUSPEND LOGIC
  const handleToggleActive = async () => {
    setIsDeactivating(true);
    setApiError(null);
    try {
      // await labService.updateLab(labData.id, { is_active: !isActive });
      setIsActive(!isActive);
    } catch (error: any) {
      setApiError(error.response?.data?.detail || "Failed to update workspace status.");
    } finally {
      setIsDeactivating(false);
    }
  };

  // 2. HARD DELETE LOGIC
  const onDeleteSubmit = async (data: LabDeletionChallengeValues) => {
    setApiError(null);
    
    // Client-side exact match check before bothering the server
    if (data.lab_name_confirmation !== labData.name) {
      setApiError("The typed lab name does not match exactly.");
      return;
    }

    try {
      await labService.deleteLab(labData.id, data);
      
      // Wipe session memory and refresh token to strip deleted permissions
      await authService.refreshToken();
      useAuthStore.getState().setActiveLabId(null);
      
      window.location.href = "/onboarding"; // Force redirect to create/join new lab
    } catch (error: any) {
      setApiError(error.response?.data?.detail || "Authentication failed. Workspace not deleted.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h2 className="text-lg font-bold text-slate-900">Danger Zone</h2>
        <p className="text-sm text-slate-500 mt-1">Destructive actions and workspace suspension controls.</p>
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-bold text-red-700">{apiError}</p>
        </div>
      )}

      {/* ACTION 1: SUSPEND WORKSPACE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{isActive ? "Suspend Workspace" : "Reactivate Workspace"}</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
            {isActive 
              ? "Instantly revokes access for all staff and pauses API keys. Historical patient data and reports will be securely retained." 
              : "Restore full access for your staff and resume normal laboratory operations."}
          </p>
        </div>
        <button
          onClick={handleToggleActive}
          disabled={isDeactivating}
          className={`shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            isActive 
              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" 
              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          {isDeactivating ? <Loader2 className="animate-spin" size={16} /> : <Power size={16} />}
          {isActive ? "Pause Operations" : "Resume Operations"}
        </button>
      </div>

      {/* ACTION 2: PERMANENT DELETION */}
      <div className="border border-red-200 rounded-2xl bg-red-50/30 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
          <div>
            <h3 className="text-sm font-bold text-red-700">Delete Workspace Permanently</h3>
            <p className="text-xs text-red-600/80 mt-1.5 max-w-md leading-relaxed">
              This action is irreversible. All medical registers, patient histories, and staff access records will be permanently erased.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteChallenge(!showDeleteChallenge)}
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white rounded-xl text-sm font-bold transition-all border border-red-200"
          >
            <Trash2 size={16} />
            {showDeleteChallenge ? "Cancel Deletion" : "Delete Workspace"}
          </button>
        </div>

        {/* THE SECURITY CHALLENGE FORM */}
        {showDeleteChallenge && (
          <div className="p-6 border-t border-red-200 bg-white/50 animate-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleSubmit(onDeleteSubmit)} className="space-y-5 max-w-lg">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs font-bold text-red-800 leading-relaxed">
                  To verify your identity, please type <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded select-all">{labData.name}</span> below and enter your master account password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Confirm Lab Name</label>
                <input 
                  {...register("lab_name_confirmation")} 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder={labData.name}
                  autoComplete="off"
                />
                {errors.lab_name_confirmation && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.lab_name_confirmation.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Owner Password</label>
                <input 
                  {...register("owner_password")} 
                  type="password"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="••••••••••••"
                />
                {errors.owner_password && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.owner_password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <AlertTriangle size={18} />}
                {isSubmitting ? "Terminating Data..." : "I understand the consequences, delete this lab"}
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}