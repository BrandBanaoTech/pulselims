"use client";

import { Input } from "@/components/ui/Input";
import { Activity, CreditCard, Dna, Droplets, FlaskConical, Loader2, Microscope, Phone, Receipt, Search, Tag, TestTubes, User, X, Edit3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DiscountTypeEnum, GenderEnum, LabTest, PaymentMethodEnum, PaymentStatusEnum, PriorityEnum, intakeService } from "../api/intake.service";
import { Select } from "@/components/ui/Select";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/lib/toast";
import { tests } from "../api/tests.service";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/axios";
import type { IntakeRecord } from "../schemas/intake.schema";

interface NewIntakeDrawerProp {
  isopen: boolean;
  onClose: () => void;
  onSuccess?: (newRecord: any) => void;
  intakeToEdit?: IntakeRecord | null;
}

// ==========================================
// ERROR FORMATTER
// ==========================================
const formatApiError = (error: any): string => {
  if (!error.isAxiosError) return error instanceof Error ? error.message : "Unexpected error.";
  if (!error.response) return "Network error. Please check your connection.";
  const detail = error.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((err) => `${err.loc?.[err.loc.length - 1] || 'Field'}: ${err.msg}`).join(" | ");
  return error.message || "A system error occurred.";
};

export function NewIntakeDrawer({ isopen, onClose, onSuccess, intakeToEdit }: NewIntakeDrawerProp) {
  const { token } = useAuthStore();
  const isEditing = Boolean(intakeToEdit);
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<GenderEnum>("M");

  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [isFetchingTests, setIsFetchingTests] = useState(false);
  const [availableTests, setAvailableTests] = useState<LabTest[]>([]);
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const [testSearchQuery, setTestSearchQuery] = useState("");

  const [priority, setPriority] = useState<PriorityEnum>("Routine");

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusEnum>("Paid");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>("UPI");
  const [discountType, setDiscountType] = useState<DiscountTypeEnum>("percentage");
  const [discountValue, setDiscountValue] = useState<number | "">("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // FETCH LAB DICTIONARY
  // ==========================================
  const fetchActiveTests = useCallback(async () => {
    try {
      setIsFetchingTests(true);
      const res = await tests.get();
      setAvailableTests(res || []);
    } catch (error) {
      toast.error("Dictionary Error", formatApiError(error));
    } finally {
      setIsFetchingTests(false);
    }
  }, []);

  // Fetch tests dictionary on mount when authenticated
  useEffect(() => {
    if (token && isopen) {
      fetchActiveTests();
    }
  }, [token, isopen, fetchActiveTests]);

  // ==========================================
  // PREFILL FORM ON EDIT OR RESET ON CREATE
  // ==========================================
  useEffect(() => {
    if (!isopen) return;

    if (intakeToEdit) {
      // 🚀 Robust extraction supporting both flat & nested records
      const recordAny = intakeToEdit as any;
      const patientName = intakeToEdit.patient_name || recordAny.patient?.name || "";
      const patientPhone = intakeToEdit.patient_phone || recordAny.patient?.phone || "";
      const patientAge = intakeToEdit.patient_age ?? recordAny.patient?.age ?? "";
      const rawGender = intakeToEdit.patient_gender || recordAny.patient?.gender || "M";
      
      setFullName(patientName);
      setPhone(patientPhone);
      setAge(patientAge);
      setGender(rawGender === "M" ? "M" : rawGender === "F" ? "F" : (rawGender as GenderEnum));

      setPriority(intakeToEdit.priority || recordAny.clinical?.priority || "Routine");
      setPaymentStatus(intakeToEdit.payment_status || recordAny.billing?.payment_status || "Paid");
      setPaymentMethod(intakeToEdit.payment_method || recordAny.billing?.payment_method || "UPI");
      setDiscountType(intakeToEdit.discount_type || recordAny.billing?.discount_type || "percentage");
      setDiscountValue(intakeToEdit.discount_value ?? recordAny.billing?.discount_value ?? "");

      // Match and prefill assigned tests from available dictionary or record
      const rawTestIds = intakeToEdit.test_ids || recordAny.clinical?.test_ids || [];
      const rawTests = intakeToEdit.tests || [];

      if (availableTests.length > 0) {
        if (rawTestIds.length > 0) {
          const matched = availableTests.filter(t => rawTestIds.includes(t.id));
          setSelectedTests(matched);
        } else if (rawTests.length > 0) {
          const matched = availableTests.filter(t => 
            rawTests.some((rt: any) => typeof rt === 'string' ? rt === t.name || rt === t.id : rt.id === t.id)
          );
          setSelectedTests(matched);
        }
      }
    } else {
      // Reset to clean creation state
      setFullName(""); 
      setPhone(""); 
      setAge(""); 
      setGender("M");
      setSelectedTests([]); 
      setPriority("Routine"); 
      setPaymentStatus("Paid");
      setPaymentMethod("UPI"); 
      setDiscountType("percentage"); 
      setDiscountValue("");
    }
  }, [isopen, intakeToEdit, availableTests]);

  // ==========================================
  // BILLING CALCULATOR
  // ==========================================
  const subtotal = useMemo(() => selectedTests.reduce((sum, test) => sum + Number(test.price), 0), [selectedTests]);

  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    const num = Number(discountValue);
    if (discountType === "percentage") return Math.min(subtotal, Math.round((subtotal * num) / 100));
    return Math.min(subtotal, num);
  }, [subtotal, discountType, discountValue]);

  const finalTotal = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const resetIntakeForm = () => {
    onClose();
  };

  const handleSubmitIntake = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let response;
      
      if (isEditing && intakeToEdit) {
        // 🚀 1. Build a Delta Payload containing ONLY changed fields
        const updatePayload: Record<string, any> = {};

        if (priority !== intakeToEdit.priority) {
          updatePayload.priority = priority;
        }

        // Compare test IDs array (sorting ensures order doesn't trigger false positives)
        const originalTestIds = [...(intakeToEdit.test_ids || [])].sort();
        const currentTestIds = selectedTests.map(t => t.id).sort();
        const testCodes = selectedTests.map(t => t.code).sort();
        const discount_type =  !discountValue || discountValue === 0 ? "none" : discountType;
        const discount_value = Number(discountValue) || 0;
        const paid_amount = paymentStatus === "Paid" ? finalTotal : 0;
        const payment_status = paymentStatus;
        const payment_method = paymentStatus === "Unpaid" ? "none" : paymentMethod;
        
        if (JSON.stringify(originalTestIds) !== JSON.stringify(currentTestIds)) {
          updatePayload.test_ids = currentTestIds;
          updatePayload.tests = testCodes;
        }

        if (paymentStatus !== intakeToEdit.payment_status) {
          updatePayload.billing = {
            payment_status: payment_status, 
            payment_method: payment_method, 
            discount_type: discount_type, 
            discount_value: discount_value, 
            paid_amount: paid_amount
          };
        }

        // If nothing was changed, notify the user and exit early
        if (Object.keys(updatePayload).length === 0) {
          toast.info("No Changes", "No modifications were made to update.");
          setIsSubmitting(false);
          return;
        }

        // Send the partial payload
        response = await intakeService.updateIntake(intakeToEdit.id, updatePayload);
        toast.success("Update Successful", "Changes saved successfully.");
        
      } else {
        // 🚀 Creation logic (Sends full required payload)
        if (selectedTests.length === 0 || !fullName || !phone) {
          toast.warning("Incomplete Form", "Please fill required fields and select tests.");
          setIsSubmitting(false);
          return;
        }

        const createPayload = {
          patient: { name: fullName.trim(), age: Number(age) || 0, gender: gender, phone: phone.trim() },
          clinical: { priority: priority, test_ids: selectedTests.map(t => t.id), tests: selectedTests.map(t => t.code) },
          billing: {
            payment_status: paymentStatus,
            payment_method: paymentStatus === "Unpaid" ? "none" : paymentMethod,
            discount_type: !discountValue || discountValue === 0 ? "none" : discountType,
            discount_value: Number(discountValue) || 0,
            paid_amount: paymentStatus === "Paid" ? finalTotal : 0,
          }
        };

        response = await intakeService.createIntake(createPayload);
        toast.success("Registration Successful", `${fullName} has been registered.`);
      }

      resetIntakeForm();
      if (onSuccess) {
        onSuccess(response?.data || response); 
      }
    } catch (error) {
      toast.error(isEditing ? "Update Failed" : "Registration Failed", formatApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleSubmitIntake = async (e: React.SubmitEvent) => {
  //   e.preventDefault();
    
  //   if (!fullName || !phone) {
  //     toast.warning("Incomplete Form", "Please fill required fields.");
  //     return;
  //   }

  //   setIsSubmitting(true);

  //   try {
  //     let response;

  //     if (isEditing && intakeToEdit) {
  //       const updatePayload: Record<string, any> = {};

  //       if (priority !== intakeToEdit.priority) {
  //         updatePayload.priority = priority;
  //       }

  //       const originalTestIds = [...(intakeToEdit.test_ids || [])].sort();
  //       const currentTestIds = selectedTests.map(t => t.id).sort();
  //       if (JSON.stringify(originalTestIds) !== JSON.stringify(currentTestIds)) {
  //         updatePayload.test_ids = currentTestIds;
  //       }

  //       if (Object.keys(updatePayload).length === 0) {
  //         toast.info("No Changes", "No modifications were made to update.");
  //         setIsSubmitting(false);
  //         return;
  //       }
        
  //       // 🚀 Update Payload
  //       // const updatePayload = {
  //       //   priority: priority,
  //       //   ...(selectedTests.length > 0 && { test_ids: selectedTests.map(t => t.id) }),
  //       // };

  //       // response = await intakeService.updateIntake?.(intakeToEdit.id, updatePayload) || 
  //       //            await api.put(`/intakes/${intakeToEdit.id}`, updatePayload);
        
  //       // toast.success("Update Successful", "Intake record updated successfully.");
  //       response = await intakeService.updateIntake(intakeToEdit.id, updatePayload);
  //       toast.success("Update Successful", "Intake record updated successfully.");
  //     } else {
  //       // 🚀 Creation Payload
  //       if (selectedTests.length === 0) {
  //         toast.warning("Incomplete Form", "Please select at least one test.");
  //         setIsSubmitting(false);
  //         return;
  //       }

  //       const createPayload = {
  //         patient: { name: fullName.trim(), age: Number(age) || 0, gender: gender, phone: phone.trim() },
  //         clinical: { priority: priority, test_ids: selectedTests.map(t => t.id) },
  //         billing: {
  //           payment_status: paymentStatus,
  //           payment_method: paymentStatus === "Unpaid" ? "none" : paymentMethod,
  //           discount_type: !discountValue || discountValue === 0 ? "none" : discountType,
  //           discount_value: Number(discountValue) || 0,
  //           paid_amount: paymentStatus === "Paid" ? finalTotal : 0,
  //         }
  //       };

  //       response = await intakeService.createIntake(createPayload);
  //       toast.success("Registration Successful", `${fullName} has been registered.`);
  //     }

  //     resetIntakeForm();
  //     if (onSuccess) {
  //       onSuccess(response?.data || response); 
  //     }
  //   } catch (error) {
  //     toast.error(isEditing ? "Update Failed" : "Registration Failed", formatApiError(error));
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleSelectTest = (test: LabTest) => {
    if (!selectedTests.find(t => t.id === test.id)) setSelectedTests([...selectedTests, test]);
    setTestSearchQuery("");
    setIsTestDropdownOpen(false);
  };
  
  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter(t => t.id !== testId));
  };
  
  const filteredComboboxTests = useMemo(() => {
    const query = testSearchQuery.toLowerCase().trim();
    return availableTests.filter(test => 
      !selectedTests.find(t => t.id === test.id) &&
      ((test.name || "").toLowerCase().includes(query) || (test.code || "").toLowerCase().includes(query))
    );
  }, [availableTests, selectedTests, testSearchQuery]);

  const getDeptIcon = (dept?: string) => {
    const d = dept || "";
    if (d.includes("Hematology") || d.includes("Pathology")) return <Droplets size={14} className="text-rose-500" />;
    if (d.includes("Biochemistry") || d.includes("Tumor")) return <FlaskConical size={14} className="text-amber-500" />;
    if (d.includes("Endocrinology") || d.includes("Immunology")) return <Dna size={14} className="text-indigo-500" />;
    if (d.includes("Microbiology") || d.includes("Histopathology")) return <Microscope size={14} className="text-emerald-500" />;
    return <TestTubes size={14} className="text-cyan-500" />;
  };

  useEffect(() => {
    if (paymentStatus === "Unpaid") {
      setPaymentMethod("none" as PaymentMethodEnum);
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsTestDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [paymentStatus]);
  
  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full md:w-[550px] h-full bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 bg-white shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-900 text-white rounded-xl flex items-center justify-center border border-teal-100 shadow-sm">
              {isEditing ? <Edit3 size={20} strokeWidth={2.5} /> : <User size={20} strokeWidth={2.5} />}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 truncate">
                {isEditing ? `Edit Intake (${intakeToEdit?.accession_number || ''})` : "New Patient Intake"}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {isEditing ? "Update Clinical & Workflow Data" : "Registration & Billing"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
          <form id="intake-form" onSubmit={handleSubmitIntake} className="space-y-6">
            
            {/* SECTION 1: DEMOGRAPHICS (Locked / Read-Only during Editing) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-teal-900" /> Patient Demographics
                </h3>
                {isEditing && (
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Locked
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <Input 
                  label="Full Name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  disabled={isEditing}
                />

                <Input 
                  label="Phone Number"
                  icon={Phone}
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  disabled={isEditing}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Age"
                    type="number"
                    min="0" max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                    placeholder="Years"
                    disabled={isEditing}
                  />
                  <Select 
                    label="Gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as GenderEnum)}
                    disabled={isEditing}
                    options={[
                      { label: "Male", value: "M" },
                      { label: "Female", value: "F" },
                      { label: "Other", value: "Other" }
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: TEST SELECTION & PRIORITY */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} className="text-teal-600" /> Test Selection & Priority
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {selectedTests.length} Selected
                </span>
              </div>

              <div className="space-y-4">
                {/* Combobox Search */}
                <div className="relative" ref={dropdownRef}>
                  <Input 
                    label="Search Diagnostics"
                    icon={isFetchingTests ? Loader2 : Search}
                    placeholder={isFetchingTests ? "Fetching active lab dictionary..." : "Type test name or code (e.g. CBC)..."}
                    value={testSearchQuery}
                    onChange={(e) => { setTestSearchQuery(e.target.value); setIsTestDropdownOpen(true); }}
                    onFocus={() => setIsTestDropdownOpen(true)}
                  />
                  
                  {isTestDropdownOpen && (testSearchQuery.length > 0 || filteredComboboxTests.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                      {filteredComboboxTests.length === 0 ? (
                        <div className="p-4 text-center text-xs font-semibold text-slate-400">No active tests matching query.</div>
                      ) : (
                        filteredComboboxTests.map(test => (
                          <button
                            key={test.id} type="button" onClick={() => handleSelectTest(test)}
                            className="w-full text-left px-4 py-3 hover:bg-teal-50/60 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-colors outline-none"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">{test.name}</div>
                              <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
                                <span>{getDeptIcon(test.department)}</span>
                                <span>{test.code}</span>
                              </div>
                            </div>
                            <div className="text-xs font-black font-mono text-slate-900 shrink-0">₹{test.price}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Tests Badges */}
                {selectedTests.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Tests</span>
                      <button type="button" onClick={() => setSelectedTests([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline underline-offset-2 outline-none">
                        Clear All
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                      {selectedTests.map(test => (
                        <div key={test.id} className="inline-flex items-center gap-2 bg-white border border-slate-200 pl-3 pr-1.5 py-1.5 rounded-lg shadow-sm animate-in zoom-in-95 duration-150">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800 leading-tight">{test.name}</span>
                            <span className="text-[9px] font-mono font-bold text-slate-400">₹{test.price}</span>
                          </div>
                          <button type="button" onClick={() => handleRemoveTest(test.id)} className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-md transition-colors outline-none ml-1">
                            <X size={12} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority Selector */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Priority Level</label>
                  <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 shadow-inner">
                    {(['Routine', 'Urgent', 'STAT'] as PriorityEnum[]).map(p => (
                      <button 
                        type="button" key={p} onClick={() => setPriority(p)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all outline-none ${
                          priority === p ? p === 'STAT' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: BILLING DETAILS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-5 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <Receipt size={14} className="text-teal-600" /> Billing & Payment Details
              </h3>

              <div className="space-y-4">
                {!isEditing && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Apply Discount</label>
                    <div className="flex gap-2">
                      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 shadow-inner">
                        <button type="button" onClick={() => setDiscountType("percentage")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all outline-none ${discountType === "percentage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>%</button>
                        <button type="button" onClick={() => setDiscountType("flat")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all outline-none ${discountType === "flat" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>₹</button>
                      </div>
                      <div className="relative flex-1">
                        <Input
                          type="number" min="0" 
                          value={discountValue} 
                          onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")}
                          placeholder={discountType === "percentage" ? "Enter % (e.g. 10)" : "Enter Flat ₹"}
                          icon={Tag}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Payment Mode & Status Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <Select 
                    label="Payment Status"
                    value={paymentStatus} 
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatusEnum)}
                    options={[
                      { label: "Unpaid", value: "Unpaid" },
                      // { label: "Partial", value: "Partial" },
                      { label: "Paid", value: "Paid" },
                    ]}
                  />
                  <Select 
                    label="Payment Method"
                    value={paymentMethod || "none"} 
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodEnum)}
                    disabled={paymentStatus === "Unpaid"}
                    options={[
                      { label: "UPI", value: "UPI" },
                      { label: "Cash", value: "Cash" },
                      { label: "Credit/Debit Card", value: "Card" },
                      { label: "Net Banking", value: "Net_Banking" }
                    ]}
                  />
                </div>
                
                {/* LIVE BILL BREAKDOWN RECEIPT CARD */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 font-mono shadow-xl relative overflow-hidden mt-4">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span>Items Total ({selectedTests.length})</span>
                    <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs text-emerald-400 border-b border-slate-800 pb-2">
                      <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Flat"})</span>
                      <span className="font-bold">- ₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-sans font-bold text-slate-300">Final Payable</span>
                    <span className="text-xl font-black text-teal-400">₹{finalTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

              </div>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md flex justify-end gap-3 shrink-0 sticky bottom-0 z-20">
          <Button variant="secondary" onClick={resetIntakeForm}>
            Cancel
          </Button>
          <Button 
            type="submit"
            form="intake-form"
            disabled={(!isEditing && selectedTests.length === 0) || !fullName || !phone || isSubmitting}
            isLoading={isSubmitting}
            icon={<CreditCard size={18} strokeWidth={2.5} />}
          >
            {isEditing ? "Save Changes" : "Save Intake"}
          </Button>
        </div>

      </div>
    </div>
  );
}

// "use client";

// import { Input } from "@/components/ui/Input";
// import { Activity, CreditCard, Dna, Droplets, FlaskConical, Loader2, Microscope, Phone, Receipt, Search, Tag, TestTubes, User, X, Edit3, Lock } from "lucide-react";
// import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// import { DiscountTypeEnum, GenderEnum, LabTest, PaymentMethodEnum, PaymentStatusEnum, PriorityEnum, intakeService } from "../api/intake.service";
// import { Select } from "@/components/ui/Select";
// import { useAuthStore } from "@/store/useAuthStore";
// import { toast } from "@/lib/toast";
// import { tests } from "../api/tests.service";
// import { Button } from "@/components/ui/Button";
// import { api } from "@/lib/axios";
// import type { IntakeRecord } from "../schemas/intake.schema";

// interface NewIntakeDrawerProp {
//   isopen: boolean;
//   onClose: () => void;
//   onSuccess?: (newRecord: any) => void;
//   intakeToEdit?: IntakeRecord | null;
// }

// // ==========================================
// // ERROR FORMATTER
// // ==========================================
// const formatApiError = (error: any): string => {
//   if (!error?.isAxiosError) return error instanceof Error ? error.message : "Unexpected error.";
//   if (!error.response) return "Network error. Please check your connection.";
//   const detail = error.response.data?.detail;
//   if (typeof detail === "string") return detail;
//   if (Array.isArray(detail)) return detail.map((err) => `${err.loc?.[err.loc.length - 1] || 'Field'}: ${err.msg}`).join(" | ");
//   return error.message || "A system error occurred.";
// };

// export function NewIntakeDrawer({ isopen, onClose, onSuccess, intakeToEdit }: NewIntakeDrawerProp) {
//   const { token } = useAuthStore();
//   const isEditing = Boolean(intakeToEdit);
  
//   const [fullName, setFullName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [age, setAge] = useState<number | "">("");
//   const [gender, setGender] = useState<GenderEnum>("M");

//   const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
//   const [isFetchingTests, setIsFetchingTests] = useState(false);
//   const [availableTests, setAvailableTests] = useState<LabTest[]>([]);
//   const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
//   const [testSearchQuery, setTestSearchQuery] = useState("");

//   const [priority, setPriority] = useState<PriorityEnum>("Routine");

//   const [paymentStatus, setPaymentStatus] = useState<PaymentStatusEnum>("Paid");
//   const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>("UPI");
//   const [discountType, setDiscountType] = useState<DiscountTypeEnum>("percentage");
//   const [discountValue, setDiscountValue] = useState<number | "">("");

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // ==========================================
//   // FETCH LAB TEST DICTIONARY
//   // ==========================================
//   const fetchActiveTests = useCallback(async () => {
//     try {
//       setIsFetchingTests(true);
//       const res = await tests.get();
//       setAvailableTests(res || []);
//     } catch (error) {
//       toast.error("Dictionary Error", formatApiError(error));
//     } finally {
//       setIsFetchingTests(false);
//     }
//   }, []);

//   // ==========================================
//   // PREFILL FORM ON EDIT OR RESET ON CREATE
//   // ==========================================
//   useEffect(() => {
//     if (isopen) {
//       if (intakeToEdit) {
//         // 1. Demographics
//         setFullName(intakeToEdit.patient_name || "");
//         setPhone(intakeToEdit.patient_phone || "");
//         setAge(intakeToEdit.patient_age ?? "");
//         setGender((intakeToEdit.patient_gender as GenderEnum) || "M");
//         setPriority((intakeToEdit.priority as PriorityEnum) || "Routine");

//         // 2. Billing
//         setPaymentStatus((intakeToEdit.payment_status as PaymentStatusEnum) || "Paid");
//         setPaymentMethod((intakeToEdit.payment_method as PaymentMethodEnum) || "UPI");
//         setDiscountType((intakeToEdit.discount_type as DiscountTypeEnum) || "none");
//         setDiscountValue(intakeToEdit.discount_value ?? "");

//         // 3. Match and Prefill Selected Tests
//         if (availableTests.length > 0) {
//           const editTestIds = intakeToEdit.test_ids || [];
//           const editTestNames = intakeToEdit.tests || [];

//           const matched = availableTests.filter(t => 
//             editTestIds.includes(t.id) || 
//             editTestNames.includes(t.name) || 
//             editTestNames.includes(t.code)
//           );

//           setSelectedTests(matched);
//         }
//       } else {
//         // Clean Reset for New Registration Mode
//         setFullName(""); setPhone(""); setAge(""); setGender("M");
//         setSelectedTests([]); setPriority("Routine"); setPaymentStatus("Paid");
//         setPaymentMethod("UPI"); setDiscountType("percentage"); setDiscountValue("");
//       }
//     }
//   }, [isopen, intakeToEdit, availableTests]);

//   // ==========================================
//   // BILLING CALCULATOR
//   // ==========================================
//   const subtotal = useMemo(() => selectedTests.reduce((sum, test) => sum + Number(test.price), 0), [selectedTests]);

//   const discountAmount = useMemo(() => {
//     if (!discountValue || discountValue <= 0) return 0;
//     const num = Number(discountValue);
//     if (discountType === "percentage") return Math.min(subtotal, Math.round((subtotal * num) / 100));
//     return Math.min(subtotal, num);
//   }, [subtotal, discountType, discountValue]);

//   const finalTotal = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

//   // ==========================================
//   // FORM SUBMISSION (CREATE vs UPDATE)
//   // ==========================================
//   const resetIntakeForm = () => {
//     setFullName(""); setPhone(""); setAge(""); setGender("M");
//     setSelectedTests([]); setPriority("Routine"); setPaymentStatus("Paid");
//     setPaymentMethod("UPI"); setDiscountType("percentage"); setDiscountValue("");
//     onClose();
//   };

//   const handleSubmitIntake = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!fullName || !phone) {
//       toast.warning("Incomplete Form", "Please fill all required patient details.");
//       return;
//     }

//     if (selectedTests.length === 0) {
//       toast.warning("Incomplete Form", "Please select at least one diagnostic test.");
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       let response;
//       if (isEditing && intakeToEdit) {
//         // 🚀 Update Payload
//         const updatePayload = {
//           priority: priority,
//           test_ids: selectedTests.map(t => t.id),
//         };

//         response = await intakeService.updateIntake?.(intakeToEdit.id, updatePayload) || 
//                    await api.put(`/intakes/${intakeToEdit.id}`, updatePayload);
        
//         toast.success("Update Successful", "Intake record updated successfully.");
//       } else {
//         // 🚀 Creation Payload
//         const createPayload = {
//           patient: { name: fullName.trim(), age: Number(age) || 0, gender: gender, phone: phone.trim() },
//           clinical: { priority: priority, test_ids: selectedTests.map(t => t.id) },
//           billing: {
//             payment_status: paymentStatus,
//             payment_method: paymentStatus === "Unpaid" ? "none" : paymentMethod,
//             discount_type: !discountValue || discountValue === 0 ? "none" : discountType,
//             discount_value: Number(discountValue) || 0,
//             paid_amount: paymentStatus === "Paid" ? finalTotal : 0,
//           }
//         };

//         response = await intakeService.createIntake(createPayload);
//         toast.success("Registration Successful", `${fullName} has been registered.`);
//       }

//       resetIntakeForm();
//       if (onSuccess) {
//         onSuccess(response?.data || response); 
//       }
//     } catch (error) {
//       toast.error(isEditing ? "Update Failed" : "Registration Failed", formatApiError(error));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSelectTest = (test: LabTest) => {
//     if (!selectedTests.find(t => t.id === test.id)) setSelectedTests([...selectedTests, test]);
//     setTestSearchQuery("");
//     setIsTestDropdownOpen(false);
//   };
  
//   const handleRemoveTest = (testId: string) => {
//     setSelectedTests(selectedTests.filter(t => t.id !== testId));
//   };
  
//   const filteredComboboxTests = useMemo(() => {
//     const query = testSearchQuery.toLowerCase().trim();
//     return availableTests.filter(test => 
//       !selectedTests.find(t => t.id === test.id) &&
//       ((test.name || "").toLowerCase().includes(query) || (test.code || "").toLowerCase().includes(query))
//     );
//   }, [availableTests, selectedTests, testSearchQuery]);

//   const getDeptIcon = (dept?: string) => {
//     const d = dept || "";
//     if (d.includes("Hematology") || d.includes("Pathology")) return <Droplets size={14} className="text-rose-500" />;
//     if (d.includes("Biochemistry") || d.includes("Tumor")) return <FlaskConical size={14} className="text-amber-500" />;
//     if (d.includes("Endocrinology") || d.includes("Immunology")) return <Dna size={14} className="text-indigo-500" />;
//     if (d.includes("Microbiology") || d.includes("Histopathology")) return <Microscope size={14} className="text-emerald-500" />;
//     return <TestTubes size={14} className="text-cyan-500" />;
//   };

//   useEffect(() => {
//     if (token) { fetchActiveTests(); }
    
//     if (paymentStatus === "Unpaid") {
//       setPaymentMethod("none" as PaymentMethodEnum);
//     }
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsTestDropdownOpen(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [token, fetchActiveTests, paymentStatus]);
  
//   if (!isopen) return null;

//   return (
//     <div className="fixed inset-0 z-[100] flex justify-end">
//       <div 
//         className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
//         onClick={onClose}
//       />

//       {/* Drawer Panel */}
//       <div className="relative w-full md:w-[550px] h-full bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-10">
        
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 bg-white shrink-0 sticky top-0 z-20">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-teal-900 text-white rounded-xl flex items-center justify-center border border-teal-100 shadow-sm">
//               {isEditing ? <Edit3 size={20} strokeWidth={2.5} /> : <User size={20} strokeWidth={2.5} />}
//             </div>
//             <div className="min-w-0">
//               <h1 className="text-sm font-extrabold tracking-tight text-slate-900 truncate">
//                 {isEditing ? `Edit Intake (${intakeToEdit?.accession_number || ''})` : "New Patient Intake"}
//               </h1>
//               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
//                 {isEditing ? "Update Clinical & Workflow Data" : "Registration & Billing"}
//               </p>
//             </div>
//           </div>
//           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none">
//             <X size={20} strokeWidth={2.5} />
//           </button>
//         </div>

//         <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
//           <form id="intake-form" onSubmit={handleSubmitIntake} className="space-y-6">
            
//             {/* SECTION 1: DEMOGRAPHICS (Locked / Uneditable in Edit Mode) */}
//             <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-5 shadow-sm">
//               <div className="flex items-center justify-between border-b border-slate-100 pb-3">
//                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
//                   <User size={14} className="text-teal-900" /> Patient Demographics
//                 </h3>
//                 {isEditing && (
//                   <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-bold tracking-widest uppercase">
//                     <Lock size={10} /> Locked
//                   </span>
//                 )}
//               </div>
//               <div className="space-y-4">
//                 <Input 
//                   label="Full Name"
//                   required
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="e.g. Rahul Sharma"
//                   disabled={isEditing}
//                 />

//                 <Input 
//                   label="Phone Number"
//                   icon={Phone}
//                   required
//                   type="tel"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value)}
//                   placeholder="98765 43210"
//                   disabled={isEditing}
//                 />
                
//                 <div className="grid grid-cols-2 gap-4">
//                   <Input 
//                     label="Age"
//                     type="number"
//                     min="0" max="120"
//                     value={age}
//                     onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
//                     placeholder="Years"
//                     disabled={isEditing}
//                   />
//                   <Select 
//                     label="Gender"
//                     value={gender}
//                     onChange={(e) => setGender(e.target.value as GenderEnum)}
//                     disabled={isEditing}
//                     options={[
//                       { label: "Male", value: "M" },
//                       { label: "Female", value: "F" },
//                       { label: "Other", value: "Other" }
//                     ]}
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* SECTION 2: TEST SELECTION & PRIORITY */}
//             <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-5 shadow-sm">
//               <div className="flex items-center justify-between border-b border-slate-100 pb-3">
//                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
//                   <Activity size={14} className="text-teal-600" /> Diagnostics & Priority
//                 </h3>
//                 <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
//                   {selectedTests.length} Selected
//                 </span>
//               </div>

//               <div className="space-y-4">
//                 {/* Combobox Search */}
//                 <div className="relative" ref={dropdownRef}>
//                   <Input 
//                     label="Search Diagnostics"
//                     icon={isFetchingTests ? Loader2 : Search}
//                     placeholder={isFetchingTests ? "Fetching lab dictionary..." : "Type test name or code (e.g. CBC)..."}
//                     value={testSearchQuery}
//                     onChange={(e) => { setTestSearchQuery(e.target.value); setIsTestDropdownOpen(true); }}
//                     onFocus={() => setIsTestDropdownOpen(true)}
//                   />
                  
//                   {isTestDropdownOpen && (testSearchQuery.length > 0 || filteredComboboxTests.length > 0) && (
//                     <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
//                       {filteredComboboxTests.length === 0 ? (
//                         <div className="p-4 text-center text-xs font-semibold text-slate-400">No active tests matching query.</div>
//                       ) : (
//                         filteredComboboxTests.map(test => (
//                           <button
//                             key={test.id} type="button" onClick={() => handleSelectTest(test)}
//                             className="w-full text-left px-4 py-3 hover:bg-teal-50/60 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-colors outline-none"
//                           >
//                             <div className="min-w-0 pr-2">
//                               <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">{test.name}</div>
//                               <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
//                                 <span>{getDeptIcon(test.department)}</span>
//                                 <span>{test.code}</span>
//                               </div>
//                             </div>
//                             <div className="text-xs font-black font-mono text-slate-900 shrink-0">₹{test.price}</div>
//                           </button>
//                         ))
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Selected Tests Badges */}
//                 {selectedTests.length > 0 && (
//                   <div className="space-y-2">
//                     <div className="flex items-center justify-between">
//                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Tests</span>
//                       <button type="button" onClick={() => setSelectedTests([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline underline-offset-2 outline-none">
//                         Clear All
//                       </button>
//                     </div>
                    
//                     <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
//                       {selectedTests.map(test => (
//                         <div key={test.id} className="inline-flex items-center gap-2 bg-white border border-slate-200 pl-3 pr-1.5 py-1.5 rounded-lg shadow-sm animate-in zoom-in-95 duration-150">
//                           <div className="flex flex-col">
//                             <span className="text-xs font-bold text-slate-800 leading-tight">{test.name}</span>
//                             <span className="text-[9px] font-mono font-bold text-slate-400">₹{test.price}</span>
//                           </div>
//                           <button type="button" onClick={() => handleRemoveTest(test.id)} className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-md transition-colors outline-none ml-1">
//                             <X size={12} strokeWidth={3} />
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* Priority Selector */}
//                 <div>
//                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Priority Level</label>
//                   <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 shadow-inner">
//                     {(['Routine', 'Urgent', 'STAT'] as PriorityEnum[]).map(p => (
//                       <button 
//                         type="button" key={p} onClick={() => setPriority(p)}
//                         className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all outline-none ${
//                           priority === p ? p === 'STAT' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'text-slate-500 hover:text-slate-700'
//                         }`}
//                       >
//                         {p}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* SECTION 3: BILLING */}
//             <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-5 shadow-sm">
//               <div className="flex items-center justify-between border-b border-slate-100 pb-3">
//                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
//                   <Receipt size={14} className="text-teal-600" /> Billing Details
//                 </h3>
//                 {isEditing && (
//                   <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-bold tracking-widest uppercase">
//                     <Lock size={10} /> Locked
//                   </span>
//                 )}
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Discount</label>
//                   <div className="flex gap-2">
//                     <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 shadow-inner">
//                       <button type="button" disabled={isEditing} onClick={() => setDiscountType("percentage")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all outline-none ${discountType === "percentage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>%</button>
//                       <button type="button" disabled={isEditing} onClick={() => setDiscountType("flat")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all outline-none ${discountType === "flat" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>₹</button>
//                     </div>
//                     <div className="relative flex-1">
//                       <Input
//                         type="number" min="0" 
//                         disabled={isEditing}
//                         value={discountValue} 
//                         onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")}
//                         placeholder={discountType === "percentage" ? "Enter % (e.g. 10)" : "Enter Flat ₹"}
//                         icon={Tag}
//                       />
//                     </div>
//                   </div>
//                 </div>
                
//                 {/* Payment Mode & Status Controls */}
//                 <div className="grid grid-cols-2 gap-3">
//                   <Select 
//                     label="Payment Status"
//                     value={paymentStatus} 
//                     disabled={isEditing}
//                     onChange={(e) => setPaymentStatus(e.target.value as PaymentStatusEnum)}
//                     options={[
//                       { label: "Unpaid", value: "Unpaid" },
//                       { label: "Partial", value: "Partial" },
//                       { label: "Paid", value: "Paid" },
//                     ]}
//                   />
//                   <Select 
//                     label="Payment Method"
//                     value={paymentMethod || "none"} 
//                     onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodEnum)}
//                     disabled={isEditing || paymentStatus === "Unpaid"}
//                     options={[
//                       { label: "UPI", value: "UPI" },
//                       { label: "Cash", value: "Cash" },
//                       { label: "Credit/Debit Card", value: "Card" },
//                       { label: "Net Banking", value: "Net_Banking" }
//                     ]}
//                   />
//                 </div>
                
//                 {/* LIVE BILL BREAKDOWN RECEIPT CARD */}
//                 <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 font-mono shadow-xl relative overflow-hidden mt-4">
//                   <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  
//                   <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
//                     <span>Items Total ({selectedTests.length})</span>
//                     <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
//                   </div>

//                   {discountAmount > 0 && (
//                     <div className="flex justify-between items-center text-xs text-emerald-400 border-b border-slate-800 pb-2">
//                       <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Flat"})</span>
//                       <span className="font-bold">- ₹{discountAmount.toLocaleString('en-IN')}</span>
//                     </div>
//                   )}

//                   <div className="flex justify-between items-center pt-1">
//                     <span className="text-xs font-sans font-bold text-slate-300">Final Payable</span>
//                     <span className="text-xl font-black text-teal-400">₹{finalTotal.toLocaleString('en-IN')}</span>
//                   </div>
//                 </div>

//               </div>
//             </div>

//           </form>
//         </div>

//         {/* Footer Actions */}
//         <div className="p-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md flex justify-end gap-3 shrink-0 sticky bottom-0 z-20">
//           <Button variant="secondary" onClick={resetIntakeForm}>
//             Cancel
//           </Button>
//           <Button 
//             type="submit"
//             form="intake-form"
//             disabled={selectedTests.length === 0 || !fullName || !phone || isSubmitting}
//             isLoading={isSubmitting}
//             icon={<CreditCard size={18} strokeWidth={2.5} />}
//           >
//             {isEditing ? "Save Changes" : "Save Intake"}
//           </Button>
//         </div>

//       </div>
//     </div>
//   );
// }

// // "use client";

// // import { Input } from "@/components/ui/Input";
// // import { Activity, CreditCard, Dna, Droplets, FlaskConical, Loader2, Microscope, Phone, Receipt, Search, Tag, TestTubes, User, X, Edit3 } from "lucide-react";
// // import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// // import { DiscountTypeEnum, GenderEnum, LabTest, PaymentMethodEnum, PaymentStatusEnum, PriorityEnum, intakeService } from "../api/intake.service";
// // import { Select } from "@/components/ui/Select";
// // import { useAuthStore } from "@/store/useAuthStore";
// // import { toast } from "@/lib/toast";
// // import { tests } from "../api/tests.service";
// // import { Button } from "@/components/ui/Button";
// // import { api } from "@/lib/axios";
// // import type { IntakeRecord } from "../schemas/intake.schema";

// // interface NewIntakeDrawerProp {
// //   isopen: boolean;
// //   onClose: () => void;
// //   onSuccess?: (newRecord: any) => void;
// //   intakeToEdit?: IntakeRecord | null; // 🚀 Added to support Edit Mode
// // }

// // // ==========================================
// // // ERROR FORMATTER
// // // ==========================================
// // const formatApiError = (error: any): string => {
// //   if (!error.isAxiosError) return error instanceof Error ? error.message : "Unexpected error.";
// //   if (!error.response) return "Network error. Please check your connection.";
// //   const detail = error.response.data?.detail;
// //   if (typeof detail === "string") return detail;
// //   if (Array.isArray(detail)) return detail.map((err) => `${err.loc?.[err.loc.length - 1] || 'Field'}: ${err.msg}`).join(" | ");
// //   return error.message || "A system error occurred.";
// // };

// // export function NewIntakeDrawer({ isopen, onClose, onSuccess, intakeToEdit }: NewIntakeDrawerProp) {
// //   const { token } = useAuthStore();
// //   const isEditing = Boolean(intakeToEdit);
  
// //   const [fullName, setFullName] = useState("");
// //   const [phone, setPhone] = useState("");
// //   const [age, setAge] = useState<number | "">("");
// //   const [gender, setGender] = useState<GenderEnum>("M");

// //   const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
// //   const [isFetchingTests, setIsFetchingTests] = useState(false);
// //   const [availableTests, setAvailableTests] = useState<LabTest[]>([]);
// //   const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
// //   const [testSearchQuery, setTestSearchQuery] = useState("");

// //   const [priority, setPriority] = useState<PriorityEnum>("Routine");

// //   const [paymentStatus, setPaymentStatus] = useState<PaymentStatusEnum>("Paid");
// //   const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>("UPI");
// //   const [discountType, setDiscountType] = useState<DiscountTypeEnum>("percentage");
// //   const [discountValue, setDiscountValue] = useState<number | "">("");

// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const dropdownRef = useRef<HTMLDivElement>(null);

// //   // ==========================================
// //   // PREFILL FORM ON EDIT OR RESET ON CREATE
// //   // ==========================================
// //   useEffect(() => {
// //     if (isopen) {
// //       if (intakeToEdit) {
// //         setFullName(intakeToEdit.patient_name || "");
// //         setPhone(intakeToEdit.patient_phone || "");
// //         setAge(intakeToEdit.patient_age ?? "");
// //         setGender((intakeToEdit.patient_gender as GenderEnum) || "M");
// //         setPriority(intakeToEdit.priority || "Routine");
// //         setPaymentStatus(intakeToEdit.payment_status || "Paid");
// //         setPaymentMethod(intakeToEdit.payment_method || "UPI");
// //         setDiscountType(intakeToEdit.discount_type || "percentage");
// //         setDiscountValue(intakeToEdit.discount_value ?? "");
// //       } else {
// //         setFullName(""); setPhone(""); setAge(""); setGender("M");
// //         setSelectedTests([]); setPriority("Routine"); setPaymentStatus("Paid");
// //         setPaymentMethod("UPI"); setDiscountType("percentage"); setDiscountValue("");
// //       }
// //     }
// //   }, [isopen, intakeToEdit]);

// //   // ==========================================
// //   // BILLING CALCULATOR
// //   // ==========================================
// //   const subtotal = useMemo(() => selectedTests.reduce((sum, test) => sum + Number(test.price), 0), [selectedTests]);

// //   const discountAmount = useMemo(() => {
// //     if (!discountValue || discountValue <= 0) return 0;
// //     const num = Number(discountValue);
// //     if (discountType === "percentage") return Math.min(subtotal, Math.round((subtotal * num) / 100));
// //     return Math.min(subtotal, num);
// //   }, [subtotal, discountType, discountValue]);

// //   const finalTotal = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

// //   // ==========================================
// //   // CRUD OPERATIONS
// //   // ==========================================
// //   const resetIntakeForm = () => {
// //     setFullName(""); setPhone(""); setAge(""); setGender("M");
// //     setSelectedTests([]); setPriority("Routine"); setPaymentStatus("Paid");
// //     setPaymentMethod("UPI"); setDiscountType("percentage"); setDiscountValue("");
// //     onClose();
// //   };

// //   const handleSubmitIntake = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!fullName || !phone) {
// //       toast.warning("Incomplete Form", "Please fill required fields.");
// //       return;
// //     }

// //     setIsSubmitting(true);

// //     try {
// //       let response;
// //       if (isEditing && intakeToEdit) {
// //         // 🚀 Update Payload
// //         const updatePayload = {
// //           priority: priority,
// //           ...(selectedTests.length > 0 && { test_ids: selectedTests.map(t => t.id) }),
// //         };

// //         response = await intakeService.updateIntake?.(intakeToEdit.id, updatePayload) || 
// //                    await api.put(`/intakes/${intakeToEdit.id}`, updatePayload);
        
// //         toast.success("Update Successful", "Intake record updated successfully.");
// //       } else {
// //         // 🚀 Creation Payload
// //         if (selectedTests.length === 0) {
// //           toast.warning("Incomplete Form", "Please select at least one test.");
// //           setIsSubmitting(false);
// //           return;
// //         }

// //         const createPayload = {
// //           patient: { name: fullName.trim(), age: Number(age) || 0, gender: gender, phone: phone.trim() },
// //           clinical: { priority: priority, test_ids: selectedTests.map(t => t.id) },
// //           billing: {
// //             payment_status: paymentStatus,
// //             payment_method: paymentStatus === "Unpaid" ? "none" : paymentMethod,
// //             discount_type: !discountValue || discountValue === 0 ? "none" : discountType,
// //             discount_value: Number(discountValue) || 0,
// //             paid_amount: paymentStatus === "Paid" ? finalTotal : 0,
// //           }
// //         };

// //         response = await intakeService.createIntake(createPayload);
// //         toast.success("Registration Successful", `${fullName} has been registered.`);
// //       }

// //       resetIntakeForm();
// //       if (onSuccess) {
// //         onSuccess(response?.data || response); 
// //       }
// //     } catch (error) {
// //       toast.error(isEditing ? "Update Failed" : "Registration Failed", formatApiError(error));
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   const fetchActiveTests = useCallback(async () => {
// //     try {
// //       setIsFetchingTests(true);
// //       const res = await tests.get();
// //       setAvailableTests(res);
// //     } catch (error) {
// //       toast.error("Dictionary Error", formatApiError(error));
// //     } finally {
// //       setIsFetchingTests(false);
// //     }
// //   }, []);

// //   const handleSelectTest = (test: LabTest) => {
// //     if (!selectedTests.find(t => t.id === test.id)) setSelectedTests([...selectedTests, test]);
// //     setTestSearchQuery("");
// //     setIsTestDropdownOpen(false);
// //   };
  
// //   const handleRemoveTest = (testId: string) => {
// //     setSelectedTests(selectedTests.filter(t => t.id !== testId));
// //   };
  
// //   const filteredComboboxTests = useMemo(() => {
// //     const query = testSearchQuery.toLowerCase().trim();
// //     return availableTests.filter(test => 
// //       !selectedTests.find(t => t.id === test.id) &&
// //       ((test.name || "").toLowerCase().includes(query) || (test.code || "").toLowerCase().includes(query))
// //     );
// //   }, [availableTests, selectedTests, testSearchQuery]);

// //   const getDeptIcon = (dept?: string) => {
// //     const d = dept || "";
// //     if (d.includes("Hematology") || d.includes("Pathology")) return <Droplets size={14} className="text-rose-500" />;
// //     if (d.includes("Biochemistry") || d.includes("Tumor")) return <FlaskConical size={14} className="text-amber-500" />;
// //     if (d.includes("Endocrinology") || d.includes("Immunology")) return <Dna size={14} className="text-indigo-500" />;
// //     if (d.includes("Microbiology") || d.includes("Histopathology")) return <Microscope size={14} className="text-emerald-500" />;
// //     return <TestTubes size={14} className="text-cyan-500" />;
// //   };

// //   useEffect(() => {
// //     if (token) { fetchActiveTests(); }
    
// //     if (paymentStatus === "Unpaid") {
// //       setPaymentMethod("none" as PaymentMethodEnum);
// //     }
// //     const handleClickOutside = (e: MouseEvent) => {
// //       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsTestDropdownOpen(false);
// //     };
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, [token, fetchActiveTests, paymentStatus]);
  
// //   if (!isopen) return null;

// //   return (
// //     <div className="fixed inset-0 z-[100] flex justify-end">
// //       <div 
// //         className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
// //         onClick={onClose}
// //       />

// //       {/* Drawer Panel */}
// //       <div className="relative w-full md:w-[550px] h-full bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-10">
        
// //         {/* Header */}
// //         <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 bg-white shrink-0 sticky top-0 z-20">
// //           <div className="flex items-center gap-3">
// //             <div className="w-10 h-10 bg-teal-900 text-white rounded-xl flex items-center justify-center border border-teal-100 shadow-sm">
// //               {isEditing ? <Edit3 size={20} strokeWidth={2.5} /> : <User size={20} strokeWidth={2.5} />}
// //             </div>
// //             <div className="min-w-0">
// //               <h1 className="text-sm font-extrabold tracking-tight text-slate-900 truncate">
// //                 {isEditing ? `Edit Intake (${intakeToEdit?.accession_number || ''})` : "New Patient Intake"}
// //               </h1>
// //               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
// //                 {isEditing ? "Update Clinical & Workflow Data" : "Registration & Billing"}
// //               </p>
// //             </div>
// //           </div>
// //           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none">
// //             <X size={20} strokeWidth={2.5} />
// //           </button>
// //         </div>

// //         <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
// //           <form id="intake-form" onSubmit={handleSubmitIntake} className="space-y-6">
            
// //             {/* SECTION 1: DEMOGRAPHICS (Locked / Uneditable in Edit Mode) */}
// //             <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-5 shadow-sm">
// //               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
// //                 <User size={14} className="text-teal-900" /> Patient Demographics
// //                 {isEditing && <span className="ml-auto text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">Locked</span>}
// //               </h3>
// //               <div className="space-y-4">
// //                 <Input 
// //                   label="Full Name"
// //                   required
// //                   value={fullName}
// //                   onChange={(e) => setFullName(e.target.value)}
// //                   placeholder="e.g. Rahul Sharma"
// //                   disabled={isEditing}
// //                 />

// //                 <Input 
// //                   label="Phone Number"
// //                   icon={Phone}
// //                   required
// //                   type="tel"
// //                   value={phone}
// //                   onChange={(e) => setPhone(e.target.value)}
// //                   placeholder="98765 43210"
// //                   disabled={isEditing}
// //                 />
                
// //                 <div className="grid grid-cols-2 gap-4">
// //                   <Input 
// //                     label="Age"
// //                     type="number"
// //                     min="0" max="120"
// //                     value={age}
// //                     onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
// //                     placeholder="Years"
// //                     disabled={isEditing}
// //                   />
// //                   <Select 
// //                     label="Gender"
// //                     value={gender}
// //                     onChange={(e) => setGender(e.target.value as GenderEnum)}
// //                     disabled={isEditing}
// //                     options={[
// //                       { label: "Male", value: "M" },
// //                       { label: "Female", value: "F" },
// //                       { label: "Other", value: "Other" }
// //                     ]}
// //                   />
// //                 </div>
// //               </div>
// //             </div>

// //             {/* SECTION 2: TEST SELECTION & PRIORITY */}
// //             <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-5 shadow-sm">
// //               <div className="flex items-center justify-between border-b border-slate-100 pb-3">
// //                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
// //                   <Activity size={14} className="text-teal-600" /> Test Selection & Priority
// //                 </h3>
// //                 {!isEditing && (
// //                   <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
// //                     {selectedTests.length} Selected
// //                   </span>
// //                 )}
// //               </div>

// //               <div className="space-y-4">
// //                 {/* Combobox Search (Only shown or fully active on create or if editable) */}
// //                 {!isEditing && (
// //                   <div className="relative" ref={dropdownRef}>
// //                     <Input 
// //                       label="Search Diagnostics"
// //                       required
// //                       icon={isFetchingTests ? Loader2 : Search}
// //                       placeholder={isFetchingTests ? "Fetching active lab dictionary..." : "Type test name or code (e.g. CBC)..."}
// //                       value={testSearchQuery}
// //                       onChange={(e) => { setTestSearchQuery(e.target.value); setIsTestDropdownOpen(true); }}
// //                       onFocus={() => setIsTestDropdownOpen(true)}
// //                     />
                    
// //                     {isTestDropdownOpen && (testSearchQuery.length > 0 || filteredComboboxTests.length > 0) && (
// //                       <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
// //                         {filteredComboboxTests.length === 0 ? (
// //                           <div className="p-4 text-center text-xs font-semibold text-slate-400">No active tests matching query.</div>
// //                         ) : (
// //                           filteredComboboxTests.map(test => (
// //                             <button
// //                               key={test.id} type="button" onClick={() => handleSelectTest(test)}
// //                               className="w-full text-left px-4 py-3 hover:bg-teal-50/60 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-colors outline-none"
// //                             >
// //                               <div className="min-w-0 pr-2">
// //                                 <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">{test.name}</div>
// //                                 <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
// //                                   <span>{getDeptIcon(test.department)}</span>
// //                                   <span>{test.code}</span>
// //                                 </div>
// //                               </div>
// //                               <div className="text-xs font-black font-mono text-slate-900 shrink-0">₹{test.price}</div>
// //                             </button>
// //                           ))
// //                         )}
// //                       </div>
// //                     )}
// //                   </div>
// //                 )}

// //                 {/* Selected Tests Badges */}
// //                 {!isEditing && selectedTests.length > 0 && (
// //                   <div className="space-y-2">
// //                     <div className="flex items-center justify-between">
// //                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added Tests</span>
// //                       <button type="button" onClick={() => setSelectedTests([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline underline-offset-2 outline-none">
// //                         Clear All
// //                       </button>
// //                     </div>
                    
// //                     <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
// //                       {selectedTests.map(test => (
// //                         <div key={test.id} className="inline-flex items-center gap-2 bg-white border border-slate-200 pl-3 pr-1.5 py-1.5 rounded-lg shadow-sm animate-in zoom-in-95 duration-150">
// //                           <div className="flex flex-col">
// //                             <span className="text-xs font-bold text-slate-800 leading-tight">{test.name}</span>
// //                             <span className="text-[9px] font-mono font-bold text-slate-400">₹{test.price}</span>
// //                           </div>
// //                           <button type="button" onClick={() => handleRemoveTest(test.id)} className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-md transition-colors outline-none ml-1">
// //                             <X size={12} strokeWidth={3} />
// //                           </button>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   </div>
// //                 )}

// //                 {/* Priority Selector */}
// //                 <div>
// //                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Priority Level</label>
// //                   <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 shadow-inner">
// //                     {(['Routine', 'Urgent', 'STAT'] as PriorityEnum[]).map(p => (
// //                       <button 
// //                         type="button" key={p} onClick={() => setPriority(p)}
// //                         className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all outline-none ${
// //                           priority === p ? p === 'STAT' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'text-slate-500 hover:text-slate-700'
// //                         }`}
// //                       >
// //                         {p}
// //                       </button>
// //                     ))}
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>

// //             {/* SECTION 3: BILLING */}
// //             {!isEditing && (
// //               <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-5 shadow-sm">
// //                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
// //                   <Receipt size={14} className="text-teal-600" /> Billing & Payment Details
// //                 </h3>

// //                 <div className="space-y-4">
// //                   <div>
// //                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Apply Discount</label>
// //                     <div className="flex gap-2">
// //                       <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 shadow-inner">
// //                         <button type="button" onClick={() => setDiscountType("percentage")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all outline-none ${discountType === "percentage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>%</button>
// //                         <button type="button" onClick={() => setDiscountType("flat")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all outline-none ${discountType === "flat" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>₹</button>
// //                       </div>
// //                       <div className="relative flex-1">
// //                         <Input
// //                           type="number" min="0" 
// //                           value={discountValue} 
// //                           onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")}
// //                           placeholder={discountType === "percentage" ? "Enter % (e.g. 10)" : "Enter Flat ₹"}
// //                           icon={Tag}
// //                         />
// //                       </div>
// //                     </div>
// //                   </div>
                  
// //                   {/* Payment Mode & Status Controls */}
// //                   <div className="grid grid-cols-2 gap-3">
// //                     <Select 
// //                       label="Payment Status"
// //                       value={paymentStatus} 
// //                       onChange={(e) => setPaymentStatus(e.target.value as PaymentStatusEnum)}
// //                       options={[
// //                         { label: "Unpaid", value: "Unpaid" },
// //                         { label: "Partial", value: "Partial" },
// //                         { label: "Paid", value: "Paid" },
// //                       ]}
// //                     />
// //                     <Select 
// //                       label="Payment Method"
// //                       value={paymentMethod || "none"} 
// //                       onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodEnum)}
// //                       disabled={paymentStatus === "Unpaid"}
// //                       options={[
// //                         { label: "UPI", value: "UPI" },
// //                         { label: "Cash", value: "Cash" },
// //                         { label: "Credit/Debit Card", value: "Card" },
// //                         { label: "Net Banking", value: "Net_Banking" }
// //                       ]}
// //                     />
// //                   </div>
                  
// //                   {/* LIVE BILL BREAKDOWN RECEIPT CARD */}
// //                   <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 font-mono shadow-xl relative overflow-hidden mt-4">
// //                     <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    
// //                     <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
// //                       <span>Items Total ({selectedTests.length})</span>
// //                       <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
// //                     </div>

// //                     {discountAmount > 0 && (
// //                       <div className="flex justify-between items-center text-xs text-emerald-400 border-b border-slate-800 pb-2">
// //                         <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Flat"})</span>
// //                         <span className="font-bold">- ₹{discountAmount.toLocaleString('en-IN')}</span>
// //                       </div>
// //                     )}

// //                     <div className="flex justify-between items-center pt-1">
// //                       <span className="text-xs font-sans font-bold text-slate-300">Final Payable</span>
// //                       <span className="text-xl font-black text-teal-400">₹{finalTotal.toLocaleString('en-IN')}</span>
// //                     </div>
// //                   </div>

// //                 </div>
// //               </div>
// //             )}

// //           </form>
// //         </div>

// //         {/* Footer Actions */}
// //         <div className="p-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md flex justify-end gap-3 shrink-0 sticky bottom-0 z-20">
// //           <Button variant="secondary" onClick={resetIntakeForm}>
// //             Cancel
// //           </Button>
// //           <Button 
// //             type="submit"
// //             form="intake-form"
// //             disabled={(!isEditing && selectedTests.length === 0) || !fullName || !phone || isSubmitting}
// //             isLoading={isSubmitting}
// //             icon={<CreditCard size={18} strokeWidth={2.5} />}
// //           >
// //             {isEditing ? "Save Changes" : "Save Intake"}
// //           </Button>
// //         </div>

// //       </div>
// //     </div>
// //   );
// // }
// // // import { Input } from "@/components/ui/Input";
// // // import { Activity, CreditCard, Dna, Droplets, FlaskConical, Loader2, Microscope, Phone, Receipt, Search, Tag, TestTubes, User, X } from "lucide-react";
// // // import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// // // import { DiscountTypeEnum, GenderEnum, LabTest, PaymentMethodEnum, PaymentStatusEnum, PriorityEnum, intakeService } from "../api/intake.service";
// // // import { Select } from "@/components/ui/Select";
// // // import { useAuthStore } from "@/store/useAuthStore";
// // // import { toast } from "@/lib/toast";
// // // import { tests } from "../api/tests.service";
// // // import { Button } from "@/components/ui/Button";

// // // interface NewIntakeDrawerProp {
// // //   isopen: boolean;
// // //   onClose: () => void;
// // //   onSuccess?: (newRecord: any) => void;
// // // }

// // // // ==========================================
// // // // ERROR FORMATTER
// // // // ==========================================
// // // const formatApiError = (error: any): string => {
// // //   if (!error.isAxiosError) return error instanceof Error ? error.message : "Unexpected error.";
// // //   if (!error.response) return "Network error. Please check your connection.";
// // //   const detail = error.response.data?.detail;
// // //   if (typeof detail === "string") return detail;
// // //   if (Array.isArray(detail)) return detail.map((err) => `${err.loc?.[err.loc.length - 1] || 'Field'}: ${err.msg}`).join(" | ");
// // //   return error.message || "A system error occurred.";
// // // };

// // // export function NewIntakeDrawer({isopen, onClose, onSuccess}: NewIntakeDrawerProp){
// // //   const { token } = useAuthStore();
  
// // //   const [fullName, setFullName] = useState("");
// // //   const [phone, setPhone] = useState("");
// // //   const [age, setAge] = useState<number | "">("");
// // //   const [gender, setGender] = useState<GenderEnum>("M");

// // //   const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
// // //   const [isFetchingTests, setIsFetchingTests] = useState(false);
// // //   const [availableTests, setAvailableTests] = useState<LabTest[]>([]);
// // //   const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
// // //   const [testSearchQuery, setTestSearchQuery] = useState("");

// // //   const [priority, setPriority] = useState<PriorityEnum>("Routine");

// // //   const [paymentStatus, setPaymentStatus] = useState<PaymentStatusEnum>("Paid");
// // //   const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>("UPI");
// // //   const [discountType, setDiscountType] = useState<DiscountTypeEnum>("percentage");
// // //   const [discountValue, setDiscountValue] = useState<number | "">("");

// // //   const [isSubmitting, setIsSubmitting] = useState(false);
// // //   const dropdownRef = useRef<HTMLDivElement>(null);

// // //   // ==========================================
// // //   // BILLING CALCULATOR
// // //   // ==========================================
// // //   const subtotal = useMemo(() => selectedTests.reduce((sum, test) => sum + Number(test.price), 0), [selectedTests]);

// // //   const discountAmount = useMemo(() => {
// // //     if (!discountValue || discountValue <= 0) return 0;
// // //     const num = Number(discountValue);
// // //     if (discountType === "percentage") return Math.min(subtotal, Math.round((subtotal * num) / 100));
// // //     return Math.min(subtotal, num);
// // //   }, [subtotal, discountType, discountValue]);

// // //   const finalTotal = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);


// // //   // ==========================================
// // //   // CRUD OPERATIONS
// // //   // ==========================================
// // //   const resetIntakeForm = () => {
// // //     setFullName(""); setPhone(""); setAge(""); setGender("M");
// // //     setSelectedTests([]); setPriority("Routine"); setPaymentStatus("Paid");
// // //     setPaymentMethod("UPI"); setDiscountType("percentage"); setDiscountValue("");
// // //     onClose();
// // //   };

// // //   const handleSubmitIntake = async (e: React.SubmitEvent) => {
// // //     e.preventDefault();
// // //     if (!fullName || !phone || selectedTests.length === 0) {
// // //       toast.warning("Incomplete Form", "Please fill required fields and select at least one test.");
// // //       return;
// // //     }

// // //     setIsSubmitting(true);
// // //     const payload = {
// // //       patient: { name: fullName.trim(), age: Number(age) || 0, gender: gender, phone: phone.trim() },
// // //       clinical: { priority: priority, test_ids: selectedTests.map(t => t.id) },
// // //       billing: {
// // //         payment_status: paymentStatus,
// // //         payment_method: paymentStatus === "Unpaid" ? "none" : paymentMethod,
// // //         discount_type: !discountValue || discountValue === 0 ? "none" : discountType,
// // //         discount_value: Number(discountValue) || 0,
// // //         paid_amount: paymentStatus === "Paid" ? finalTotal : 0,
// // //       }
// // //     };

// // //     try {
// // //       const response = await intakeService.createIntake(payload);
// // //       toast.success("Registration Successful", `${fullName} has been registered.`);
// // //       resetIntakeForm();
      
// // //       if (onSuccess) {
// // //         onSuccess(response?.data || response); 
// // //       }
// // //     } catch (error) {
// // //       toast.error("Registration Failed", formatApiError(error));
// // //     } finally {
// // //       setIsSubmitting(false);
// // //     }
// // //   };

// // //   const fetchActiveTests = useCallback(async () => {
// // //     try {
// // //       setIsFetchingTests(true);
// // //       const res = await tests.get();
// // //       setAvailableTests(res);
// // //     } catch (error) {
// // //       toast.error("Dictionary Error", formatApiError(error));
// // //     } finally {
// // //       setIsFetchingTests(false);
// // //     }
// // //   }, []);


// // //   // ==========================================
// // //   // HELPERS & NULL-SAFE FILTERS
// // //   // ==========================================
  
// // //   const handleSelectTest = (test: LabTest) => {
// // //     if (!selectedTests.find(t => t.id === test.id)) setSelectedTests([...selectedTests, test]);
// // //     setTestSearchQuery("");
// // //     setIsTestDropdownOpen(false);
// // //   };
  
// // //   const handleRemoveTest = (testId: string) => {
// // //     setSelectedTests(selectedTests.filter(t => t.id !== testId));
// // //   };
  
// // //   const filteredComboboxTests = useMemo(() => {
// // //     const query = testSearchQuery.toLowerCase().trim();
// // //     return availableTests.filter(test => 
// // //       !selectedTests.find(t => t.id === test.id) &&
// // //       ((test.name || "").toLowerCase().includes(query) || (test.code || "").toLowerCase().includes(query))
// // //     );
// // //   }, [availableTests, selectedTests, testSearchQuery]);


// // //   const getDeptIcon = (dept?: string) => {
// // //     const d = dept || "";
// // //     if (d.includes("Hematology") || d.includes("Pathology")) return <Droplets size={14} className="text-rose-500" />;
// // //     if (d.includes("Biochemistry") || d.includes("Tumor")) return <FlaskConical size={14} className="text-amber-500" />;
// // //     if (d.includes("Endocrinology") || d.includes("Immunology")) return <Dna size={14} className="text-indigo-500" />;
// // //     if (d.includes("Microbiology") || d.includes("Histopathology")) return <Microscope size={14} className="text-emerald-500" />;
// // //     return <TestTubes size={14} className="text-cyan-500" />;
// // //   };

// // //   useEffect(() => {
  
// // //     if (token) { fetchActiveTests(); }
    
// // //     if (paymentStatus === "Unpaid") {
// // //       // Backend requires "none" if unpaid
// // //       setPaymentMethod("none" as PaymentMethodEnum);
// // //     }
// // //     const handleClickOutside = (e: MouseEvent) => {
// // //       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsTestDropdownOpen(false);
// // //     };
// // //     document.addEventListener("mousedown", handleClickOutside);
// // //     return () => document.removeEventListener("mousedown", handleClickOutside);

// // //   }, [token, fetchActiveTests, paymentStatus]);
  
// // //   if (!isopen) return null;
// // //   return (
// // //       <div className="fixed inset-0 z-[100] flex justify-end">
// // //         <div 
// // //           className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
// // //           onClick={onClose}
// // //         />

// // //         {/* Drawer Panel */}
// // //         <div className="relative w-full md:w-[550px] h-full bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-10">
// // //           {/* Header */}
// // //           <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 bg-white shrink-0 sticky top-0 z-20">
// // //             <div className="flex items-center gap-3">
// // //               <div className="w-10 h-10 bg-teal-900 text-white rounded-xl flex items-center justify-center border border-teal-100 shadow-sm">
// // //                 <User size={20} strokeWidth={2.5} />
// // //               </div>
// // //               <div className="min-w-0">
// // //                 <h1 className="text-sm font-extrabold tracking-tight text-slate-900 truncate">New Patient Intake</h1>
// // //                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Registration & Billing</p>
// // //               </div>
// // //             </div>
// // //             <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none">
// // //               <X size={20} strokeWidth={2.5} />
// // //             </button>
// // //           </div>

// // //           <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
// // //             <form id="intake-form" onSubmit={handleSubmitIntake} className="space-y-6">
// // //               {/* SECTION 1: DEMOGRAPHICS */}
// // //               <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-5 shadow-sm">
// // //                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
// // //                   <User size={14} className="text-teal-900" /> Patient Demographics
// // //                 </h3>
// // //                 <div className="space-y-4">
// // //                   <Input 
// // //                     label="Full Name"
// // //                     required
// // //                     value={fullName}
// // //                     onChange={(e) => setFullName(e.target.value)}
// // //                     placeholder="e.g. Rahul Sharma"
// // //                   />

// // //                  <Input 
// // //                     label="Phone Number"
// // //                     icon={Phone}
// // //                     required
// // //                     type="tel"
// // //                     value={phone}
// // //                     onChange={(e) => setPhone(e.target.value)}
// // //                     placeholder="98765 43210"
// // //                   />
// // //                   <div className="grid grid-cols-2 gap-4">
// // //                     <Input 
// // //                       label="Age"
// // //                       type="number"
// // //                       min="0" max="120"
// // //                       value={age}
// // //                       onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
// // //                       placeholder="Years"
// // //                     />
// // //                     <Select 
// // //                       label="Gender"
// // //                       value={gender}
// // //                       onChange={(e) => setGender(e.target.value as GenderEnum)}
// // //                       options={[
// // //                         { label: "Male", value: "M" },
// // //                         { label: "Female", value: "F" },
// // //                         { label: "Other", value: "Other" }
// // //                       ]}
// // //                     />
// // //                   </div>
// // //                 </div>
// // //               </div>

// // //               {/* SECTION 2: TEST SELECTION */}
// // //               <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-5 shadow-sm">
// // //                 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
// // //                   <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
// // //                     <Activity size={14} className="text-teal-600" /> Test Selection
// // //                   </h3>
// // //                   <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
// // //                     {selectedTests.length} Selected
// // //                   </span>
// // //                 </div>

// // //                 <div className="space-y-4">
// // //                   {/* Combobox Search */}
// // //                   <div className="relative" ref={dropdownRef}>
// // //                     <Input 
// // //                       label="Search Diagnostics"
// // //                       required
// // //                       icon={isFetchingTests ? Loader2 : Search}
// // //                       placeholder={isFetchingTests ? "Fetching active lab dictionary..." : "Type test name or code (e.g. CBC)..."}
// // //                       value={testSearchQuery}
// // //                       onChange={(e) => { setTestSearchQuery(e.target.value); setIsTestDropdownOpen(true); }}
// // //                       onFocus={() => setIsTestDropdownOpen(true)}
// // //                     />
                    
// // //                     {isTestDropdownOpen && (testSearchQuery.length > 0 || filteredComboboxTests.length > 0) && (
// // //                       <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
// // //                         {filteredComboboxTests.length === 0 ? (
// // //                           <div className="p-4 text-center text-xs font-semibold text-slate-400">No active tests matching query.</div>
// // //                         ) : (
// // //                           filteredComboboxTests.map(test => (
// // //                             <button
// // //                               key={test.id} type="button" onClick={() => handleSelectTest(test)}
// // //                               className="w-full text-left px-4 py-3 hover:bg-teal-50/60 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-colors outline-none"
// // //                             >
// // //                               <div className="min-w-0 pr-2">
// // //                                 <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">{test.name}</div>
// // //                                 <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
// // //                                   <span>{getDeptIcon(test.department)}</span>
// // //                                   <span>{test.code}</span>
// // //                                 </div>
// // //                               </div>
// // //                               <div className="text-xs font-black font-mono text-slate-900 shrink-0">₹{test.price}</div>
// // //                             </button>
// // //                           ))
// // //                         )}
// // //                       </div>
// // //                     )}
// // //                   </div>

// // //                   {/* Selected Tests Badges */}
// // //                   {selectedTests.length > 0 && (
// // //                     <div className="space-y-2">
// // //                       <div className="flex items-center justify-between">
// // //                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added Tests</span>
// // //                         <button type="button" onClick={() => setSelectedTests([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline underline-offset-2 outline-none">
// // //                           Clear All
// // //                         </button>
// // //                       </div>
                      
// // //                       <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
// // //                         {selectedTests.map(test => (
// // //                           <div key={test.id} className="inline-flex items-center gap-2 bg-white border border-slate-200 pl-3 pr-1.5 py-1.5 rounded-lg shadow-sm animate-in zoom-in-95 duration-150">
// // //                             <div className="flex flex-col">
// // //                               <span className="text-xs font-bold text-slate-800 leading-tight">{test.name}</span>
// // //                               <span className="text-[9px] font-mono font-bold text-slate-400">₹{test.price}</span>
// // //                             </div>
// // //                             <button type="button" onClick={() => handleRemoveTest(test.id)} className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-md transition-colors outline-none ml-1">
// // //                               <X size={12} strokeWidth={3} />
// // //                             </button>
// // //                           </div>
// // //                         ))}
// // //                       </div>
// // //                     </div>
// // //                   )}

// // //                   {/* Priority Selector */}
// // //                   <div>
// // //                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Priority Level</label>
// // //                     <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 shadow-inner">
// // //                       {(['Routine', 'Urgent', 'STAT'] as PriorityEnum[]).map(p => (
// // //                         <button 
// // //                           type="button" key={p} onClick={() => setPriority(p)}
// // //                           className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all outline-none ${
// // //                             priority === p ? p === 'STAT' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'text-slate-500 hover:text-slate-700'
// // //                           }`}
// // //                         >
// // //                           {p}
// // //                         </button>
// // //                       ))}
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //               {/* SECTION 3: BILLING */}
// // //               <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-5 shadow-sm">
// // //                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
// // //                   <Receipt size={14} className="text-teal-600" /> Billing & Payment Details
// // //                 </h3>

// // //                 <div className="space-y-4">
// // //                   <div>
// // //                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Apply Discount</label>
// // //                     <div className="flex gap-2">
// // //                       <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 shadow-inner">
// // //                         <button type="button" onClick={() => setDiscountType("percentage")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all outline-none ${discountType === "percentage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>%</button>
// // //                         <button type="button" onClick={() => setDiscountType("flat")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all outline-none ${discountType === "flat" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>₹</button>
// // //                       </div>
// // //                       <div className="relative flex-1">
// // //                         <Input
// // //                           type="number" min="0" 
// // //                           value={discountValue} 
// // //                           onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")}
// // //                           placeholder={discountType === "percentage" ? "Enter % (e.g. 10)" : "Enter Flat ₹"}
// // //                           icon={Tag}
// // //                         />
// // //                       </div>
// // //                     </div>
// // //                   </div>
                  
// // //                   {/* Payment Mode & Status Controls */}
// // //                   <div className="grid grid-cols-2 gap-3">
// // //                     <Select 
// // //                       label="Payment Status"
// // //                       value={paymentStatus} 
// // //                       onChange={(e) => setPaymentStatus(e.target.value as PaymentStatusEnum)}
// // //                       options={[
// // //                         { label: "Unpaid", value: "Unpaid" },
// // //                         { label: "Partial", value: "Partial" },
// // //                         { label: "Paid", value: "Paid" },
// // //                       ]}
// // //                     />
// // //                     <Select 
// // //                       label="Payment Method"
// // //                       value={paymentMethod || "none"} 
// // //                       onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodEnum)}
// // //                       disabled={paymentStatus === "Unpaid"}
// // //                       options={[
// // //                         { label: "UPI", value: "UPI" },
// // //                         { label: "Cash", value: "Cash" },
// // //                         { label: "Credit/Debit Card", value: "Card" },
// // //                         { label: "Net Banking", value: "Net_Banking" }
// // //                       ]}
// // //                     />
// // //                   </div>
                  
// // //                   {/* LIVE BILL BREAKDOWN RECEIPT CARD */}
// // //                   <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 font-mono shadow-xl relative overflow-hidden mt-4">
// // //                     <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    
// // //                     <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
// // //                       <span>Items Total ({selectedTests.length})</span>
// // //                       <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
// // //                     </div>

// // //                     {discountAmount > 0 && (
// // //                       <div className="flex justify-between items-center text-xs text-emerald-400 border-b border-slate-800 pb-2">
// // //                         <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Flat"})</span>
// // //                         <span className="font-bold">- ₹{discountAmount.toLocaleString('en-IN')}</span>
// // //                       </div>
// // //                     )}

// // //                     <div className="flex justify-between items-center pt-1">
// // //                       <span className="text-xs font-sans font-bold text-slate-300">Final Payable</span>
// // //                       <span className="text-xl font-black text-teal-400">₹{finalTotal.toLocaleString('en-IN')}</span>
// // //                     </div>
// // //                   </div>

// // //                 </div>
// // //               </div>
// // //             </form>
// // //           </div>

// // //           {/* Footer Actions */}
// // //           <div className="p-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md flex justify-end gap-3 shrink-0 sticky bottom-0 z-20">
// // //             <Button variant="secondary" onClick={resetIntakeForm}>
// // //               Cancel
// // //             </Button>
// // //             <Button 
// // //               type="submit"
// // //               form="intake-form"
// // //               disabled={selectedTests.length === 0 || !fullName || !phone || isSubmitting}
// // //               isLoading={isSubmitting}
// // //               icon={<CreditCard size={18} strokeWidth={2.5} />}
// // //             >
// // //               Save Intake
// // //             </Button>
// // //           </div>

// // //         </div>
// // //       </div>
// // //   )
// // // }

// // // import { Button } from "@/components/ui/Button";
// // // import { Input } from "@/components/ui/Input";
// // // import { Select } from "@/components/ui/Select";
// // // import { toast } from "@/lib/toast";
// // // import { Activity, CreditCard, Dna, Droplets, FlaskConical, Loader2, Microscope, Phone, Receipt, Search, Tag, TestTubes, User, X } from "lucide-react";
// // // import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// // // import { DiscountTypeEnum, GenderEnum, LabTest, PaymentMethodEnum, PaymentStatusEnum, PriorityEnum } from "../api/intake.service";
// // // import { api } from "@/lib/axios";
// // // import { useAuthStore } from "@/store/useAuthStore";

// // // interface NewIntakeDrawerProp {
// // //   isopen: boolean;
// // //   onClose: () => void;
// // // }

// // // // ==========================================
// // // // ERROR FORMATTER
// // // // ==========================================
// // // const formatApiError = (error: any): string => {
// // //   if (!error.isAxiosError) return error instanceof Error ? error.message : "Unexpected error.";
// // //   if (!error.response) return "Network error. Please check your connection.";
// // //   const detail = error.response.data?.detail;
// // //   if (typeof detail === "string") return detail;
// // //   if (Array.isArray(detail)) return detail.map((err) => `${err.loc?.[err.loc.length - 1] || 'Field'}: ${err.msg}`).join(" | ");
// // //   return error.message || "A system error occurred.";
// // // };

// // // export function NewIntakeDrawer({isopen, onClose}: NewIntakeDrawerProp){
// // //   const { token } = useAuthStore();

// // //   const [fullName, setFullName] = useState("");
// // //   const [phone, setPhone] = useState("");
// // //   const [age, setAge] = useState<number | "">("");
// // //   const [gender, setGender] = useState<GenderEnum>("M");
  
// // //   const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
// // //   const [isFetchingTests, setIsFetchingTests] = useState(false);
// // //   const [availableTests, setAvailableTests] = useState<LabTest[]>([]);
// // //   const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
// // //   const [testSearchQuery, setTestSearchQuery] = useState("");

// // //   const [priority, setPriority] = useState<PriorityEnum>("Routine");

// // //   const [paymentStatus, setPaymentStatus] = useState<PaymentStatusEnum>("Paid");
// // //   const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>("upi");
// // //   const [discountType, setDiscountType] = useState<DiscountTypeEnum>("percentage");
// // //   const [discountValue, setDiscountValue] = useState<number | "">("");
// // //   const [paidAmountInput, setPaidAmountInput] = useState<number | "">("");

// // //   const [isSubmitting, setIsSubmitting] = useState(false);
  
// // //   const dropdownRef = useRef<HTMLDivElement>(null);

// // //   // ==========================================
// // //   // CRUD OPERATIONS
// // //   // ==========================================

// // //   const resetIntakeForm = () => {
// // //     setFullName(""); setPhone(""); setAge(""); setGender("M");
// // //     setSelectedTests([]); setPriority("Routine"); setPaymentStatus("Paid");
// // //     setPaymentMethod("upi"); setDiscountType("percentage"); setDiscountValue("");
// // //     setPaidAmountInput(""); onClose();
// // //   };

// // //   const handleSubmitIntake = async (e: React.FormEvent) => {
// // //     e.preventDefault();
// // //     if (!fullName || !phone || selectedTests.length === 0) {
// // //       toast.warning("Incomplete Form", "Please fill required fields and select a test.");
// // //       return;
// // //     }

// // //     setIsSubmitting(true);
// // //     const payload = {
// // //       patient: { name: fullName.trim(), age: Number(age) || 0, gender: gender, phone: phone.trim() },
// // //       clinical: { priority: priority, test_ids: selectedTests.map(t => t.id) },
// // //       billing: {
// // //         payment_status: paymentStatus,
// // //         payment_method: paymentStatus === "unpaid" ? "none" : paymentMethod,
// // //         discount_type: !discountValue || discountValue === 0 ? "none" : discountType,
// // //         discount_value: Number(discountValue) || 0,
// // //         paid_amount: paymentStatus === "paid" ? finalTotal : paymentStatus === "partial" ? Number(paidAmountInput) : 0,
// // //       }
// // //     };

// // //     try {
// // //       await api.post('/intakes', payload);
// // //       toast.success("Registration Successful", `${fullName} has been registered.`);
// // //       resetIntakeForm();
// // //     } catch (error) {
// // //       toast.error("Registration Failed", formatApiError(error));
// // //     } finally {
// // //       setIsSubmitting(false);
// // //     }
// // //   };


  
// // //   const fetchActiveTests = useCallback(async () => {
// // //     try {
// // //       setIsFetchingTests(true);
// // //       const res = await api.get('/tests?is_active=true');
// // //       setAvailableTests(res.data);
// // //     } catch (error) {
// // //       toast.error("Dictionary Error", formatApiError(error));
// // //     } finally {
// // //       setIsFetchingTests(false);
// // //     }
// // //   }, []);

// // //   // ==========================================
// // //   // BILLING CALCULATOR
// // //   // ==========================================
// // //   const subtotal = useMemo(() => selectedTests.reduce((sum, test) => sum + Number(test.price), 0), [selectedTests]);

// // //   const discountAmount = useMemo(() => {
// // //     if (!discountValue || discountValue <= 0) return 0;
// // //     const num = Number(discountValue);
// // //     if (discountType === "percentage") return Math.min(subtotal, Math.round((subtotal * num) / 100));
// // //     return Math.min(subtotal, num);
// // //   }, [subtotal, discountType, discountValue]);

// // //   const finalTotal = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

// // //   useEffect(() => {
// // //     if (paymentStatus === "paid") {
// // //       setPaidAmountInput(finalTotal);
// // //       if (paymentMethod === "none") setPaymentMethod("upi");
// // //     } else if (paymentStatus === "unpaid") {
// // //       setPaidAmountInput(0);
// // //       setPaymentMethod("none");
// // //     } else if (paymentStatus === "partial") {
// // //       if (paymentMethod === "none") setPaymentMethod("upi");
// // //     }
// // //   }, [paymentStatus, finalTotal, paymentMethod]);

// // //   // ==========================================
// // //   // HELPERS & NULL-SAFE FILTERS
// // //   // ==========================================
// // //   const handleSelectTest = (test: LabTest) => {
// // //     if (!selectedTests.find(t => t.id === test.id)) setSelectedTests([...selectedTests, test]);
// // //     setTestSearchQuery("");
// // //     setIsTestDropdownOpen(false);
// // //   };

// // //   const handleRemoveTest = (testId: string) => {
// // //     setSelectedTests(selectedTests.filter(t => t.id !== testId));
// // //   };

// // //   const filteredComboboxTests = useMemo(() => {
// // //     const query = testSearchQuery.toLowerCase().trim();
// // //     return availableTests.filter(test => 
// // //       !selectedTests.find(t => t.id === test.id) &&
// // //       ((test.name || "").toLowerCase().includes(query) || (test.code || "").toLowerCase().includes(query))
// // //     );
// // //   }, [availableTests, selectedTests, testSearchQuery]);

// // //   const getDeptIcon = (dept?: string) => {
// // //     const d = dept || "";
// // //     if (d.includes("Hematology") || d.includes("Pathology")) return <Droplets size={14} className="text-rose-500" />;
// // //     if (d.includes("Biochemistry") || d.includes("Tumor")) return <FlaskConical size={14} className="text-amber-500" />;
// // //     if (d.includes("Endocrinology") || d.includes("Immunology")) return <Dna size={14} className="text-indigo-500" />;
// // //     if (d.includes("Microbiology") || d.includes("Histopathology")) return <Microscope size={14} className="text-emerald-500" />;
// // //     return <TestTubes size={14} className="text-cyan-500" />;
// // //   };
  
// // //   useEffect(() => {
// // //     if (token) { fetchActiveTests(); }
// // //     const handleClickOutside = (e: MouseEvent) => {
// // //       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsTestDropdownOpen(false);
// // //     };
// // //     document.addEventListener("mousedown", handleClickOutside);
// // //     return () => document.removeEventListener("mousedown", handleClickOutside);
// // //   }, [fetchActiveTests]);

// // //   if (!isopen) return null;

// // //   return (
// // //     <>
// // //     {/* ========================================================= */}
// // //     {/* 4. DRAWER: NEW PATIENT INTAKE REGISTRATION                */}
// // //     {/* ========================================================= */}
// // //     {isopen && (
// // //       <div className="fixed inset-0 z-[100] flex justify-end">
// // //         <div 
// // //         className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in"
// // //         onClick={onClose}
// // //         />
        
// // //         <div className="relative w-full md:w-[550px] h-full bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-10">
          
// // //           <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
// // //                <div className="flex items-center gap-3">
// // //                  <div className="w-10 h-10 bg-teal-900 text-white rounded-xl flex items-center justify-center border border-teal-100 shadow-sm">
// // //                    <User size={20} strokeWidth={2.5} />
// // //                  </div>
// // //                  <div className="min-w-0">
// // //                   <h1 className="text-sm font-extrabold tracking-tight text-slate-900 truncate">New Patient Intake</h1>
// // //                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Registration & Billing</p>
// // //                 </div>
// // //                </div>
               
// // //                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none">
// // //                  <X size={20} strokeWidth={2.5} />
// // //                </button>
// // //           </div>

// // //           <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
// // //             <form onSubmit={handleSubmitIntake} className="space-y-6">
// // //               <div className="bg-white p-5 border border-xl border-slate-200/80 space-y-5">
// // //                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
// // //                   <User size={14} className="text-teal-900" /> Patient Demographics
// // //                 </h3>
// // //                 <div className="space-y-4">
// // //                      <Input 
// // //                        label="Full Name"
// // //                        required
// // //                        value={fullName}
// // //                        onChange={(e) => setFullName(e.target.value)}
// // //                        placeholder="e.g. Rahul Sharma"
// // //                      />

// // //                      <Input 
// // //                        label="Phone Number"
// // //                        icon={Phone}
// // //                        required
// // //                        type="tel"
// // //                        value={phone}
// // //                        onChange={(e) => setPhone(e.target.value)}
// // //                        placeholder="98765 43210"
// // //                      />

// // //                      <div className="grid grid-cols-2 gap-4">
// // //                         <Input 
// // //                           label="Age"
// // //                           type="number"
// // //                           min="0" max="120"
// // //                           value={age}
// // //                           onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
// // //                           placeholder="Years"
// // //                         />
// // //                         <Select 
// // //                           label="Gender"
// // //                           value={gender}
// // //                           onChange={(e) => setGender(e.target.value as any)}
// // //                           options={[
// // //                             { label: "Male", value: "M" },
// // //                             { label: "Female", value: "F" },
// // //                             { label: "Other", value: "Other" }
// // //                           ]}
// // //                         />
// // //                       </div>
// // //                 </div>
// // //               </div>

// // //               {/* SECTION 2: MULTI-SELECT DIAGNOSTIC TESTS */}
// // //               <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-5">
// // //                 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
// // //                   <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
// // //                     <Activity size={14} className="text-teal-600" /> Test Selection
// // //                   </h3>
// // //                   <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
// // //                     {selectedTests.length} Selected
// // //                   </span>
// // //                 </div>

// // //                 <div className="space-y-4">
// // //                   {/* Live Search Combobox */}
// // //                   <div className="relative" ref={dropdownRef}>
// // //                     <Input 
// // //                         label="Search Diagnostics"
// // //                         required
// // //                         icon={isFetchingTests ? Loader2 : Search}
// // //                         placeholder={isFetchingTests ? "Fetching active lab dictionary..." : "Type test name or code (e.g. CBC)..."}
// // //                         value={testSearchQuery}
// // //                         onChange={(e) => { setTestSearchQuery(e.target.value); setIsTestDropdownOpen(true); }}
// // //                         onFocus={() => setIsTestDropdownOpen(true)}
// // //                       />
// // //                       {/* Dropdown Options List */}
// // //                       {isTestDropdownOpen && (testSearchQuery.length > 0 || filteredComboboxTests.length > 0) && (
// // //                         <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
// // //                           {filteredComboboxTests.length === 0 ? (
// // //                             <div className="p-4 text-center text-xs font-semibold text-slate-400">No active tests matching query.</div>
// // //                           ) : (
// // //                             filteredComboboxTests.map(test => (
// // //                               <button
// // //                                 key={test.id} type="button" onClick={() => handleSelectTest(test)}
// // //                                 className="w-full text-left px-4 py-3 hover:bg-teal-50/60 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-colors outline-none"
// // //                               >
// // //                                 <div className="min-w-0 pr-2">
// // //                                   <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">{test.name}</div>
// // //                                   <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
// // //                                     <span>{getDeptIcon(test.department)}</span>
// // //                                     <span>{test.code}</span>
// // //                                   </div>
// // //                                 </div>
// // //                                 <div className="text-xs font-black font-mono text-slate-900 shrink-0">₹{test.price}</div>
// // //                               </button>
// // //                             ))
// // //                           )}
// // //                         </div>
// // //                       )}
// // //                     </div>
// // //                     {/* Selected Tests Badge Collection */}
// // //                     {selectedTests.length > 0 && (
// // //                       <div className="space-y-2">
// // //                         <div className="flex items-center justify-between">
// // //                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added Tests</span>
// // //                           <button type="button" onClick={() => setSelectedTests([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline underline-offset-2 outline-none">
// // //                             Clear All
// // //                           </button>
// // //                         </div>
                        
// // //                         <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
// // //                           {selectedTests.map(test => (
// // //                             <div key={test.id} className="inline-flex items-center gap-2 bg-white border border-slate-200 pl-3 pr-1.5 py-1.5 rounded-lg shadow-sm animate-in zoom-in-95 duration-150">
// // //                               <div className="flex flex-col">
// // //                                 <span className="text-xs font-bold text-slate-800 leading-tight">{test.name}</span>
// // //                                 <span className="text-[9px] font-mono font-bold text-slate-400">₹{test.price}</span>
// // //                               </div>
// // //                               <button type="button" onClick={() => handleRemoveTest(test.id)} className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-md transition-colors outline-none ml-1">
// // //                                 <X size={12} strokeWidth={3} />
// // //                               </button>
// // //                             </div>
// // //                           ))}
// // //                         </div>
// // //                       </div>
// // //                     )}

// // //                     {/* Priority Selector */}
// // //                     <div>
// // //                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Priority Level</label>
// // //                       <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 shadow-inner">
// // //                         {(['Routine', 'Urgent', 'STAT'] as PriorityEnum[]).map(p => (
// // //                             <button 
// // //                               type="button" key={p} onClick={() => setPriority(p)}
// // //                               className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all outline-none ${
// // //                                 priority === p ? p === 'STAT' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'text-slate-500 hover:text-slate-700'
// // //                               }`}
// // //                             >
// // //                               {p}
// // //                             </button>
// // //                           ))}
// // //                       </div>
// // //                     </div>
// // //                 </div>
// // //               </div>

// // //               {/* SECTION 3: BILLING */}
// // //               <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-5">
// // //                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
// // //                   <Receipt size={14} className="text-teal-600" /> Billing & Payment Details
// // //                 </h3>

// // //                 <div className="space-y-4">
// // //                   {/* Discount Input */}
// // //                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Apply Discount</label>
// // //                   <div className="flex gap-2">
// // //                     <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 shadow-inner">
// // //                       <button type="button" onClick={() => setDiscountType("percentage")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all outline-none ${discountType === "percentage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>%</button>
// // //                       <button type="button" onClick={() => setDiscountType("flat")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all outline-none ${discountType === "flat" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>₹</button>
// // //                     </div>
// // //                     <div className="relative flex-1">
// // //                       <Input
// // //                         type="number" min="0" 
// // //                         value={discountValue} 
// // //                         onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")}
// // //                         placeholder={discountType === "percentage" ? "Enter % (e.g. 10)" : "Enter Flat ₹"}
// // //                         icon={Tag}
// // //                       />
// // //                       </div>
// // //                   </div>
// // //                 </div>
                
// // //                 {/* Payment Mode & Status Controls */}
// // //                 <div className="grid grid-cols-2 gap-3">
// // //                   <Select 
// // //                         label="Payment Status"
// // //                         value={paymentStatus} 
// // //                         onChange={(e) => setPaymentStatus(e.target.value as any)}
// // //                         options={[
// // //                           { label: "Paid", value: "Paid" },
// // //                           { label: "Partial", value: "Partial" },
// // //                           { label: "Unpaid", value: "Unpaid" }
// // //                         ]}
// // //                       />
// // //                       <Select 
// // //                         label="Payment Method"
// // //                         value={paymentMethod} 
// // //                         onChange={(e) => setPaymentMethod(e.target.value as any)}
// // //                         disabled={paymentStatus === "Unpaid"}
// // //                         options={[
// // //                           { label: "UPI / QR", value: "upi" },
// // //                           { label: "Cash", value: "cash" },
// // //                           { label: "Credit/Debit Card", value: "card" },
// // //                           { label: "Net Banking", value: "bank_transfer" }
// // //                         ]}
// // //                       />
// // //                     </div>
                    
// // //                     {/* Partial Amount Input */}
// // //                     {paymentStatus === "partial" && (
// // //                       <div className="animate-in fade-in slide-in-from-top-2">
// // //                         <Input 
// // //                           label="Deposit Amount Received (₹)"
// // //                           type="number" min="1" max={finalTotal - 1} 
// // //                           value={paidAmountInput} 
// // //                           onChange={(e) => setPaidAmountInput(e.target.value ? Number(e.target.value) : "")}
// // //                           placeholder={`Max: ₹${finalTotal}`}
// // //                         />
// // //                       </div>
// // //                     )}
                    
// // //                     {/* LIVE BILL BREAKDOWN RECEIPT CARD */}
// // //                      <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 font-mono shadow-xl relative overflow-hidden">
// // //                        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
                      
// // //                        <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
// // //                          <span>Items Total ({selectedTests.length})</span>
// // //                          <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
// // //                        </div>

// // //                        {discountAmount > 0 && (
// // //                         <div className="flex justify-between items-center text-xs text-emerald-400 border-b border-slate-800 pb-2">
// // //                           <span>Discount Applied ({discountType === "percentage" ? `${discountValue}%` : "Flat"})</span>
// // //                           <span className="font-bold">- ₹{discountAmount.toLocaleString('en-IN')}</span>
// // //                         </div>
// // //                       )}

// // //                       <div className="flex justify-between items-center pt-1">
// // //                         <span className="text-xs font-sans font-bold text-slate-300">Final Payable</span>
// // //                         <span className="text-xl font-black text-teal-400">₹{finalTotal.toLocaleString('en-IN')}</span>
// // //                       </div>
// // //                     </div>

// // //                   </div>
// // //             </form>
// // //           </div>
          
// // //           {/* Drawer Footer Actions */}
// // //           <div className="p-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md flex justify-end gap-3 shrink-0 sticky bottom-0 z-20">
// // //           <Button variant="secondary" onClick={resetIntakeForm}>
// // //             Cancel
// // //           </Button>
// // //           <Button 
// // //                 onClick={handleSubmitIntake} 
// // //                 disabled={selectedTests.length === 0 || !fullName || !phone || isSubmitting || (paymentStatus === "partial" && !paidAmountInput)}
// // //                 isLoading={isSubmitting}
// // //                 icon={<CreditCard size={18} strokeWidth={2.5} />}
// // //               >
// // //                 Save Intake
// // //               </Button>
// // //             </div>
        
// // //         </div>
// // //       </div>
// // //     )}
// // //     </>
// // //   )
// // // }



// // // "use client";

// // // import React, { useState, useEffect, useMemo, useRef } from "react";
// // // import { 
// // //   X, User, Phone, Activity, Search, Tag, Receipt, CreditCard 
// // // } from "lucide-react";
// // // import { api } from "@/lib/axios";
// // // import { toast } from "@/lib/toast";

// // // // Core UI Components
// // // import { Button } from "@/components/ui/Button";
// // // import { Input } from "@/components/ui/Input";
// // // import { Select } from "@/components/ui/Select";

// // // // ==========================================
// // // // TYPES & INTERFACES
// // // // ==========================================
// // // export type GenderEnum = "Male" | "Female" | "Other";
// // // export type PriorityEnum = "Routine" | "Urgent" | "STAT";
// // // export type DiscountTypeEnum = "percentage" | "flat" | "none";
// // // export type PaymentMethodEnum = "cash" | "upi" | "card" | "bank_transfer" | "insurance" | "none";
// // // export type PaymentStatusEnum = "unpaid" | "partial" | "paid" | "refunded";

// // // export interface LabTest {
// // //   id: string;
// // //   code: string;
// // //   name: string;
// // //   department: string;
// // //   price: number;
// // // }

// // // interface NewIntakeDrawerProps {
// // //   isOpen: boolean;
// // //   onClose: () => void;
// // //   onSuccess: () => void;
// // //   availableTests: LabTest[]; // Passed from parent so we don't fetch twice
// // // }

// // // // ==========================================
// // // // ERROR FORMATTER
// // // // ==========================================
// // // const formatApiError = (error: any): string => {
// // //   if (!error.isAxiosError) return error instanceof Error ? error.message : "Unexpected error.";
// // //   if (!error.response) return "Network error. Please check your connection.";
// // //   const detail = error.response.data?.detail;
// // //   if (typeof detail === "string") return detail;
// // //   if (Array.isArray(detail)) return detail.map((err: any) => `${err.loc?.[err.loc.length - 1] || 'Field'}: ${err.msg}`).join(" | ");
// // //   return error.message || "A system error occurred.";
// // // };

// // // export function NewIntakeDrawer({ isOpen, onClose, onSuccess, availableTests }: NewIntakeDrawerProps) {
// // //   // ==========================================
// // //   // 1. LOCAL STATE
// // //   // ==========================================
// // //   const [isSubmitting, setIsSubmitting] = useState(false);
  
// // //   // Demographics
// // //   const [fullName, setFullName] = useState("");
// // //   const [phone, setPhone] = useState("");
// // //   const [age, setAge] = useState<number | "">("");
// // //   const [gender, setGender] = useState<GenderEnum>("Male");

// // //   // Diagnostics
// // //   const [priority, setPriority] = useState<PriorityEnum>("Routine");
// // //   const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
// // //   const [testSearchQuery, setTestSearchQuery] = useState("");
// // //   const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
// // //   const dropdownRef = useRef<HTMLDivElement>(null);
  
// // //   // Billing
// // //   const [discountType, setDiscountType] = useState<DiscountTypeEnum>("percentage");
// // //   const [discountValue, setDiscountValue] = useState<number | "">("");
// // //   const [paymentStatus, setPaymentStatus] = useState<PaymentStatusEnum>("paid");
// // //   const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>("upi");
// // //   const [paidAmountInput, setPaidAmountInput] = useState<number | "">("");

// // //   // ==========================================
// // //   // 2. LIFECYCLE & RESET
// // //   // ==========================================
// // //   useEffect(() => {
// // //     if (isOpen) {
// // //       setFullName(""); setPhone(""); setAge(""); setGender("Male");
// // //       setPriority("Routine"); setSelectedTests([]); setTestSearchQuery("");
// // //       setDiscountType("percentage"); setDiscountValue("");
// // //       setPaymentStatus("paid"); setPaymentMethod("upi"); setPaidAmountInput("");
// // //       setIsTestDropdownOpen(false);
// // //     }
// // //   }, [isOpen]);

// // //   // Click outside to close combobox
// // //   useEffect(() => {
// // //     const handleClickOutside = (e: MouseEvent) => {
// // //       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
// // //         setIsTestDropdownOpen(false);
// // //       }
// // //     };
// // //     document.addEventListener("mousedown", handleClickOutside);
// // //     return () => document.removeEventListener("mousedown", handleClickOutside);
// // //   }, []);

// // //   // ==========================================
// // //   // 3. BILLING ENGINE (Memoized for max performance)
// // //   // ==========================================
// // //   const subtotal = useMemo(() => selectedTests.reduce((sum, test) => sum + Number(test.price), 0), [selectedTests]);
  
// // //   const discountAmount = useMemo(() => {
// // //     if (!discountValue || discountValue <= 0) return 0;
// // //     const num = Number(discountValue);
// // //     if (discountType === "percentage") return Math.min(subtotal, Math.round((subtotal * num) / 100));
// // //     return Math.min(subtotal, num);
// // //   }, [subtotal, discountType, discountValue]);

// // //   const finalTotal = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

// // //   // Auto-sync payment inputs based on status
// // //   useEffect(() => {
// // //     if (paymentStatus === "paid") {
// // //       setPaidAmountInput(finalTotal);
// // //       if (paymentMethod === "none") setPaymentMethod("upi");
// // //     } else if (paymentStatus === "unpaid") {
// // //       setPaidAmountInput(0);
// // //       setPaymentMethod("none");
// // //     } else if (paymentStatus === "partial") {
// // //       if (paymentMethod === "none") setPaymentMethod("upi");
// // //     }
// // //   }, [paymentStatus, finalTotal, paymentMethod]);

// // //   // ==========================================
// // //   // 4. HANDLERS
// // //   // ==========================================
// // //   const filteredComboboxTests = useMemo(() => {
// // //     const query = testSearchQuery.toLowerCase().trim();
// // //     return availableTests.filter(test => 
// // //       !selectedTests.find(t => t.id === test.id) &&
// // //       ((test.name || "").toLowerCase().includes(query) || (test.code || "").toLowerCase().includes(query))
// // //     );
// // //   }, [availableTests, selectedTests, testSearchQuery]);

// // //   const handleSelectTest = (test: LabTest) => {
// // //     setSelectedTests([...selectedTests, test]);
// // //     setTestSearchQuery("");
// // //     setIsTestDropdownOpen(false);
// // //   };

// // //   const handleSubmit = async (e: React.FormEvent) => {
// // //     e.preventDefault();
// // //     if (!fullName || !phone || selectedTests.length === 0) {
// // //       return toast.warning("Incomplete Form", "Please fill required fields and select at least one test.");
// // //     }

// // //     setIsSubmitting(true);
    
// // //     // 🚀 Exact payload structure matching your backend requirements
// // //     const payload = {
// // //       patient: { 
// // //         name: fullName.trim(), 
// // //         age: Number(age) || 0, 
// // //         gender: gender, 
// // //         phone: phone.trim() 
// // //       },
// // //       clinical: { 
// // //         priority: priority, 
// // //         test_ids: selectedTests.map(t => t.id) 
// // //       },
// // //       billing: {
// // //         payment_status: paymentStatus,
// // //         payment_method: paymentStatus === "unpaid" ? "none" : paymentMethod,
// // //         discount_type: !discountValue || discountValue === 0 ? "none" : discountType,
// // //         discount_value: Number(discountValue) || 0,
// // //         paid_amount: paymentStatus === "paid" ? finalTotal : paymentStatus === "partial" ? Number(paidAmountInput) : 0,
// // //       }
// // //     };

// // //     try {
// // //       await api.post('/intakes', payload);
// // //       toast.success("Registration Successful", `${fullName} has been registered.`);
// // //       onSuccess();
// // //       onClose();
// // //     } catch (error) {
// // //       toast.error("Registration Failed", formatApiError(error));
// // //     } finally {
// // //       setIsSubmitting(false);
// // //     }
// // //   };

// // //   if (!isOpen) return null;

// // //   // ==========================================
// // //   // 5. RENDER
// // //   // ==========================================
// // //   return (
// // //     <div className="fixed inset-0 z-[100] flex justify-end">
      
// // //       {/* Backdrop */}
// // //       <div 
// // //         className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in"
// // //         onClick={onClose}
// // //       />
      
// // //       {/* Drawer Panel */}
// // //       <div className="relative w-full md:w-[550px] h-full bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-10">
        
// // //         {/* HEADER */}
// // //         <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
// // //           <div className="flex items-center gap-3">
// // //             <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center border border-teal-100 shadow-sm">
// // //               <User size={20} strokeWidth={2.5} />
// // //             </div>
// // //             <div>
// // //               <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">New Patient Intake</h2>
// // //               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Registration & Billing</p>
// // //             </div>
// // //           </div>
// // //           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
// // //             <X size={20} strokeWidth={2.5} />
// // //           </button>
// // //         </div>

// // //         {/* SCROLLABLE BODY */}
// // //         <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
// // //           <form id="new-intake-form" onSubmit={handleSubmit} className="space-y-6">
            
// // //             {/* DEMOGRAPHICS */}
// // //             <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
// // //               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
// // //                 <User size={14} className="text-teal-600" /> Patient Demographics
// // //               </h3>
// // //               <div className="space-y-4">
// // //                 <Input label="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Rahul Sharma" />
// // //                 <Input label="Phone Number" icon={Phone} required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" />
// // //                 <div className="grid grid-cols-2 gap-4">
// // //                   <Input label="Age" type="number" min="0" max="120" value={age} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")} placeholder="Years" />
// // //                   <Select label="Gender" value={gender} onChange={(e) => setGender(e.target.value as GenderEnum)} options={[{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }, { label: "Other", value: "Other" }]} />
// // //                 </div>
// // //               </div>
// // //             </div>

// // //             {/* DIAGNOSTICS */}
// // //             <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
// // //               <div className="flex items-center justify-between border-b border-slate-100 pb-3">
// // //                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
// // //                   <Activity size={14} className="text-teal-600" /> Test Selection
// // //                 </h3>
// // //                 <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{selectedTests.length} Selected</span>
// // //               </div>
              
// // //               <div className="space-y-4">
// // //                 {/* Search Combobox */}
// // //                 <div className="relative" ref={dropdownRef}>
// // //                   <Input 
// // //                     label="Search Diagnostics" required icon={Search} 
// // //                     placeholder="Type test name or code (e.g. CBC)..." 
// // //                     value={testSearchQuery} 
// // //                     onChange={(e) => { setTestSearchQuery(e.target.value); setIsTestDropdownOpen(true); }}
// // //                     onFocus={() => setIsTestDropdownOpen(true)}
// // //                   />
// // //                   {isTestDropdownOpen && (testSearchQuery.length > 0 || filteredComboboxTests.length > 0) && (
// // //                     <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
// // //                       {filteredComboboxTests.length === 0 ? (
// // //                         <div className="p-4 text-center text-xs font-semibold text-slate-400">No tests matching query.</div>
// // //                       ) : (
// // //                         filteredComboboxTests.map(test => (
// // //                           <button key={test.id} type="button" onClick={() => handleSelectTest(test)} className="w-full text-left px-4 py-3 hover:bg-teal-50/60 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-colors outline-none">
// // //                             <div className="min-w-0 pr-2">
// // //                               <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">{test.name}</div>
// // //                               <div className="text-[10px] font-mono text-slate-500 mt-0.5">{test.code}</div>
// // //                             </div>
// // //                             <div className="text-xs font-black font-mono text-slate-900 shrink-0">₹{test.price}</div>
// // //                           </button>
// // //                         ))
// // //                       )}
// // //                     </div>
// // //                   )}
// // //                 </div>

// // //                 {/* Selected Badges */}
// // //                 {selectedTests.length > 0 && (
// // //                   <div className="space-y-2">
// // //                     <div className="flex items-center justify-between">
// // //                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added Tests</span>
// // //                       <button type="button" onClick={() => setSelectedTests([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline underline-offset-2 outline-none">Clear All</button>
// // //                     </div>
// // //                     <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
// // //                       {selectedTests.map(test => (
// // //                         <div key={test.id} className="inline-flex items-center gap-2 bg-white border border-slate-200 pl-3 pr-1.5 py-1.5 rounded-lg shadow-sm animate-in zoom-in-95 duration-150">
// // //                           <div className="flex flex-col">
// // //                             <span className="text-xs font-bold text-slate-800 leading-tight">{test.name}</span>
// // //                             <span className="text-[9px] font-mono font-bold text-slate-400">₹{test.price}</span>
// // //                           </div>
// // //                           <button type="button" onClick={() => setSelectedTests(prev => prev.filter(t => t.id !== test.id))} className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-md transition-colors outline-none ml-1">
// // //                             <X size={12} strokeWidth={3} />
// // //                           </button>
// // //                         </div>
// // //                       ))}
// // //                     </div>
// // //                   </div>
// // //                 )}

// // //                 {/* Priority */}
// // //                 <div>
// // //                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Priority Level</label>
// // //                   <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 shadow-inner">
// // //                     {(['Routine', 'Urgent', 'STAT'] as PriorityEnum[]).map(p => (
// // //                       <button 
// // //                         type="button" key={p} onClick={() => setPriority(p)}
// // //                         className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all outline-none ${priority === p ? p === 'STAT' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'text-slate-500 hover:text-slate-700'}`}
// // //                       >
// // //                         {p}
// // //                       </button>
// // //                     ))}
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             </div>

// // //             {/* BILLING */}
// // //             <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
// // //               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
// // //                 <Receipt size={14} className="text-teal-600" /> Billing Details
// // //               </h3>
// // //               <div className="space-y-4">
                
// // //                 {/* Discount */}
// // //                 <div>
// // //                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Apply Discount</label>
// // //                   <div className="flex gap-2">
// // //                     <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 shadow-inner">
// // //                       <button type="button" onClick={() => setDiscountType("percentage")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all outline-none ${discountType === "percentage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>%</button>
// // //                       <button type="button" onClick={() => setDiscountType("flat")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all outline-none ${discountType === "flat" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>₹</button>
// // //                     </div>
// // //                     <div className="relative flex-1">
// // //                       <Input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")} placeholder={discountType === "percentage" ? "Enter % (e.g. 10)" : "Enter Flat ₹"} icon={Tag} />
// // //                     </div>
// // //                   </div>
// // //                 </div>

// // //                 {/* Payment Specs */}
// // //                 <div className="grid grid-cols-2 gap-3">
// // //                   <Select label="Payment Status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)} options={[{ label: "Paid", value: "paid" }, { label: "Partial", value: "partial" }, { label: "Unpaid", value: "unpaid" }]} />
// // //                   <Select label="Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} disabled={paymentStatus === "unpaid"} options={[{ label: "UPI / QR", value: "upi" }, { label: "Cash", value: "cash" }, { label: "Card", value: "card" }, { label: "Bank", value: "bank_transfer" }]} />
// // //                 </div>

// // //                 {paymentStatus === "partial" && (
// // //                   <div className="animate-in fade-in slide-in-from-top-2">
// // //                     <Input label="Deposit Amount Received (₹)" type="number" min="1" max={finalTotal - 1} value={paidAmountInput} onChange={(e) => setPaidAmountInput(e.target.value ? Number(e.target.value) : "")} placeholder={`Max: ₹${finalTotal}`} />
// // //                   </div>
// // //                 )}

// // //                 {/* Live Receipt */}
// // //                 <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 font-mono shadow-xl relative overflow-hidden">
// // //                   <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
// // //                   <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
// // //                     <span>Items Total ({selectedTests.length})</span>
// // //                     <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
// // //                   </div>
// // //                   {discountAmount > 0 && (
// // //                     <div className="flex justify-between items-center text-xs text-emerald-400 border-b border-slate-800 pb-2">
// // //                       <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Flat"})</span>
// // //                       <span className="font-bold">- ₹{discountAmount.toLocaleString('en-IN')}</span>
// // //                     </div>
// // //                   )}
// // //                   <div className="flex justify-between items-center pt-1">
// // //                     <span className="text-xs font-sans font-bold text-slate-300">Final Payable</span>
// // //                     <span className="text-xl font-black text-teal-400">₹{finalTotal.toLocaleString('en-IN')}</span>
// // //                   </div>
// // //                 </div>

// // //               </div>
// // //             </div>

// // //           </form>
// // //         </div>

// // //         {/* FOOTER ACTIONS */}
// // //         <div className="p-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md flex justify-end gap-3 shrink-0 sticky bottom-0 z-20">
// // //           <Button variant="secondary" onClick={onClose}>
// // //             Cancel
// // //           </Button>
// // //           <Button 
// // //             type="submit" 
// // //             form="new-intake-form" // 🚀 Targets the form ID above to trigger onSubmit
// // //             disabled={selectedTests.length === 0 || !fullName || !phone || isSubmitting || (paymentStatus === "partial" && !paidAmountInput)}
// // //             isLoading={isSubmitting}
// // //             icon={<CreditCard size={18} strokeWidth={2.5} />}
// // //           >
// // //             Save Intake
// // //           </Button>
// // //         </div>

// // //       </div>
// // //     </div>
// // //   );
// // // }