// "use client";

// import { useState, useMemo, useEffect, useRef, useCallback } from "react";
// import { 
//   Search, Plus, MoreHorizontal, Copy, Trash2, 
//   X, FlaskConical, Microscope, Droplets, Dna, 
//   TestTubes, ShieldCheck, Clock, Settings2,
//   FileSignature, CheckCircle2, Zap, Info, Coffee, PowerOff, Loader2,
//   User, Phone, Stethoscope, Receipt, Tag, ChevronDown, Printer, Send,
//   Truck, Building2, Percent, ShieldAlert, AlertCircle, Check, Activity, FileText
// } from "lucide-react";

// // ⚠️ ZUSTAND STORE INTEGRATION (Assuming this exists in your project)
// import { useAuthStore } from "@/store/useAuthStore";

// // ==========================================
// // API CONFIGURATION
// // ==========================================
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// // ==========================================
// // TYPES & ENUMS
// // ==========================================
// type ReportStatus = "Pending" | "Completed" | "Processing";
// type PaymentStatus = "Paid" | "Unpaid" | "Partial";
// type PaymentMethod = "UPI" | "Cash" | "Card" | "Net Banking";
// type PriorityLevel = "Routine" | "Urgent" | "STAT";
// type CollectionMode = "Walk-in" | "Home Collection";
// type DiscountType = "percentage" | "flat";

// type Department = 
//   | "Hematology" | "Clinical Biochemistry" | "Endocrinology" 
//   | "Immunology & Serology" | "Clinical Pathology" | "Microbiology" 
//   | "Histopathology & Cytology" | "Tumor Markers";

// type TubeColor = "EDTA (Purple)" | "SST (Yellow/Red)" | "Fluoride (Grey)" | "Citrate (Blue)" | "Urine Container" | "Sterile Swab";

// interface LabTest {
//   id: string;
//   code: string;
//   name: string;
//   department: Department;
//   sampleType: string;
//   price: number;
//   tat: string;
// }

// interface PatientRecord {
//   id: string;
//   name: string;
//   age: number;
//   gender: "M" | "F" | "Other";
//   phone: string;
//   refDoctor: string;
//   collectionMode: CollectionMode;
//   selectedTests: string[];
//   subtotal: number;
//   discountAmount: number;
//   homeCharge: number;
//   totalBill: number;
//   paidAmount: number;
//   dueAmount: number;
//   paymentStatus: PaymentStatus;
//   paymentMethod: PaymentMethod;
//   reportStatus: ReportStatus;
//   priority: PriorityLevel;
//   tat: string;
//   registeredAt: string;
//   requiredTubes: TubeColor[];
// }

// // Initial Mock Intakes Queue
// const mockPatients: PatientRecord[] = [
//   { 
//     id: "PT-10024", name: "Rahul Sharma", age: 42, gender: "M", phone: "9876543210", 
//     refDoctor: "Dr. A. K. Gupta", collectionMode: "Walk-in", selectedTests: ["CBC", "LFT"], 
//     subtotal: 1250, discountAmount: 0, homeCharge: 0, totalBill: 1250, paidAmount: 1250, dueAmount: 0,
//     paymentStatus: "Paid", paymentMethod: "UPI", reportStatus: "Processing", priority: "STAT", tat: "1h 15m", 
//     registeredAt: "10:30 AM", requiredTubes: ["EDTA (Purple)", "SST (Yellow/Red)"]
//   },
//   { 
//     id: "PT-10025", name: "Priya Patel", age: 28, gender: "F", phone: "9876543211", 
//     refDoctor: "Self / Direct", collectionMode: "Home Collection", selectedTests: ["THY", "VIT-D3"], 
//     subtotal: 2600, discountAmount: 200, homeCharge: 150, totalBill: 2550, paidAmount: 1000, dueAmount: 1550,
//     paymentStatus: "Partial", paymentMethod: "Cash", reportStatus: "Pending", priority: "Routine", tat: "4h 30m", 
//     registeredAt: "11:15 AM", requiredTubes: ["SST (Yellow/Red)"]
//   },
//   { 
//     id: "PT-10026", name: "Amit Kumar", age: 55, gender: "M", phone: "9876543212", 
//     refDoctor: "Dr. S. Mehta", collectionMode: "Walk-in", selectedTests: ["HBA1C", "FBS"], 
//     subtotal: 700, discountAmount: 100, homeCharge: 0, totalBill: 600, paidAmount: 600, dueAmount: 0,
//     paymentStatus: "Paid", paymentMethod: "Card", reportStatus: "Completed", priority: "Routine", tat: "Ready", 
//     registeredAt: "Yesterday", requiredTubes: ["EDTA (Purple)", "Fluoride (Grey)"]
//   },
// ];

// export default function IntakesPage() {
//   const { token } = useAuthStore();

//   // Queue State
//   const [patients, setPatients] = useState<PatientRecord[]>(mockPatients);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Completed">("All");
//   const [openActionId, setOpenActionId] = useState<string | null>(null);
  
//   // Drawer & Form State
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const [fullName, setFullName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [age, setAge] = useState<number | "">("");
//   const [gender, setGender] = useState<"M" | "F" | "Other">("M");
//   const [refDoctor, setRefDoctor] = useState("Self / Direct");
//   const [collectionMode, setCollectionMode] = useState<CollectionMode>("Walk-in");
//   const [priority, setPriority] = useState<PriorityLevel>("Routine");
  
//   // Billing State
//   const [discountType, setDiscountType] = useState<DiscountType>("percentage");
//   const [discountValue, setDiscountValue] = useState<number | "">("");
//   const [homeCollectionCharge, setHomeCollectionCharge] = useState<number>(150);
//   const [paidInput, setPaidAmount] = useState<number | "">("");
//   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
//   const [sendWhatsapp, setSendWhatsapp] = useState(true);

//   // Combobox & API Test State
//   const [availableTests, setAvailableTests] = useState<LabTest[]>([]);
//   const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
//   const [isFetchingTests, setIsFetchingTests] = useState(false);
//   const [testSearchQuery, setTestSearchQuery] = useState("");
//   const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // ==========================================
//   // SMART CALCULATIONS (Subtotal, Tubes, Dues)
//   // ==========================================
//   const subtotal = useMemo(() => {
//     return selectedTests.reduce((sum, test) => sum + test.price, 0);
//   }, [selectedTests]);

//   const discountAmount = useMemo(() => {
//     if (!discountValue || discountValue <= 0) return 0;
//     const val = Number(discountValue);
//     if (discountType === "percentage") {
//       return Math.min(subtotal, Math.round((subtotal * val) / 100));
//     }
//     return Math.min(subtotal, val);
//   }, [subtotal, discountType, discountValue]);

//   const currentHomeCharge = collectionMode === "Home Collection" ? homeCollectionCharge : 0;
//   const netTotal = Math.max(0, subtotal - discountAmount + currentHomeCharge);

//   const paidAmount = paidInput === "" ? netTotal : Math.min(netTotal, Number(paidInput));
//   const dueAmount = Math.max(0, netTotal - paidAmount);

//   const calculatedPaymentStatus: PaymentStatus = useMemo(() => {
//     if (netTotal === 0) return "Paid";
//     if (paidAmount >= netTotal) return "Paid";
//     if (paidAmount > 0) return "Partial";
//     return "Unpaid";
//   }, [netTotal, paidAmount]);

//   const requiredTubes = useMemo(() => {
//     const tubes = new Set<TubeColor>();
//     selectedTests.forEach(t => {
//       const sample = t.sampleType?.toLowerCase() || "";
//       const dept = t.department?.toLowerCase() || "";
      
//       if (sample.includes("edta") || dept.includes("hematology")) tubes.add("EDTA (Purple)");
//       if (sample.includes("sst") || sample.includes("serum") || dept.includes("biochemistry") || dept.includes("endocrinology")) tubes.add("SST (Yellow/Red)");
//       if (sample.includes("fluoride") || t.name.toLowerCase().includes("sugar") || t.name.toLowerCase().includes("fbs")) tubes.add("Fluoride (Grey)");
//       if (sample.includes("citrate")) tubes.add("Citrate (Blue)");
//       if (sample.includes("urine")) tubes.add("Urine Container");
//       if (sample.includes("swab") || sample.includes("tissue")) tubes.add("Sterile Swab");
//     });
//     return Array.from(tubes);
//   }, [selectedTests]);

//   // ==========================================
//   // SIDE EFFECTS & API
//   // ==========================================
//   useEffect(() => {
//     if (isDrawerOpen) document.body.style.overflow = 'hidden';
//     else document.body.style.overflow = 'unset';
//     return () => { document.body.style.overflow = 'unset'; };
//   }, [isDrawerOpen]);

//   // FIX: Changed openDropdownId to openActionId to match state declaration
//   useEffect(() => {
//     const handleClickOutside = () => setOpenActionId(null);
//     if (openActionId) document.addEventListener("click", handleClickOutside);
//     return () => document.removeEventListener("click", handleClickOutside);
//   }, [openActionId]);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsTestDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const fetchActiveTests = useCallback(async () => {
//     if (!token) return;
//     try {
//       setIsFetchingTests(true);
//       const res = await fetch(`${API_BASE_URL}/api/v1/tests?is_active=true`, {
//         headers: { 
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${token}` 
//         }
//       });
//       if (!res.ok) throw new Error("Failed to fetch tests");
//       const data = await res.json();
//       setAvailableTests(data);
//     } catch (error) {
//       console.error("Error fetching lab tests:", error);
//     } finally {
//       setIsFetchingTests(false);
//     }
//   }, [token]);

//   useEffect(() => {
//     if (isDrawerOpen && availableTests.length === 0) {
//       fetchActiveTests();
//     }
//   }, [isDrawerOpen, availableTests.length, fetchActiveTests]);

//   // ==========================================
//   // HANDLERS
//   // ==========================================
//   const handleSelectTest = (test: LabTest) => {
//     if (!selectedTests.find(t => t.id === test.id)) {
//       setSelectedTests([...selectedTests, test]);
//     }
//     setTestSearchQuery("");
//     setIsTestDropdownOpen(false);
//   };

//   const handleRemoveTest = (testId: string) => {
//     setSelectedTests(selectedTests.filter(t => t.id !== testId));
//   };

//   const resetIntakeForm = () => {
//     setFullName("");
//     setPhone("");
//     setAge("");
//     setGender("M");
//     setRefDoctor("Self / Direct");
//     setCollectionMode("Walk-in");
//     setSelectedTests([]);
//     setPriority("Routine");
//     setDiscountType("percentage");
//     setDiscountValue("");
//     setPaidAmount("");
//     setPaymentMethod("UPI");
//     setIsDrawerOpen(false);
//   };

//   const handleSubmitIntake = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!fullName || !phone || selectedTests.length === 0) {
//       alert("Please fill required details and select at least one test.");
//       return;
//     }

//     const newPatient: PatientRecord = {
//       id: `PT-${Math.floor(Math.random() * 90000) + 10000}`,
//       name: fullName,
//       age: Number(age) || 30,
//       gender: gender,
//       phone: phone,
//       refDoctor: refDoctor || "Self / Direct",
//       collectionMode: collectionMode,
//       selectedTests: selectedTests.map(t => t.code),
//       subtotal: subtotal,
//       discountAmount: discountAmount,
//       homeCharge: currentHomeCharge,
//       totalBill: netTotal,
//       paidAmount: paidAmount,
//       dueAmount: dueAmount,
//       paymentStatus: calculatedPaymentStatus,
//       paymentMethod: paymentMethod,
//       reportStatus: "Pending",
//       priority: priority,
//       tat: priority === "STAT" ? "1h 30m" : "4h 00m",
//       registeredAt: "Just now",
//       requiredTubes: requiredTubes
//     };

//     setPatients([newPatient, ...patients]);
//     resetIntakeForm();
//   };

//   const deleteRecord = (id: string) => {
//     if (window.confirm("Delete this intake record?")) {
//       setPatients(prev => prev.filter(p => p.id !== id));
//       setOpenActionId(null);
//     }
//   };

//   const filteredPatients = useMemo(() => {
//     return patients.filter(p => {
//       const query = searchQuery.toLowerCase().trim();
//       const matchesSearch = 
//         p.name.toLowerCase().includes(query) ||
//         p.phone.includes(query) ||
//         p.id.toLowerCase().includes(query);
        
//       const matchesStatus = 
//         statusFilter === "All" ? true : 
//         statusFilter === "Pending" ? (p.reportStatus === "Pending" || p.reportStatus === "Processing") : 
//         p.reportStatus === "Completed";

//       return matchesSearch && matchesStatus;
//     });
//   }, [patients, searchQuery, statusFilter]);

//   const filteredComboboxTests = useMemo(() => {
//     return availableTests.filter(test => 
//       !selectedTests.find(t => t.id === test.id) &&
//       (test.name.toLowerCase().includes(testSearchQuery.toLowerCase()) || 
//        test.code.toLowerCase().includes(testSearchQuery.toLowerCase()))
//     );
//   }, [availableTests, selectedTests, testSearchQuery]);

//   const getDeptIcon = (dept: string) => {
//     if (dept?.includes("Hematology") || dept?.includes("Pathology")) return <Droplets size={14} className="text-rose-500" />;
//     if (dept?.includes("Biochemistry") || dept?.includes("Tumor")) return <FlaskConical size={14} className="text-amber-500" />;
//     if (dept?.includes("Endocrinology") || dept?.includes("Immunology")) return <Dna size={14} className="text-indigo-500" />;
//     if (dept?.includes("Microbiology") || dept?.includes("Histopathology")) return <Microscope size={14} className="text-emerald-500" />;
//     return <TestTubes size={14} className="text-cyan-500" />;
//   };

//   return (
//     <div className="flex flex-col h-[calc(100vh-120px)] w-full max-w-full animate-in fade-in duration-300">
      
//       {/* 1. HEADER */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mb-4">
//         <div>
//           <h2 className="text-lg font-bold text-slate-900 tracking-tight">Patient Intakes</h2>
//           <p className="text-sm text-slate-500 mt-1">
//             Register new patients, manage diagnostic queues, and track turnaround times.
//           </p>
//         </div>
//         <button
//           onClick={() => setIsDrawerOpen(true)}
//           className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95 outline-none whitespace-nowrap"
//         >
//           <Plus size={16} strokeWidth={2.5} /> New Intake
//         </button>
//       </div>

//       {/* 2. COMMAND BAR */}
//       <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full shrink-0 mb-4">
//         <div className="relative w-full lg:w-[320px] shrink-0">
//           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//           <input
//             type="text"
//             className="w-full pl-9 pr-4 py-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
//             placeholder="Search Reg ID, Name, Phone..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />
//         </div>

//         <div className="flex w-full lg:w-auto overflow-x-auto no-scrollbar gap-1">
//           {(["All", "Pending", "Completed"] as const).map((status) => {
//             const isActive = statusFilter === status;
//             return (
//               <button
//                 key={status}
//                 onClick={() => setStatusFilter(status)}
//                 className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap outline-none ${
//                   isActive ? "bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
//                 }`}
//               >
//                 {status}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* 3. RESPONSIVE TABLE WRAPPER */}
//       <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full relative z-10 flex-1 min-h-0 overflow-y-auto">
//         <table className="w-full text-left table-fixed">
//           <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-20 border-b border-slate-200">
//             <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
//               <th className="py-3 px-4 w-[60%] sm:w-[40%] md:w-[35%]">Patient & Details</th>
//               <th className="py-3 px-4 hidden md:table-cell w-[25%]">Diagnostics & Tubes</th>
//               <th className="py-3 px-4 hidden sm:table-cell w-[20%]">Billing & Dues</th>
//               <th className="py-3 px-4 hidden lg:table-cell w-[10%]">Status & TAT</th>
//               <th className="py-3 px-4 text-right w-[40%] sm:w-[20%] lg:w-[10%]">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {filteredPatients.map((patient, index) => {
//               const isBottomRow = index > 0 && index >= filteredPatients.length - 2;
//               const isDropdownOpen = openActionId === patient.id;

//               return (
//                 <tr key={patient.id} className="hover:bg-slate-50/60 transition-colors group bg-white">
                  
//                   {/* Column 1: Patient Details */}
//                   <td className="py-4 px-4 align-top">
//                     <div className="flex items-start gap-3">
//                       <div className="mt-0.5 w-8 h-8 rounded-md bg-slate-50 border border-slate-200 hidden sm:flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
//                         {patient.name.charAt(0)}
//                       </div>
//                       <div className="flex flex-col min-w-0 pr-2">
//                         <div className="flex items-center gap-2 flex-wrap">
//                           <span className="text-sm font-semibold text-slate-900 truncate">{patient.name}</span>
//                           <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 ring-1 ring-inset ring-slate-200 shrink-0">
//                             {patient.id}
//                           </span>
//                         </div>
//                         <div className="flex items-center gap-2 mt-0.5 flex-wrap">
//                           <span className="text-xs font-medium text-slate-500">{patient.age} Yrs ({patient.gender})</span>
//                           <span className="w-1 h-1 rounded-full bg-slate-200"></span>
//                           <span className="text-[10px] text-slate-400 font-mono truncate">{patient.phone}</span>
//                         </div>
                        
//                         <span className="text-[10px] font-medium text-slate-400 mt-1 truncate">
//                           Ref: <span className="text-slate-600 font-semibold">{patient.refDoctor}</span>
//                         </span>

//                         {/* Mobile Fallbacks */}
//                         <div className="flex sm:hidden items-center gap-2 mt-2 text-[11px] flex-wrap">
//                           <span className="font-bold text-slate-900">₹{patient.totalBill}</span>
//                           <span className="text-slate-300">•</span>
//                           <span className={`${patient.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'} font-bold`}>{patient.paymentStatus}</span>
//                           <span className="text-slate-300">•</span>
//                           <span className={`${patient.reportStatus === 'Completed' ? 'text-emerald-600' : 'text-amber-600'} font-bold`}>{patient.reportStatus}</span>
//                         </div>

//                         <div className="flex md:hidden items-center gap-2 mt-1.5 text-[11px] flex-wrap">
//                           <span className="text-slate-600 truncate">{patient.selectedTests.join(", ")}</span>
//                           {patient.priority === "STAT" && <span className="text-rose-600 font-bold shrink-0"> • STAT</span>}
//                         </div>
//                       </div>
//                     </div>
//                   </td>

//                   {/* Column 2: Diagnostics & Tubes */}
//                   <td className="py-4 px-4 hidden md:table-cell align-top">
//                     <div className="flex flex-col gap-1.5 items-start">
//                       <div className="flex flex-wrap gap-1">
//                         {patient.selectedTests.map((tCode) => (
//                           <span key={tCode} className="px-1.5 py-0.5 bg-slate-50 text-slate-700 rounded text-[9px] font-bold uppercase ring-1 ring-inset ring-slate-200/50">
//                             {tCode}
//                           </span>
//                         ))}
//                       </div>

//                       <div className="flex items-center gap-1 mt-1 flex-wrap">
//                         {patient.requiredTubes.map((tube, tIdx) => (
//                           <span key={tIdx} className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded">
//                             <span className={`w-1.5 h-1.5 rounded-full ${
//                               tube.includes("EDTA") ? "bg-purple-500" :
//                               tube.includes("SST") ? "bg-amber-400" :
//                               tube.includes("Fluoride") ? "bg-slate-400" : "bg-blue-500"
//                             }`}></span>
//                             {tube.split(" ")[0]}
//                           </span>
//                         ))}
//                       </div>

//                       {patient.priority === "STAT" && (
//                         <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-rose-600 tracking-widest bg-rose-50 px-1.5 py-0.5 rounded ring-1 ring-inset ring-rose-600/20 mt-1">
//                           <ShieldAlert size={10} /> STAT
//                         </span>
//                       )}
//                     </div>
//                   </td>

//                   {/* Column 3: Billing */}
//                   <td className="py-4 px-4 hidden sm:table-cell align-top">
//                     <div className="flex flex-col gap-1 items-start">
//                       <span className="text-sm font-semibold font-mono text-slate-900">₹{patient.totalBill.toLocaleString('en-IN')}</span>
                      
//                       <div className="flex items-center gap-1.5">
//                         <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ring-1 ring-inset ${
//                           patient.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
//                           patient.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
//                           'bg-rose-50 text-rose-700 ring-rose-600/20'
//                         }`}>
//                           {patient.paymentStatus}
//                         </span>
//                         <span className="text-[10px] text-slate-400 font-mono">({patient.paymentMethod})</span>
//                       </div>

//                       {patient.dueAmount > 0 && (
//                         <span className="text-[10px] font-bold text-rose-600 font-mono">Due: ₹{patient.dueAmount}</span>
//                       )}
//                     </div>
//                   </td>

//                   {/* Column 4: Status & TAT */}
//                   <td className="py-4 px-4 hidden lg:table-cell align-top">
//                     <div className="flex flex-col gap-1.5 items-start">
//                       <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold ring-1 ring-inset ${
//                         patient.reportStatus === 'Completed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
//                         patient.reportStatus === 'Processing' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
//                         'bg-amber-50 text-amber-700 ring-amber-600/20'
//                       }`}>
//                         <span className={`w-1.5 h-1.5 rounded-full ${
//                           patient.reportStatus === 'Completed' ? 'bg-emerald-500' : 
//                           patient.reportStatus === 'Processing' ? 'bg-blue-500' : 'bg-amber-500'
//                         }`}></span>
//                         {patient.reportStatus}
//                       </span>
                      
//                       <div className={`flex items-center gap-1 text-[10px] font-medium ${patient.tat === 'Ready' ? 'text-emerald-600' : patient.priority === 'STAT' ? 'text-rose-600' : 'text-slate-500'}`}>
//                         <Clock size={10} /> {patient.tat}
//                       </div>
//                     </div>
//                   </td>

//                   {/* Column 5: Standard Actions */}
//                   <td className={`py-4 px-4 text-right relative align-top ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
//                     <div className="flex items-center justify-end gap-1">
                      
//                       <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors outline-none sm:opacity-0 sm:group-hover:opacity-100" title="Enter Metrics">
//                         <FileText size={16} />
//                       </button>

//                       <div className="relative">
//                         <button 
//                           onClick={(e) => { 
//                             e.stopPropagation(); 
//                             setOpenActionId(isDropdownOpen ? null : patient.id); 
//                           }} 
//                           className={`p-1.5 rounded-md transition-colors outline-none ${isDropdownOpen ? 'text-slate-800 bg-slate-100' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}
//                         >
//                           <MoreHorizontal size={16} />
//                         </button>
                        
//                         {isDropdownOpen && (
//                           <div 
//                             className={`absolute right-0 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 ${
//                               isBottomRow ? "bottom-full mb-2 origin-bottom-right" : "top-full mt-2 origin-top-right"
//                             }`}
//                             onClick={(e) => e.stopPropagation()} 
//                           >
//                             <button className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 outline-none transition-colors">
//                               <FileText size={14} className="text-slate-400"/> Enter Metrics
//                             </button>
//                             <button className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 outline-none transition-colors">
//                               <Printer size={14} className="text-slate-400"/> Print Receipt
//                             </button>
//                             <button className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 outline-none transition-colors">
//                               <Send size={14} className="text-slate-400"/> WhatsApp Receipt
//                             </button>
//                             <div className="h-px bg-slate-100 my-1 mx-2" />
//                             <button onClick={() => deleteRecord(patient.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 outline-none transition-colors">
//                               <Trash2 size={14} className="text-red-500"/> Delete Record
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
        
//         {filteredPatients.length === 0 && (
//           <div className="py-20 text-center">
//             <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200">
//               <Search size={20} />
//             </div>
//             <p className="text-slate-900 font-semibold text-sm">No records found</p>
//             <button onClick={() => {setSearchQuery(""); setStatusFilter("All");}} className="mt-4 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors outline-none">
//               Clear Filters
//             </button>
//           </div>
//         )}
//       </div>

//       {/* ========================================================= */}
//       {/* 4. SMART CONFIGURATION DRAWER (New Patient Registration)  */}
//       {/* ========================================================= */}
//       {isDrawerOpen && (
//         <div className="fixed inset-0 z-[100] flex justify-end">
//           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" onClick={resetIntakeForm} />
          
//           <div className="relative w-full md:w-[600px] h-full bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-10 border-l border-slate-200">
            
//             <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
//               <div>
//                 <h2 className="text-base font-bold text-slate-900">New Patient Registration</h2>
//                 <p className="text-xs text-slate-500 mt-0.5">Register intake, assign diagnostics, & generate receipt</p>
//               </div>
//               <button onClick={resetIntakeForm} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md outline-none transition-colors"><X size={18} /></button>
//             </div>

//             <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
//               <form id="intake-form" onSubmit={handleSubmitIntake} className="space-y-6">
                
//                 {/* SECTION 1: DEMOGRAPHICS & REFERRAL */}
//                 <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
//                   <div className="flex items-center gap-2 text-slate-800 mb-2 border-b border-slate-100 pb-3">
//                     <User size={16} className="text-teal-600" />
//                     <span className="text-xs font-bold uppercase tracking-widest">Patient Demographics</span>
//                   </div>
                  
//                   <div>
//                     <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
//                     <input 
//                       type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
//                       className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all" 
//                       placeholder="e.g. Rahul Sharma" 
//                     />
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number <span className="text-rose-500">*</span></label>
//                       <div className="relative">
//                         <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                         <input 
//                           type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
//                           className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all" 
//                           placeholder="98765 43210" 
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ref. Physician</label>
//                       <input 
//                         type="text" value={refDoctor} onChange={(e) => setRefDoctor(e.target.value)} 
//                         className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all" 
//                         placeholder="e.g. Dr. A. K. Gupta" 
//                       />
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age</label>
//                       <input 
//                         type="number" value={age} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")} 
//                         className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all" 
//                         placeholder="Years" 
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gender</label>
//                       <div className="relative">
//                         <select 
//                           value={gender} onChange={(e) => setGender(e.target.value as "M" | "F" | "Other")} 
//                           className="w-full py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white appearance-none cursor-pointer"
//                         >
//                           <option value="M">Male</option>
//                           <option value="F">Female</option>
//                           <option value="Other">Other</option>
//                         </select>
//                         <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* SECTION 2: MULTI-SELECT DIAGNOSTIC TESTS */}
//                 <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
//                   <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
//                     <div className="flex items-center gap-2 text-slate-800">
//                       <Activity size={16} className="text-teal-600" />
//                       <span className="text-xs font-bold uppercase tracking-widest">Test Selection</span>
//                     </div>
//                     <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
//                       {selectedTests.length} Selected
//                     </span>
//                   </div>

//                   {/* Combobox Search */}
//                   <div className="relative" ref={dropdownRef}>
//                     <label className="block text-xs font-semibold text-slate-700 mb-1.5">Search Tests <span className="text-rose-500">*</span></label>
//                     <div className="relative">
//                       {isFetchingTests ? (
//                         <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 animate-spin" />
//                       ) : (
//                         <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                       )}
//                       <input 
//                         type="text" 
//                         className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all" 
//                         placeholder={isFetchingTests ? "Fetching active lab dictionary..." : "Type test name or code (e.g. CBC)..."}
//                         value={testSearchQuery} 
//                         onChange={(e) => {
//                           setTestSearchQuery(e.target.value);
//                           setIsTestDropdownOpen(true);
//                         }}
//                         onFocus={() => setIsTestDropdownOpen(true)}
//                       />
//                     </div>
                    
//                     {/* Combobox Dropdown */}
//                     {isTestDropdownOpen && (testSearchQuery.length > 0 || filteredComboboxTests.length > 0) && (
//                       <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95">
//                         {filteredComboboxTests.length === 0 ? (
//                           <div className="p-4 text-center text-xs font-semibold text-slate-400">No matching active tests found.</div>
//                         ) : (
//                           filteredComboboxTests.map(test => (
//                             <button 
//                               key={test.id} 
//                               type="button" 
//                               onClick={() => handleSelectTest(test)}
//                               className="w-full text-left px-3 py-2.5 hover:bg-teal-50 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-colors outline-none"
//                             >
//                               <div className="min-w-0 pr-2">
//                                 <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 truncate">{test.name}</div>
//                                 <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
//                                   <span>{getDeptIcon(test.department)}</span>
//                                   <span>{test.code}</span>
//                                 </div>
//                               </div>
//                               <div className="text-xs font-bold font-mono text-slate-900 shrink-0">₹{test.price}</div>
//                             </button>
//                           ))
//                         )}
//                       </div>
//                     )}
                    
//                     {/* Selected Tags */}
//                     {selectedTests.length > 0 && (
//                       <div className="flex flex-wrap gap-2 mt-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg shadow-inner max-h-32 overflow-y-auto">
//                         {selectedTests.map(test => (
//                           <div key={test.id} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 pl-2 pr-1 py-1 rounded-md shadow-sm animate-in zoom-in-95">
//                             <div className="flex flex-col">
//                               <span className="text-[10px] font-bold text-slate-800 leading-none">{test.name}</span>
//                               <span className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">₹{test.price}</span>
//                             </div>
//                             <button 
//                               type="button" 
//                               onClick={() => handleRemoveTest(test.id)} 
//                               className="p-0.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded transition-colors outline-none ml-1"
//                             >
//                               <X size={12} strokeWidth={3} />
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>

//                   {/* Phlebotomy Collection Tube Checklist */}
//                   {requiredTubes.length > 0 && (
//                     <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg space-y-1.5">
//                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phlebotomy Tube Collection Checklist:</span>
//                       <div className="flex flex-wrap gap-1.5">
//                         {requiredTubes.map((tube, idx) => (
//                           <span key={idx} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">
//                             <span className={`w-2 h-2 rounded-full ${
//                               tube.includes("EDTA") ? "bg-purple-500" :
//                               tube.includes("SST") ? "bg-amber-400" :
//                               tube.includes("Fluoride") ? "bg-slate-400" : "bg-blue-500"
//                             }`}></span>
//                             {tube}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {/* Priority & Mode Controls */}
//                   <div className="grid grid-cols-2 gap-4 pt-1">
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</label>
//                       <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50 shadow-inner">
//                         {(['Routine', 'STAT'] as PriorityLevel[]).map(p => (
//                           <button 
//                             type="button" 
//                             key={p} 
//                             onClick={() => setPriority(p)} 
//                             className={`flex-1 py-1 text-xs font-bold rounded-md transition-all outline-none ${
//                               priority === p 
//                                 ? p === 'STAT' ? 'bg-rose-500 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm' 
//                                 : 'text-slate-500 hover:text-slate-700'
//                             }`}
//                           >
//                             {p}
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-700 mb-1.5">Collection Type</label>
//                       <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50 shadow-inner">
//                         {(['Walk-in', 'Home Collection'] as CollectionMode[]).map(m => (
//                           <button 
//                             type="button" 
//                             key={m} 
//                             onClick={() => setCollectionMode(m)} 
//                             className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all outline-none ${
//                               collectionMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
//                             }`}
//                           >
//                             {m === 'Home Collection' ? 'Home' : 'Lab'}
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* SECTION 3: BILLING & PAYMENT RECEIPT CALCULATOR */}
//                 <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
//                   <div className="flex items-center gap-2 text-slate-800 mb-2 border-b border-slate-100 pb-3">
//                     <Receipt size={16} className="text-teal-600" />
//                     <span className="text-xs font-bold uppercase tracking-widest">Billing & Settlement</span>
//                   </div>
                  
//                   <div className="space-y-4">
//                     {/* Discount Controls */}
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-700 mb-1.5">Apply Discount</label>
//                       <div className="flex gap-2">
//                         <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
//                           <button 
//                             type="button" 
//                             onClick={() => setDiscountType("percentage")} 
//                             className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
//                               discountType === "percentage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
//                             }`}
//                           >
//                             %
//                           </button>
//                           <button 
//                             type="button" 
//                             onClick={() => setDiscountType("flat")} 
//                             className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
//                               discountType === "flat" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
//                             }`}
//                           >
//                             ₹
//                           </button>
//                         </div>
//                         <div className="relative flex-1">
//                           <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                           <input 
//                             type="number" 
//                             min="0" 
//                             value={discountValue} 
//                             onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")} 
//                             placeholder={discountType === "percentage" ? "Enter % (e.g. 10)" : "Enter Flat ₹"} 
//                             className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all" 
//                           />
//                         </div>
//                       </div>
//                     </div>

//                     {/* Payment Amount Received vs Dues */}
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method</label>
//                         <select 
//                           value={paymentMethod} 
//                           onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} 
//                           className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
//                         >
//                           <option value="UPI">UPI / QR</option>
//                           <option value="Cash">Cash</option>
//                           <option value="Card">Card</option>
//                           <option value="Net Banking">Net Banking</option>
//                         </select>
//                       </div>
//                       <div>
//                         <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount Received (₹)</label>
//                         <input 
//                           type="number" 
//                           min="0" 
//                           max={netTotal} 
//                           value={paidInput} 
//                           onChange={(e) => setPaidAmount(e.target.value !== "" ? Number(e.target.value) : "")} 
//                           placeholder={`Max ₹${netTotal}`} 
//                           className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all" 
//                         />
//                       </div>
//                     </div>

//                     {/* WhatsApp Toggle */}
//                     <div className="flex items-center gap-2 pt-1">
//                       <input 
//                         type="checkbox" 
//                         id="sendWhatsappCheck" 
//                         checked={sendWhatsapp} 
//                         onChange={(e) => setSendWhatsapp(e.target.checked)} 
//                         className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" 
//                       />
//                       <label htmlFor="sendWhatsappCheck" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
//                         Send digital receipt & WhatsApp tracking link to patient
//                       </label>
//                     </div>

//                     {/* LIVE BILL BREAKDOWN RECEIPT CARD */}
//                     <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2.5 font-mono shadow-md relative overflow-hidden mt-3">
//                       <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
//                         <span>Items Subtotal ({selectedTests.length})</span>
//                         <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
//                       </div>
                      
//                       {discountAmount > 0 && (
//                         <div className="flex justify-between items-center text-xs text-emerald-400 border-b border-slate-800 pb-2">
//                           <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Flat"})</span>
//                           <span className="font-bold">- ₹{discountAmount.toLocaleString('en-IN')}</span>
//                         </div>
//                       )}
                      
//                       {currentHomeCharge > 0 && (
//                         <div className="flex justify-between items-center text-xs text-amber-300 border-b border-slate-800 pb-2">
//                           <span>Home Collection Charge</span>
//                           <span className="font-bold">+ ₹{currentHomeCharge}</span>
//                         </div>
//                       )}
                      
//                       <div className="flex justify-between items-center pt-1">
//                         <span className="text-xs font-sans font-bold text-slate-300 uppercase tracking-widest">Net Bill Amount</span>
//                         <span className="text-lg font-black text-teal-400">₹{netTotal.toLocaleString('en-IN')}</span>
//                       </div>
                      
//                       {dueAmount > 0 && (
//                         <div className="flex justify-between items-center text-xs text-rose-400 pt-1 border-t border-slate-800/80">
//                           <span>Remaining Balance Due</span>
//                           <span className="font-bold">₹{dueAmount.toLocaleString('en-IN')}</span>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </form>
//             </div>

//             {/* Drawer Footer Actions */}
//             <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
//               <button 
//                 type="button" 
//                 onClick={resetIntakeForm} 
//                 className="px-4 sm:px-5 py-2.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors outline-none"
//               >
//                 Cancel
//               </button>
//               {/* FIX: Form Submit handled correctly without conflicting onClick logic */}
//               <button 
//                 type="submit" 
//                 form="intake-form"
//                 disabled={selectedTests.length === 0 || !fullName || !phone} 
//                 className="px-4 sm:px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all active:scale-95 outline-none flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
//               >
//                 <CheckCircle2 size={16} strokeWidth={2.5}/> Complete Registration
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { 
  Search, Plus, ChevronDown, FileText, Printer, History, 
  Send, Trash2, ShieldAlert, Clock, X, User, Phone, 
  CheckCircle2, FlaskConical, Stethoscope, Activity, CreditCard, 
  Loader2, Percent, Tag, Calculator, Receipt, Droplets, Dna, 
  Microscope, TestTubes, MoreHorizontal, PowerOff, Wallet
} from "lucide-react";

// ⚠️ ADJUST THIS IMPORT TO POINT TO YOUR ACTUAL ZUSTAND STORE LOCATION
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

// ==========================================
// API CONFIGURATION
// ==========================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ==========================================
// TYPES & ENUMS
// ==========================================
type ReportStatus = "Pending" | "Completed" | "Processing";
type PaymentStatus = "Paid" | "Unpaid" | "Partial";
type PaymentMethod = "Cash" | "UPI" | "Card" | "Net Banking";
type PriorityLevel = "Routine" | "Urgent" | "STAT";
type DiscountType = "percentage" | "flat";

type Department = 
  | "Hematology" | "Clinical Biochemistry" | "Endocrinology" 
  | "Immunology & Serology" | "Clinical Pathology" | "Microbiology" 
  | "Histopathology & Cytology" | "Tumor Markers";

interface LabTest {
  id: string;
  code: string;
  name: string;
  department: Department;
  price: number;
  tat: string;
}

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F" | "Other";
  phone: string;
  selectedTests: string[];
  subtotal: number;
  discountAmount: number;
  totalBill: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  reportStatus: ReportStatus;
  priority: PriorityLevel;
  tat: string;
  registeredAt: string;
}

// Initial Mock Patients Queue
const mockPatients: PatientRecord[] = [
  { id: "PT-10024", name: "Rahul Sharma", age: 42, gender: "M", phone: "9876543210", selectedTests: ["CBC", "LIPID"], subtotal: 1250, discountAmount: 0, totalBill: 1250, paymentStatus: "Paid", paymentMethod: "UPI", reportStatus: "Processing", priority: "STAT", tat: "1h 15m", registeredAt: "Today, 10:30 AM" },
  { id: "PT-10025", name: "Priya Patel", age: 28, gender: "F", phone: "9876543211", selectedTests: ["THYROID", "VIT-D"], subtotal: 2000, discountAmount: 150, totalBill: 1850, paymentStatus: "Unpaid", paymentMethod: "Cash", reportStatus: "Pending", priority: "Routine", tat: "4h 30m", registeredAt: "Today, 11:15 AM" },
  { id: "PT-10026", name: "Amit Kumar", age: 55, gender: "M", phone: "9876543212", selectedTests: ["HBA1C", "FBS"], subtotal: 700, discountAmount: 100, totalBill: 600, paymentStatus: "Paid", paymentMethod: "Card", reportStatus: "Completed", priority: "Routine", tat: "Ready", registeredAt: "Yesterday, 04:20 PM" },
  { id: "PT-10027", name: "Sneha Reddy", age: 34, gender: "F", phone: "9876543213", selectedTests: ["LFT", "KFT"], subtotal: 1550, discountAmount: 150, totalBill: 1400, paymentStatus: "Paid", paymentMethod: "UPI", reportStatus: "Processing", priority: "Urgent", tat: "45m", registeredAt: "Today, 01:00 PM" },
];

export default function IntakesPage() {
  const router = useRouter();
  // Auth Store
  const { token, activeLab } = useAuthStore();

  // Dashboard Queue State
  const [patients, setPatients] = useState<PatientRecord[]>(mockPatients);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Completed">("All");
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // New Patient Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"M" | "F" | "Other">("M");
  const [priority, setPriority] = useState<PriorityLevel>("Routine");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Paid");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");

  // Tests & Auto-combobox State
  const [availableTests, setAvailableTests] = useState<LabTest[]>([]);
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [isFetchingTests, setIsFetchingTests] = useState(false);
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live Billing & Discount State
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [isSubmitting, setIsSaving] = useState(false);

  // ==========================================
  // CALCULATIONS (Subtotal, Discount, Final)
  // ==========================================
  const subtotal = useMemo(() => {
    return selectedTests.reduce((sum, test) => sum + test.price, 0);
  }, [selectedTests]);

  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    const numericValue = Number(discountValue);
    
    if (discountType === "percentage") {
      const calculated = (subtotal * numericValue) / 100;
      return Math.min(subtotal, Math.round(calculated)); // Cap at subtotal
    } else {
      return Math.min(subtotal, numericValue); // Cap flat discount at subtotal
    }
  }, [subtotal, discountType, discountValue]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // ==========================================
  // SIDE EFFECTS & API FETCHING
  // ==========================================
  
  // Lock body scroll when Drawer is open
  useEffect(() => {
    if (isDrawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isDrawerOpen]);

  // Fetch Tests from FastAPI Backend when Drawer Opens
  const fetchActiveTests = useCallback(async () => {
    if (!token) return;
    try {
      setIsFetchingTests(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/tests?is_active=true`, {
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        }
      });
      if (!res.ok) throw new Error("Failed to fetch tests");
      const data = await res.json();
      setAvailableTests(data);
    } catch (error) {
      console.error("Error fetching lab tests:", error);
    } finally {
      setIsFetchingTests(false);
    }
  }, [token]);

  useEffect(() => {
    if (isDrawerOpen && availableTests.length === 0) {
      fetchActiveTests();
    }
  }, [isDrawerOpen, availableTests.length, fetchActiveTests]);

  // Close Combobox Dropdown on Outside Click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTestDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close Action Dropdowns on Outside Click
  useEffect(() => {
    const handleClickOutside = () => setOpenActionId(null);
    if (openActionId) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openActionId]);

  // ==========================================
  // FORM & SELECTION HANDLERS
  // ==========================================
  const handleSelectTest = (test: LabTest) => {
    if (!selectedTests.find(t => t.id === test.id)) {
      setSelectedTests([...selectedTests, test]);
    }
    setTestSearchQuery("");
    setIsTestDropdownOpen(false);
  };

  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter(t => t.id !== testId));
  };

  const resetIntakeForm = () => {
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
    setIsDrawerOpen(false);
  };

  const handleSubmitIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || selectedTests.length === 0) {
      alert("Please fill all required fields and select at least one test.");
      return;
    }

    const newPatient: PatientRecord = {
      id: `PT-${Math.floor(Math.random() * 90000) + 10000}`,
      name: fullName,
      age: Number(age) || 30,
      gender: gender,
      phone: phone,
      selectedTests: selectedTests.map(t => t.code),
      subtotal: subtotal,
      discountAmount: discountAmount,
      totalBill: finalTotal,
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      reportStatus: "Pending",
      priority: priority,
      tat: priority === "STAT" ? "1h 30m" : "4h 00m",
      registeredAt: "Just now"
    };

    setPatients([newPatient, ...patients]);
    resetIntakeForm();
  };

  // Filters for Table
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        p.name.toLowerCase().includes(query) ||
        p.phone.includes(query) ||
        p.id.toLowerCase().includes(query);
        
      const matchesStatus = 
        statusFilter === "All" ? true : 
        statusFilter === "Pending" ? (p.reportStatus === "Pending" || p.reportStatus === "Processing") : 
        p.reportStatus === "Completed";

      return matchesSearch && matchesStatus;
    });
  }, [patients, searchQuery, statusFilter]);

  const filteredComboboxTests = useMemo(() => {
    return availableTests.filter(test => 
      !selectedTests.find(t => t.id === test.id) &&
      (test.name.toLowerCase().includes(testSearchQuery.toLowerCase()) || 
       test.code.toLowerCase().includes(testSearchQuery.toLowerCase()))
    );
  }, [availableTests, selectedTests, testSearchQuery]);

  const getDeptIcon = (dept: string) => {
    if (dept?.includes("Hematology") || dept?.includes("Pathology")) return <Droplets size={14} className="text-rose-500" />;
    if (dept?.includes("Biochemistry") || dept?.includes("Tumor")) return <FlaskConical size={14} className="text-amber-500" />;
    if (dept?.includes("Endocrinology") || dept?.includes("Immunology")) return <Dna size={14} className="text-indigo-500" />;
    if (dept?.includes("Microbiology") || dept?.includes("Histopathology")) return <Microscope size={14} className="text-emerald-500" />;
    return <TestTubes size={14} className="text-cyan-500" />;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen animate-in fade-in duration-500 font-sans pb-24 relative">
      
      {/* ========================================================= */}
      {/* 1. PAGE HEADER                                            */}
      {/* ========================================================= */}
      <header className="mb-6 lg:mb-8">
        <div className="flex items-center gap-2.5 text-teal-600 mb-2">
          <Stethoscope size={18} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-widest">Active Operations • {activeLab || "Main Workspace"}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Patient Intakes</h1>
            <p className="text-sm font-medium text-slate-500 mt-2 max-w-xl leading-relaxed">
              Register new patients, manage diagnostic queues, and track turnaround times across your laboratory.
            </p>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. SEARCH & ACTIONS PANEL                                 */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-3 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 mb-6 relative z-20">
        
        <div className="relative w-full lg:w-[400px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white outline-none transition-all shadow-inner"
            placeholder="Search Reg ID, Name, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Segmented Control */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-full sm:w-auto border border-slate-200/50 shadow-inner">
            {(["All", "Pending", "Completed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 sm:flex-initial px-6 py-2 text-xs font-bold rounded-xl transition-all outline-none ${
                  statusFilter === status 
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/80" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-black rounded-2xl shadow-lg shadow-slate-900/20 transition-all active:scale-95 shrink-0 outline-none"
          >
            <Plus size={16} strokeWidth={3} /> New Intake
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. PATIENTS DATA GRID (Responsive & Interactive)          */}
      {/* ========================================================= */}
      
      {/* A. MOBILE CARDS (< lg) */}
      <div className="lg:hidden space-y-4 relative z-10">
        {filteredPatients.map((patient) => (
          <div key={patient.id} className="bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                {patient.id}
              </span>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border shadow-sm transition-colors ${
                patient.reportStatus === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' :
                patient.reportStatus === 'Processing' ? 'bg-blue-50 text-blue-800 border-blue-200/80' :
                'bg-amber-50 text-amber-800 border-amber-200/80'
              }`}>
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  {patient.reportStatus !== 'Completed' && (
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                      patient.reportStatus === 'Processing' ? 'bg-blue-400' : 'bg-amber-400'
                    }`}></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                    patient.reportStatus === 'Completed' ? 'bg-emerald-500' : 
                    patient.reportStatus === 'Processing' ? 'bg-blue-500' : 'bg-amber-500'
                  }`}></span>
                </span>
                <span>{patient.reportStatus}</span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-900 tracking-tight">{patient.name}</h4>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                {patient.age} Yrs • {patient.gender} • +91 {patient.phone}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Tests Ordered</span>
                {patient.priority === "STAT" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-rose-600 tracking-widest bg-rose-50 px-2 py-0.5 rounded border border-rose-100 shadow-sm">
                    <ShieldAlert size={10} /> STAT Priority
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.selectedTests.map((tCode) => (
                  <span key={tCode} className="px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-mono font-bold uppercase border border-slate-200 shadow-sm">
                    {tCode}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-slate-100">
              <div>
                <span className="text-base font-black font-mono text-slate-900 block">₹{patient.totalBill.toLocaleString('en-IN')}</span>
                <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold tracking-wide ${
                  patient.tat === 'Ready' ? 'text-emerald-600' : 
                  patient.priority === 'STAT' ? 'text-rose-600' : 'text-slate-500'
                }`}>
                  {patient.tat === 'Ready' ? (
                    <CheckCircle2 size={12} strokeWidth={3} className="text-emerald-500" />
                  ) : (
                    <Clock size={12} strokeWidth={2.5} className={patient.priority === 'STAT' ? 'text-rose-500' : 'text-slate-400'} />
                  )}
                  <span>TAT: {patient.tat}</span>
                </div>
              </div>
              
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenActionId(openActionId === patient.id ? null : patient.id);
                  }} 
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors outline-none shadow-sm"
                >
                  Actions <ChevronDown size={14} />
                </button>
                {openActionId === patient.id && (
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-slate-200/80 rounded-2xl shadow-2xl py-2 z-40 animate-in fade-in zoom-in-95">
                    <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors">
                      <FileText size={14} className="text-slate-400" /> Enter Metrics
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors">
                      <Printer size={14} className="text-slate-400" /> Print Label
                    </button>
                    <div className="h-px bg-slate-100 my-1 mx-2" />
                    <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors rounded-b-2xl">
                      <Trash2 size={14} className="text-rose-400" /> Delete Record
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        ))}
        {filteredPatients.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 py-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
              <Search size={32} />
            </div>
            <p className="text-slate-900 font-bold">No records found</p>
            <p className="text-sm text-slate-500 mt-1">Adjust your filters or clear the search query.</p>
            <button onClick={() => {setSearchQuery(""); setStatusFilter("All");}} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* B. DESKTOP TABLE (>= lg) */}
      <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-visible mb-12 relative z-10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
              <th className="py-5 px-6 rounded-tl-[2rem]">Patient & Demographics</th>
              <th className="py-5 px-6">Diagnostics</th>
              <th className="py-5 px-6">Billing</th>
              <th className="py-5 px-6">Status & Tracking</th>
              <th className="py-5 px-6 text-right rounded-tr-[2rem]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPatients.map((patient) => (
              <tr key={patient.id} onClick={() => router.push(`/dashboard/reports/${patient.id}`)} className="hover:bg-slate-50/80 transition-colors group relative">
                
                {/* Demographics */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-teal-700 transition-colors truncate max-w-[180px]">{patient.name}</h4>
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md shadow-sm">
                          {patient.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 font-semibold tracking-wide">
                        {patient.age} Yrs <span className="mx-1">•</span> {patient.gender} <span className="mx-1">•</span> {patient.phone}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Diagnostics/Tests */}
                <td className="py-4 px-6">
                  <div className="flex flex-col gap-2 items-start">
                    <div className="flex flex-wrap gap-1.5">
                      {patient.selectedTests.map((tCode) => (
                        <span key={tCode} className="px-2 py-0.5 bg-white text-slate-700 rounded-md border border-slate-200/80 text-[10px] font-mono font-bold uppercase shadow-sm">
                          {tCode}
                        </span>
                      ))}
                    </div>
                    {patient.priority === "STAT" && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-rose-600 tracking-widest bg-rose-50 px-2 py-0.5 rounded border border-rose-100 shadow-sm">
                        <ShieldAlert size={10} /> STAT Priority
                      </span>
                    )}
                  </div>
                </td>

                {/* Billing & Payment Status */}
                <td className="py-4 px-6">
                  <span className="text-sm font-black font-mono text-slate-900 block">₹{patient.totalBill.toLocaleString('en-IN')}</span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest rounded-md px-2 py-0.5 border shadow-sm ${
                      patient.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      patient.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {patient.paymentStatus}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">({patient.paymentMethod})</span>
                  </div>
                </td>

                {/* Status & TAT Stack */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex flex-col gap-2 items-start">
                    
                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border shadow-sm transition-colors ${
                      patient.reportStatus === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' :
                      patient.reportStatus === 'Processing' ? 'bg-blue-50 text-blue-800 border-blue-200/80' :
                      'bg-amber-50 text-amber-800 border-amber-200/80'
                    }`}>
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        {patient.reportStatus !== 'Completed' && (
                          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                            patient.reportStatus === 'Processing' ? 'bg-blue-400' : 'bg-amber-400'
                          }`}></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                          patient.reportStatus === 'Completed' ? 'bg-emerald-500' : 
                          patient.reportStatus === 'Processing' ? 'bg-blue-500' : 'bg-amber-500'
                        }`}></span>
                      </span>
                      <span>{patient.reportStatus}</span>
                    </div>

                    {/* TAT */}
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold tracking-wide ${
                      patient.tat === 'Ready' ? 'text-emerald-600' : 
                      patient.priority === 'STAT' ? 'text-rose-600' : 'text-slate-500'
                    }`}>
                      {patient.tat === 'Ready' ? (
                        <CheckCircle2 size={12} strokeWidth={3} className="text-emerald-500" />
                      ) : (
                        <Clock size={12} strokeWidth={2.5} className={patient.priority === 'STAT' ? 'text-rose-500' : 'text-slate-400'} />
                      )}
                      <span>TAT: {patient.tat}</span>
                    </div>

                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-6 text-right relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionId(openActionId === patient.id ? null : patient.id);
                    }} 
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm outline-none"
                  >
                    <span>Actions</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${openActionId === patient.id ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {openActionId === patient.id && (
                    <div className="absolute right-6 top-14 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95">
                      <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                        <FileText size={14} className="text-slate-400"/> Enter Metrics
                      </button>
                      <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                        <Printer size={14} className="text-slate-400"/> Print Label
                      </button>
                      <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                        <History size={14} className="text-slate-400"/> View History
                      </button>
                      <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                        <Send size={14} className="text-slate-400"/> WhatsApp 
                      </button>
                      <div className="h-px bg-slate-100 my-1.5 mx-2" />
                      <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors outline-none rounded-b-2xl">
                        <Trash2 size={14} className="text-rose-400"/> Delete 
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredPatients.length === 0 && (
          <div className="py-20 text-center bg-slate-50/50 rounded-b-[2rem]">
            <div className="w-16 h-16 bg-white text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
              <Search size={32} />
            </div>
            <p className="text-slate-900 font-bold">No records found</p>
            <p className="text-sm text-slate-500 mt-1">Adjust your filters or clear the search query.</p>
            <button onClick={() => {setSearchQuery(""); setStatusFilter("All");}} className="mt-4 px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. PREMIUM SLIDE-OUT DRAWER (New Patient Registration)    */}
      {/* ========================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in"
            onClick={resetIntakeForm}
          />
          
          {/* Right Sliding Drawer */}
          <div className="relative w-full md:w-[550px] h-full bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-10">
            
            {/* Drawer Header */}
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
              <button 
                onClick={resetIntakeForm}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
              <form onSubmit={handleSubmitIntake} className="space-y-6">
                
                {/* SECTION 1: DEMOGRAPHICS */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                    <User size={14} className="text-teal-600" /> Patient Demographics
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all" 
                        placeholder="e.g. Rahul Sharma" 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Phone Number <span className="text-rose-500">*</span></label>
                      <div className="relative flex items-center">
                        <Phone size={16} className="absolute left-4 text-slate-400 pointer-events-none" />
                        <input 
                          type="tel" 
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full py-3 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all" 
                          placeholder="98765 43210" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Age</label>
                        <input 
                          type="number" 
                          value={age}
                          onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                          className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all" 
                          placeholder="Years" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Gender</label>
                        <div className="relative">
                          <select 
                            value={gender}
                            onChange={(e) => setGender(e.target.value as any)}
                            className="w-full py-3 pl-4 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none appearance-none cursor-pointer"
                          >
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="Other">Other</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
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
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Search Diagnostics <span className="text-rose-500">*</span></label>
                      
                      <div className="relative flex items-center">
                        {isFetchingTests ? (
                          <Loader2 size={16} className="absolute left-4 text-teal-600 animate-spin" />
                        ) : (
                          <Search size={16} className="absolute left-4 text-slate-400" />
                        )}
                        <input 
                          type="text" 
                          className="w-full py-3 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all" 
                          placeholder={isFetchingTests ? "Fetching active lab dictionary..." : "Type test name or code (e.g. CBC, Lipid)..."} 
                          value={testSearchQuery}
                          onChange={(e) => {
                            setTestSearchQuery(e.target.value);
                            setIsTestDropdownOpen(true);
                          }}
                          onFocus={() => setIsTestDropdownOpen(true)}
                        />
                      </div>

                      {/* Dropdown Options List */}
                      {isTestDropdownOpen && (testSearchQuery.length > 0 || filteredComboboxTests.length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                          {filteredComboboxTests.length === 0 ? (
                            <div className="p-4 text-center text-xs font-semibold text-slate-400">No active tests matching query.</div>
                          ) : (
                            filteredComboboxTests.map(test => (
                              <button
                                key={test.id}
                                type="button"
                                onClick={() => handleSelectTest(test)}
                                className="w-full text-left px-4 py-3 hover:bg-teal-50/60 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-colors outline-none"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">{test.name}</div>
                                  <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
                                    <span>{getDeptIcon(test.department)}</span>
                                    <span>{test.code}</span>
                                    <span>•</span>
                                    <span>TAT: {test.tat}</span>
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
                          <button 
                            type="button" 
                            onClick={() => setSelectedTests([])}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline underline-offset-2 outline-none"
                          >
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
                              <button 
                                type="button" 
                                onClick={() => handleRemoveTest(test.id)}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-md transition-colors outline-none ml-1"
                              >
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
                        {(['Routine', 'Urgent', 'STAT'] as PriorityLevel[]).map(p => (
                          <button 
                            type="button" 
                            key={p} 
                            onClick={() => setPriority(p)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all outline-none ${
                              priority === p 
                                ? p === 'STAT' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm border border-slate-200/80' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* SECTION 3: ITEMIZATION, DISCOUNT & BILLING CALCULATOR */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Receipt size={14} className="text-teal-600" /> Billing & Payment Details
                  </h3>

                  <div className="space-y-4">
                    
                    {/* Discount Input Options */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Apply Discount</label>
                      <div className="flex gap-2">
                        {/* Discount Mode Switcher */}
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                          <button
                            type="button"
                            onClick={() => setDiscountType("percentage")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              discountType === "percentage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountType("flat")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              discountType === "flat" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                            }`}
                          >
                            ₹
                          </button>
                        </div>

                        {/* Value Input */}
                        <div className="relative flex-1">
                          <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="number" 
                            min="0"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")}
                            placeholder={discountType === "percentage" ? "Enter % (e.g. 10)" : "Enter Flat ₹ (e.g. 150)"}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment Mode & Status Controls */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Payment Status</label>
                        <select
                          value={paymentStatus}
                          onChange={(e) => setPaymentStatus(e.target.value as any)}
                          className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                        >
                          <option value="Paid">Paid</option>
                          <option value="Unpaid">Unpaid</option>
                          <option value="Partial">Partial</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                        >
                          <option value="UPI">UPI / QR</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Credit/Debit Card</option>
                          <option value="Net Banking">Net Banking</option>
                        </select>
                      </div>
                    </div>

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
              <button 
                type="button"
                onClick={resetIntakeForm}
                className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors outline-none"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSubmitIntake}
                disabled={selectedTests.length === 0 || !fullName || !phone}
                className="px-8 py-3 text-sm font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 outline-none disabled:opacity-50 disabled:pointer-events-none"
              >
                <CreditCard size={18} strokeWidth={2.5} /> Save Intake
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}