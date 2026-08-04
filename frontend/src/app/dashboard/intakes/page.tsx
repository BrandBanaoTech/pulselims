"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, Plus, ChevronDown, FileText, Printer, History, 
  Send, Trash2, ShieldAlert, Clock, X, User, Phone, 
  CheckCircle2, FlaskConical, Stethoscope, Activity, CreditCard
} from "lucide-react";

// ==========================================
// TYPES & MOCK DATA (Ready for API Integration)
// ==========================================
type ReportStatus = "Pending" | "Completed" | "Processing";
type PaymentStatus = "Paid" | "Unpaid";
type PriorityLevel = "Routine" | "Urgent" | "STAT";

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F" | "Other";
  phone: string;
  selectedTests: string[];
  totalBill: number;
  paymentStatus: PaymentStatus;
  reportStatus: ReportStatus;
  priority: PriorityLevel;
  tat: string;
}

const mockPatients: PatientRecord[] = [
  { id: "PT-10024", name: "Rahul Sharma", age: 42, gender: "M", phone: "9876543210", selectedTests: ["CBC", "LIPID"], totalBill: 1250, paymentStatus: "Paid", reportStatus: "Processing", priority: "STAT", tat: "1h 15m" },
  { id: "PT-10025", name: "Priya Patel", age: 28, gender: "F", phone: "9876543211", selectedTests: ["THYROID", "VIT-D"], totalBill: 1850, paymentStatus: "Unpaid", reportStatus: "Pending", priority: "Routine", tat: "4h 30m" },
  { id: "PT-10026", name: "Amit Kumar", age: 55, gender: "M", phone: "9876543212", selectedTests: ["HBA1C", "FBS"], totalBill: 600, paymentStatus: "Paid", reportStatus: "Completed", priority: "Routine", tat: "Ready" },
  { id: "PT-10027", name: "Sneha Reddy", age: 34, gender: "F", phone: "9876543213", selectedTests: ["LFT", "KFT"], totalBill: 1400, paymentStatus: "Paid", reportStatus: "Processing", priority: "Urgent", tat: "45m" },
  { id: "PT-10028", name: "Vikram Singh", age: 61, gender: "M", phone: "9876543214", selectedTests: ["ECG", "TMT"], totalBill: 2200, paymentStatus: "Unpaid", reportStatus: "Pending", priority: "STAT", tat: "2h 00m" },
];

export default function IntakesPage() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Completed">("All");
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Lock body scroll when Drawer is open
  useEffect(() => {
    if (isDrawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isDrawerOpen]);

  // 🚀 PERFORMANCE: Memoized filtering
  const filteredPatients = useMemo(() => {
    return mockPatients.filter(p => {
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
  }, [searchQuery, statusFilter]);

  // Action Dropdown Handler
  const toggleActions = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenActionId(openActionId === id ? null : id);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen animate-in fade-in duration-500 font-sans pb-24 relative">
      
      {/* ========================================================= */}
      {/* 1. PAGE HEADER                                            */}
      {/* ========================================================= */}
      <header className="mb-6 lg:mb-8">
        <div className="flex items-center gap-2.5 text-teal-600 mb-2">
          <Stethoscope size={18} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-widest">Active Operations</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Patient Intakes</h1>
            <p className="text-sm font-medium text-slate-500 mt-2 max-w-xl leading-relaxed">
              Register new patients, manage diagnostic queues, and track turnaround times across your laboratory.
            </p>
          </div>
          {/* <div className="flex items-center gap-3 shrink-0 hidden md:flex">
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200/60 shadow-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20"></span>
              Live Database Sync
            </span>
          </div> */}
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. PREMIUM SEARCH & ACTIONS PANEL                         */}
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
          {/* Mac-OS Style Segmented Control */}
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
      {/* 3. PATIENTS DATA GRID (Responsive)                        */}
      {/* ========================================================= */}
      
      {/* A. MOBILE CARDS (< lg) */}
      <div className="lg:hidden space-y-4 relative z-10">
        {filteredPatients.map((patient) => (
          <div key={patient.id} className="bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                {patient.id}
              </span>
              {/* Premium Radar Status Badge */}
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
                {patient.selectedTests.map((tId) => (
                  <span key={tId} className="px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-mono font-bold uppercase border border-slate-200 shadow-sm">
                    {tId}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-slate-100">
              <div>
                <span className="text-base font-black font-mono text-slate-900 block">₹{patient.totalBill}</span>
                {/* TAT Added to Mobile View */}
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
              
              {/* Mobile Dropdown Action */}
              <div className="relative">
                <button onClick={(e) => toggleActions(e, patient.id)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors outline-none shadow-sm">
                  Actions <ChevronDown size={14} />
                </button>
                {openActionId === patient.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setOpenActionId(null)} />
                      {/* Dropdown anchors to bottom if near bottom of screen */}
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
                    </>
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
              <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors group relative">
                
                {/* Demographics */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    {/* <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-50 to-cyan-50 border border-teal-100 flex items-center justify-center text-teal-700 font-black text-sm shadow-sm shrink-0">
                      {patient.name.charAt(0)}
                    </div> */}
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-teal-700 transition-colors truncate max-w-[150px]">{patient.name}</h4>
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
                      {patient.selectedTests.map((tId) => (
                        <span key={tId} className="px-2 py-0.5 bg-white text-slate-700 rounded-md border border-slate-200/80 text-[10px] font-mono font-bold uppercase shadow-sm">
                          {tId}
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

                {/* Billing */}
                <td className="py-4 px-6">
                  <span className="text-sm font-black font-mono text-slate-900 block">₹{patient.totalBill.toLocaleString('en-IN')}</span>
                  <span className={`inline-block text-[9px] font-black mt-1.5 uppercase tracking-widest rounded-md px-2 py-0.5 border shadow-sm ${
                    patient.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {patient.paymentStatus}
                  </span>
                </td>

                {/* Status & TAT Stack */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex flex-col gap-2 items-start">
                    
                    {/* 1. Premium Radar Status Badge */}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border shadow-sm transition-colors ${
                      patient.reportStatus === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' :
                      patient.reportStatus === 'Processing' ? 'bg-blue-50 text-blue-800 border-blue-200/80' :
                      'bg-amber-50 text-amber-800 border-amber-200/80'
                    }`}>
                      {/* Pinging Dot */}
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

                    {/* 2. TAT (Turnaround Time) with Clock Icon */}
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
                  <button onClick={(e) => toggleActions(e, patient.id)} className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm outline-none">
                    <span>Actions</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${openActionId === patient.id ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Desktop Dropdown - Glassmorphism */}
                  {openActionId === patient.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setOpenActionId(null)} />
                      <div className="absolute right-6 top-14 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95">
                        <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                          <FileText size={14} className="text-slate-400"/> Edit Metrics
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
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredPatients.length === 0 && (
          <div className="py-20 text-center bg-slate-50/50">
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
      {/* 4. PREMIUM SLIDE-OUT DRAWER (New Intake Form)             */}
      {/* ========================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Right Sliding Drawer */}
          <div className="relative w-full md:w-[500px] h-full bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-10">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white/95 backdrop-blur-md shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center border border-teal-100 shadow-sm">
                  <User size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">New Patient Intake</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Registration Form</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
              <form className="space-y-6">
                
                {/* Section 1: Demographics */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                    <User size={14} className="text-teal-600" /> Demographics
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                      <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-inner">
                        <input type="text" className="w-full py-3 px-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none" placeholder="e.g. Rahul Sharma" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Phone Number <span className="text-rose-500">*</span></label>
                      <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-inner">
                        <div className="pl-4 pr-2 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-slate-400" />
                        </div>
                        <input type="tel" className="w-full py-3 pr-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none" placeholder="98765 43210" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Age</label>
                        <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-inner">
                          <input type="number" className="w-full py-3 px-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none" placeholder="Yrs" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Gender</label>
                        <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-inner">
                          <select className="w-full py-3 pl-4 pr-8 bg-transparent text-sm font-bold text-slate-900 outline-none appearance-none cursor-pointer">
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="O">Other</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Diagnostics */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Activity size={14} className="text-teal-600" /> Diagnostics & Billing
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tests Ordered <span className="text-rose-500">*</span></label>
                      <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-inner">
                        <div className="pl-4 pr-2 flex items-center pointer-events-none">
                          <FlaskConical className="h-4 w-4 text-slate-400" />
                        </div>
                        <input type="text" className="w-full py-3 pr-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none" placeholder="Search tests (e.g. CBC)..." />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Priority Level</label>
                      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 shadow-inner">
                        {['Routine', 'Urgent', 'STAT'].map(p => (
                          <button type="button" key={p} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all outline-none ${p === 'Routine' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'text-slate-500 hover:text-slate-700'}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Total Amount</label>
                      <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-inner">
                        <div className="pl-4 pr-2 text-slate-400 font-bold font-mono">₹</div>
                        <input type="number" className="w-full py-3 pr-4 bg-transparent text-sm font-black font-mono text-slate-900 placeholder:text-slate-300 outline-none" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md flex justify-end gap-3 shrink-0 sticky bottom-0 z-20">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors outline-none"
              >
                Cancel
              </button>
              <button 
                className="px-8 py-3 text-sm font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 outline-none"
              >
                <CreditCard size={18} strokeWidth={2.5} /> Collect & Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}