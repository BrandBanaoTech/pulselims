"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Plus, ChevronDown, FileText, Printer, History, 
  Send, Trash2, ShieldAlert, Clock, X, User, Phone, 
  FlaskConical, Stethoscope, Activity, CreditCard, 
  Loader2, Tag, Receipt, Droplets, Dna, 
  Microscope, TestTubes, DollarSign
} from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/axios"; 
import { toast } from "@/lib/toast"; 

// Import your new Enterprise UI Components
import { PageHeader } from "@/components/ui/PageHeader";
import { CommandBar } from "@/components/ui/CommandBar";
import { TableWrapper, TableHeader, TableHead, TableBody, TableRow, TableCell, TableEmpty } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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

// ==========================================
// TYPES & ENUMS
// ==========================================
type GenderEnum = "Male" | "Female" | "Other";
type PriorityEnum = "Routine" | "Urgent" | "STAT";
type DiscountTypeEnum = "percentage" | "flat" | "none";
type PaymentMethodEnum = "cash" | "upi" | "card" | "bank_transfer" | "insurance" | "none";
type PaymentStatusEnum = "unpaid" | "partial" | "paid" | "refunded";
type IntakeStatusEnum = "registered" | "sample_collected" | "processing" | "completed" | "cancelled";

interface LabTest {
  id: string;
  code: string;
  name: string;
  department: string;
  price: number;
  tat: string;
}

interface IntakeRecord {
  id: string;
  lab_id: string;
  accession_number: string;
  patient_name: string;
  patient_phone: string;
  patient_age: number;
  patient_gender: GenderEnum;
  priority: PriorityEnum;
  test_ids: string[];
  status: IntakeStatusEnum;
  intake_date: string;
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

const formatEnum = (val?: string) => {
  if (!val) return "";
  return val.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
};

export default function IntakesPage() {
  const router = useRouter();
  const { token, activeLab } = useAuthStore();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | IntakeStatusEnum>("All");
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  
  const [collectBalanceRecord, setCollectBalanceRecord] = useState<IntakeRecord | null>(null);
  const [additionalPayment, setAdditionalPayment] = useState<number | "">("");
  const [additionalPayMethod, setAdditionalPayMethod] = useState<PaymentMethodEnum>("upi");
  const [isCollectingBalance, setIsCollectingBalance] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<GenderEnum>("Male");
  const [priority, setPriority] = useState<PriorityEnum>("Routine");
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusEnum>("paid");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>("upi");
  const [discountType, setDiscountType] = useState<DiscountTypeEnum>("percentage");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [paidAmountInput, setPaidAmountInput] = useState<number | "">("");

  const [availableTests, setAvailableTests] = useState<LabTest[]>([]);
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [isFetchingTests, setIsFetchingTests] = useState(false);
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (paymentStatus === "paid") {
      setPaidAmountInput(finalTotal);
      if (paymentMethod === "none") setPaymentMethod("upi");
    } else if (paymentStatus === "unpaid") {
      setPaidAmountInput(0);
      setPaymentMethod("none");
    } else if (paymentStatus === "partial") {
      if (paymentMethod === "none") setPaymentMethod("upi");
    }
  }, [paymentStatus, finalTotal, paymentMethod]);

  // ==========================================
  // DATA FETCHING & EFFECTS
  // ==========================================
  const fetchIntakesQueue = useCallback(async () => {
    try {
      setIsLoadingQueue(true);
      const res = await api.get('/intakes');
      setIntakes(res.data);
    } catch (error) {
      toast.error("Queue Error", formatApiError(error));
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  const fetchActiveTests = useCallback(async () => {
    try {
      setIsFetchingTests(true);
      const res = await api.get('/tests?is_active=true');
      setAvailableTests(res.data);
    } catch (error) {
      toast.error("Dictionary Error", formatApiError(error));
    } finally {
      setIsFetchingTests(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchIntakesQueue();
      fetchActiveTests();
    }
  }, [token, activeLab, fetchIntakesQueue, fetchActiveTests]);

  useEffect(() => {
    if (isDrawerOpen || collectBalanceRecord) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isDrawerOpen, collectBalanceRecord]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsTestDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenActionId(null);
    if (openActionId) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openActionId]);

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================
  const resetIntakeForm = () => {
    setFullName(""); setPhone(""); setAge(""); setGender("Male");
    setSelectedTests([]); setPriority("Routine"); setPaymentStatus("paid");
    setPaymentMethod("upi"); setDiscountType("percentage"); setDiscountValue("");
    setPaidAmountInput(""); setIsDrawerOpen(false);
  };

  const handleSubmitIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || selectedTests.length === 0) {
      toast.warning("Incomplete Form", "Please fill required fields and select a test.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      patient: { name: fullName.trim(), age: Number(age) || 0, gender: gender, phone: phone.trim() },
      clinical: { priority: priority, test_ids: selectedTests.map(t => t.id) },
      billing: {
        payment_status: paymentStatus,
        payment_method: paymentStatus === "unpaid" ? "none" : paymentMethod,
        discount_type: !discountValue || discountValue === 0 ? "none" : discountType,
        discount_value: Number(discountValue) || 0,
        paid_amount: paymentStatus === "paid" ? finalTotal : paymentStatus === "partial" ? Number(paidAmountInput) : 0,
      }
    };

    try {
      await api.post('/intakes', payload);
      toast.success("Registration Successful", `${fullName} has been registered.`);
      resetIntakeForm();
      fetchIntakesQueue();
    } catch (error) {
      toast.error("Registration Failed", formatApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent, id: string, currentStatus: IntakeStatusEnum) => {
    e.stopPropagation();
    let nextStatus: IntakeStatusEnum = "processing";
    if (currentStatus === "processing") nextStatus = "completed";
    if (currentStatus === "completed") nextStatus = "registered";
    
    try {
      setIntakes(prev => prev.map(p => p.id === id ? { ...p, status: nextStatus } : p));
      await api.put(`/intakes/${id}`, { status: nextStatus });
      toast.success("Status Updated", `Order moved to ${formatEnum(nextStatus)}`);
    } catch (error) {
      toast.error("Update Failed", formatApiError(error));
      fetchIntakesQueue(); 
    }
  };

  const handleCollectBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectBalanceRecord || !additionalPayment) return;

    const paymentNum = Number(additionalPayment);
    if (paymentNum > Number(collectBalanceRecord.balance_due)) {
      toast.error("Overpayment", `Amount exceeds remaining balance of ₹${collectBalanceRecord.balance_due}`);
      return;
    }

    try {
      setIsCollectingBalance(true);
      await api.put(`/intakes/${collectBalanceRecord.id}`, {
        additional_payment: paymentNum,
        payment_method: additionalPayMethod
      });
      toast.success("Payment Recorded", `Collected ₹${paymentNum.toLocaleString("en-IN")}`);
      setCollectBalanceRecord(null);
      setAdditionalPayment("");
      fetchIntakesQueue();
    } catch (error) {
      toast.error("Payment Failed", formatApiError(error));
    } finally {
      setIsCollectingBalance(false);
    }
  };

  const handleDeleteIntake = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Cancel and delete order for ${name}?`)) return;

    try {
      setIntakes(prev => prev.filter(p => p.id !== id));
      setOpenActionId(null);
      await api.delete(`/intakes/${id}`);
      toast.success("Record Deleted", "The intake record has been removed.");
    } catch (error) {
      toast.error("Deletion Failed", formatApiError(error));
      fetchIntakesQueue(); 
    }
  };

  // ==========================================
  // HELPERS & NULL-SAFE FILTERS
  // ==========================================
  const handleSelectTest = (test: LabTest) => {
    if (!selectedTests.find(t => t.id === test.id)) setSelectedTests([...selectedTests, test]);
    setTestSearchQuery("");
    setIsTestDropdownOpen(false);
  };

  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter(t => t.id !== testId));
  };

  const filteredIntakes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return intakes.filter(p => {
      const name = p.patient_name || "";
      const phone = p.patient_phone || "";
      const accession = p.accession_number || p.id || "";
      
      const matchesSearch = name.toLowerCase().includes(query) || phone.toLowerCase().includes(query) || accession.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" ? true : p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [intakes, searchQuery, statusFilter]);

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

  return (
    <div className="flex-1 flex flex-col min-h-screen animate-in fade-in duration-500 font-sans pb-24 relative">
      
      {/* 1. ENTERPRISE PAGE HEADER */}
      <PageHeader
        icon={Stethoscope}
        eyebrow={`Intakes • ${activeLab || "Workspace"}`}
        title=""
        description=""
        // title="Patient Intakes"
        // description="Register new patients, manage diagnostic queues, and track turnaround times across your laboratory."
      />

      {/* 2. UNIFIED COMMAND BAR */}
      <CommandBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search Accession, Name, Phone..."
        filters={[
          { label: "All Queue", value: "All" },
          { label: "Registered", value: "registered" },
          { label: "Processing", value: "processing" },
          { label: "Completed", value: "completed" },
        ]}
        activeFilter={statusFilter}
        onFilterChange={(val) => setStatusFilter(val as any)}
        action={
          <Button variant="dark" icon={<Plus size={16} color="t"/>} onClick={() => setIsDrawerOpen(true)}>
             <span className="hidden sm:inline">New Intake</span>
          </Button>
        }
      />

      {/* 3. PATIENTS DATA GRID */}
      {isLoadingQueue ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white/50 rounded-[2rem] border border-slate-200/80 backdrop-blur-sm shadow-sm">
           <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
           <p className="text-slate-500 font-semibold text-sm">Loading operations queue...</p>
        </div>
      ) : (
        <>
          {/* A. MOBILE CARDS (< lg) */}
          <div className="lg:hidden space-y-4 relative z-10">
            {filteredIntakes.map((patient) => (
              <div 
                key={patient.id} 
                onClick={() => router.push(`/dashboard/reports/${patient.id}`)}
                className="bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-sm space-y-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                    {patient.accession_number}
                  </span>
                  <div onClick={(e) => { e.stopPropagation(); handleToggleStatus(e, patient.id, patient.status); }}>
                    <StatusBadge 
                      status={patient.status} 
                      label={formatEnum(patient.status)} 
                      isPulsing={patient.status !== 'completed' && patient.status !== 'cancelled'} 
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">{patient.patient_name}</h4>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">
                    {patient.patient_age} Yrs • {patient.patient_gender} • {patient.patient_phone}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Tests Ordered</span>
                    {patient.priority === "STAT" && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-rose-600 tracking-widest bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 shadow-sm">
                        <ShieldAlert size={10} /> STAT
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patient.test_ids.map((id) => {
                      const testInfo = availableTests.find(t => t.id === id);
                      return (
                        <span key={id} className="px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-mono font-bold uppercase border border-slate-200 shadow-sm">
                          {testInfo?.code || "TEST"}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black font-mono text-slate-900 block">₹{Number(patient.net_amount).toLocaleString('en-IN')}</span>
                      {Number(patient.balance_due) > 0 && (
                        <span className="text-[9px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200 shadow-sm">
                          Due: ₹{Number(patient.balance_due).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold tracking-wide text-slate-500">
                      <Clock size={12} strokeWidth={2.5} className="text-slate-400" />
                      <span>{new Date(patient.intake_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(openActionId === patient.id ? null : patient.id);
                      }}
                    >
                      Actions <ChevronDown size={14} />
                    </Button>

                    {openActionId === patient.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95">
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/reports/${patient.id}`); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                          <FileText size={14} className="text-slate-400" /> Enter Metrics
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                          <Printer size={14} className="text-slate-400" /> Print Label
                        </button>
                        <div className="h-px bg-slate-100 my-1 mx-2" />
                        
                        {Number(patient.balance_due) > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setCollectBalanceRecord(patient); setOpenActionId(null); }} 
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-teal-700 hover:bg-teal-50 flex items-center gap-2.5 transition-colors outline-none"
                          >
                            <DollarSign size={14} className="text-teal-600" /> Collect Balance
                          </button>
                        )}
                        
                        <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                          <Send size={14} className="text-slate-400" /> WhatsApp
                        </button>
                        <button 
                          onClick={(e) => handleDeleteIntake(e, patient.id, patient.patient_name)} 
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors outline-none rounded-b-2xl"
                        >
                          <Trash2 size={14} className="text-rose-400" /> Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* B. DESKTOP COMPOSABLE TABLE (>= lg) */}
          <TableWrapper>
            <TableHeader>
              <TableHead>Patient Demographics</TableHead>
              <TableHead>Diagnostics</TableHead>
              <TableHead>Billing Ledger</TableHead>
              <TableHead>Workflow Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            
            <TableBody>
              {filteredIntakes.map((patient) => (
                <TableRow key={patient.id} onClick={() => router.push(`/dashboard/reports/${patient.id}`)}>
                  
                  {/* Demographics */}
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-teal-700 transition-colors truncate max-w-[180px]">{patient.patient_name}</h4>
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md shadow-sm">
                            {patient.accession_number}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-semibold tracking-wide">
                          {patient.patient_age} Yrs <span className="mx-1">•</span> {patient.patient_gender} <span className="mx-1">•</span> {patient.patient_phone}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Diagnostics/Tests */}
                  <TableCell>
                    <div className="flex flex-col gap-2 items-start">
                      <div className="flex flex-wrap gap-1.5">
                        {patient.test_ids.map((id) => {
                          const found = availableTests.find(t => t.id === id);
                          return (
                            <span key={id} className="px-2 py-0.5 bg-white text-slate-700 rounded-md border border-slate-200/80 text-[10px] font-mono font-bold uppercase shadow-sm">
                              {found?.code || "TEST"}
                            </span>
                          );
                        })}
                      </div>
                      {patient.priority === "STAT" && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-rose-600 tracking-widest bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 shadow-sm">
                          <ShieldAlert size={10} /> STAT Priority
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Billing */}
                  <TableCell>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black font-mono text-slate-900 block">₹{Number(patient.net_amount).toLocaleString('en-IN')}</span>
                      {Number(patient.balance_due) > 0 && (
                        <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200 shadow-sm">
                          Due: ₹{Number(patient.balance_due).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-widest rounded-md px-2 py-0.5 border shadow-sm ${
                        patient.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        patient.payment_status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {formatEnum(patient.payment_status)}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">({formatEnum(patient.payment_method) || "None"})</span>
                    </div>
                  </TableCell>

                  {/* Status & Tracking */}
                  <TableCell>
                    <div className="flex flex-col gap-2 items-start">
                      <div onClick={(e) => { e.stopPropagation(); handleToggleStatus(e, patient.id, patient.status); }}>
                        <StatusBadge 
                          status={patient.status} 
                          label={formatEnum(patient.status)} 
                          isPulsing={patient.status !== 'completed' && patient.status !== 'cancelled'} 
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-slate-500">
                        <Clock size={12} strokeWidth={2.5} className="text-slate-400" />
                        <span>{new Date(patient.intake_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="relative">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionId(openActionId === patient.id ? null : patient.id);
                        }} 
                      >
                        Actions <ChevronDown size={14} className={`transition-transform duration-200 ${openActionId === patient.id ? 'rotate-180' : ''}`} />
                      </Button>
                      
                      {openActionId === patient.id && (
                        <div className="absolute right-0 top-12 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95">
                          <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/reports/${patient.id}`); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                            <FileText size={14} className="text-slate-400"/> Enter Metrics
                          </button>
                          <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                            <Printer size={14} className="text-slate-400"/> Print Label
                          </button>
                          <div className="h-px bg-slate-100 my-1.5 mx-2" />
                          
                          {Number(patient.balance_due) > 0 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setCollectBalanceRecord(patient); setOpenActionId(null); }} 
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-teal-700 hover:bg-teal-50 flex items-center gap-2.5 transition-colors outline-none"
                            >
                              <DollarSign size={14} className="text-teal-600"/> Collect Balance
                            </button>
                          )}

                          <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                            <History size={14} className="text-slate-400"/> View History
                          </button>
                          <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                            <Send size={14} className="text-slate-400"/> WhatsApp 
                          </button>
                          <div className="h-px bg-slate-100 my-1.5 mx-2" />
                          <button onClick={(e) => handleDeleteIntake(e, patient.id, patient.patient_name)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors outline-none rounded-b-2xl">
                            <Trash2 size={14} className="text-rose-400"/> Cancel Order 
                          </button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableWrapper>
          
          {filteredIntakes.length === 0 && (
            <TableEmpty 
              title="No records found" 
              description="Adjust your filters or clear the search query."
              onClear={() => {setSearchQuery(""); setStatusFilter("All");}} 
            />
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* 4. DRAWER: NEW PATIENT INTAKE REGISTRATION                */}
      {/* ========================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in"
            onClick={resetIntakeForm}
          />
          
          <div className="relative w-full md:w-[550px] h-full bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-10">
            
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center border border-teal-100 shadow-sm">
                  <User size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">New Patient Intake</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Registration & Billing</p>
                </div>
              </div>
              <button onClick={resetIntakeForm} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
              <form onSubmit={handleSubmitIntake} className="space-y-6">
                
                {/* SECTION 1: DEMOGRAPHICS */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                    <User size={14} className="text-teal-600" /> Patient Demographics
                  </h3>
                  
                  <div className="space-y-4">
                    <Input 
                      label="Full Name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                    />

                    <Input 
                      label="Phone Number"
                      icon={Phone}
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Age"
                        type="number"
                        min="0" max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                        placeholder="Years"
                      />
                      <Select 
                        label="Gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        options={[
                          { label: "Male", value: "Male" },
                          { label: "Female", value: "Female" },
                          { label: "Other", value: "Other" }
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: MULTI-SELECT DIAGNOSTIC TESTS */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Activity size={14} className="text-teal-600" /> Test Selection
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {selectedTests.length} Selected
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    
                    {/* Live Search Combobox */}
                    <div className="relative" ref={dropdownRef}>
                      <Input 
                        label="Search Diagnostics"
                        required
                        icon={isFetchingTests ? Loader2 : Search}
                        placeholder={isFetchingTests ? "Fetching active lab dictionary..." : "Type test name or code (e.g. CBC)..."}
                        value={testSearchQuery}
                        onChange={(e) => { setTestSearchQuery(e.target.value); setIsTestDropdownOpen(true); }}
                        onFocus={() => setIsTestDropdownOpen(true)}
                      />

                      {/* Dropdown Options List */}
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

                    {/* Selected Tests Badge Collection */}
                    {selectedTests.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added Tests</span>
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

                {/* SECTION 3: BILLING */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Receipt size={14} className="text-teal-600" /> Billing & Payment Details
                  </h3>

                  <div className="space-y-4">
                    
                    {/* Discount Input */}
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

                    {/* Payment Mode & Status Controls */}
                    <div className="grid grid-cols-2 gap-3">
                      <Select 
                        label="Payment Status"
                        value={paymentStatus} 
                        onChange={(e) => setPaymentStatus(e.target.value as any)}
                        options={[
                          { label: "Paid", value: "paid" },
                          { label: "Partial", value: "partial" },
                          { label: "Unpaid", value: "unpaid" }
                        ]}
                      />
                      <Select 
                        label="Payment Method"
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        disabled={paymentStatus === "unpaid"}
                        options={[
                          { label: "UPI / QR", value: "upi" },
                          { label: "Cash", value: "cash" },
                          { label: "Credit/Debit Card", value: "card" },
                          { label: "Net Banking", value: "bank_transfer" }
                        ]}
                      />
                    </div>

                    {/* Partial Amount Input */}
                    {paymentStatus === "partial" && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <Input 
                          label="Deposit Amount Received (₹)"
                          type="number" min="1" max={finalTotal - 1} 
                          value={paidAmountInput} 
                          onChange={(e) => setPaidAmountInput(e.target.value ? Number(e.target.value) : "")}
                          placeholder={`Max: ₹${finalTotal}`}
                        />
                      </div>
                    )}

                    {/* LIVE BILL BREAKDOWN RECEIPT CARD */}
                    <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 font-mono shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
                      
                      <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                        <span>Items Total ({selectedTests.length})</span>
                        <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-xs text-emerald-400 border-b border-slate-800 pb-2">
                          <span>Discount Applied ({discountType === "percentage" ? `${discountValue}%` : "Flat"})</span>
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

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md flex justify-end gap-3 shrink-0 sticky bottom-0 z-20">
              <Button variant="secondary" onClick={resetIntakeForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitIntake} 
                disabled={selectedTests.length === 0 || !fullName || !phone || isSubmitting || (paymentStatus === "partial" && !paidAmountInput)}
                isLoading={isSubmitting}
                icon={<CreditCard size={18} strokeWidth={2.5} />}
              >
                Save Intake
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. COLLECT BALANCE POPUP MODAL                            */}
      {/* ========================================================= */}
      {collectBalanceRecord && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setCollectBalanceRecord(null)} />
          <div className="relative w-full max-w-md bg-white rounded-[2rem] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 border border-slate-200/80">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Collect Outstanding Balance</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{collectBalanceRecord.accession_number} • {collectBalanceRecord.patient_name}</p>
              </div>
              <button onClick={() => setCollectBalanceRecord(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors outline-none">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleCollectBalanceSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex justify-between items-center text-xs shadow-inner">
                <span className="font-bold text-amber-800">Remaining Balance:</span>
                <span className="font-mono font-black text-base text-amber-900">₹{Number(collectBalanceRecord.balance_due).toLocaleString("en-IN")}</span>
              </div>

              <Select 
                label="Payment Method"
                value={additionalPayMethod} 
                onChange={(e) => setAdditionalPayMethod(e.target.value as PaymentMethodEnum)}
                options={[
                  { label: "UPI / QR Code", value: "upi" },
                  { label: "Cash", value: "cash" },
                  { label: "Credit/Debit Card", value: "card" },
                  { label: "Bank Transfer", value: "bank_transfer" }
                ]}
              />

              <Input 
                label="Collection Amount (₹)"
                type="number" required min="1" max={Number(collectBalanceRecord.balance_due)}
                value={additionalPayment} onChange={(e) => setAdditionalPayment(e.target.value ? Number(e.target.value) : "")}
                placeholder={`Max: ₹${collectBalanceRecord.balance_due}`}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setCollectBalanceRecord(null)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!additionalPayment || isCollectingBalance}
                  isLoading={isCollectingBalance}
                  icon={<DollarSign size={14} strokeWidth={3} />}
                >
                  Record Receipt
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}