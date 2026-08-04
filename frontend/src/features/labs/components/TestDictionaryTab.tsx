"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, Plus, ChevronDown, FileEdit, Copy, Trash2, 
  PowerOff, X, FlaskConical, Activity, CreditCard, 
  Microscope, Droplets, Dna, TestTubes, CheckCircle2, ShieldAlert,
  Clock
} from "lucide-react";

// ==========================================
// TYPES & MOCK DATA (Ready for API Integration)
// ==========================================
type Department = "Hematology" | "Biochemistry" | "Immunology" | "Microbiology" | "Pathology";
type SampleType = "Whole Blood" | "Serum" | "Plasma" | "Urine" | "Tissue Swab";

interface LabTest {
  id: string;
  code: string;
  name: string;
  department: Department;
  sampleType: SampleType;
  price: number;
  tat: string;
  isActive: boolean;
}

const mockTests: LabTest[] = [
  { id: "DICT-101", code: "CBC", name: "Complete Blood Count", department: "Hematology", sampleType: "Whole Blood", price: 450, tat: "4 Hours", isActive: true },
  { id: "DICT-102", code: "LIPID", name: "Lipid Profile", department: "Biochemistry", sampleType: "Serum", price: 850, tat: "6 Hours", isActive: true },
  { id: "DICT-103", code: "THY", name: "Thyroid Panel (T3, T4, TSH)", department: "Immunology", sampleType: "Serum", price: 1200, tat: "12 Hours", isActive: true },
  { id: "DICT-104", code: "UR-C", name: "Urine Routine & Microscopy", department: "Pathology", sampleType: "Urine", price: 300, tat: "2 Hours", isActive: true },
  { id: "DICT-105", code: "HBA1C", name: "Glycosylated Hemoglobin", department: "Biochemistry", sampleType: "Whole Blood", price: 600, tat: "4 Hours", isActive: false },
  { id: "DICT-106", code: "CRP", name: "C-Reactive Protein (Quantitative)", department: "Immunology", sampleType: "Serum", price: 750, tat: "6 Hours", isActive: true },
  { id: "DICT-107", code: "CULT-B", name: "Blood Culture & Sensitivity", department: "Microbiology", sampleType: "Whole Blood", price: 1500, tat: "48 Hours", isActive: true },
];

export function TestDictionaryTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState<Department | "All">("All");
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
  const filteredTests = useMemo(() => {
    return mockTests.filter(test => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        test.name.toLowerCase().includes(query) ||
        test.code.toLowerCase().includes(query) ||
        test.id.toLowerCase().includes(query);
        
      const matchesDept = deptFilter === "All" || test.department === deptFilter;

      return matchesSearch && matchesDept;
    });
  }, [searchQuery, deptFilter]);

  // Action Dropdown Handler
  const toggleActions = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenActionId(openActionId === id ? null : id);
  };

  // Department Icon Mapper
  const getDeptIcon = (dept: Department) => {
    switch (dept) {
      case "Hematology": return <Droplets size={14} className="text-rose-500" />;
      case "Biochemistry": return <FlaskConical size={14} className="text-amber-500" />;
      case "Immunology": return <Dna size={14} className="text-indigo-500" />;
      case "Microbiology": return <Microscope size={14} className="text-emerald-500" />;
      case "Pathology": return <TestTubes size={14} className="text-cyan-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen animate-in fade-in duration-500 font-sans pb-24 relative">
      
      {/* ========================================================= */}
      {/* 1. PAGE HEADER                                            */}
      {/* ========================================================= */}
      {/* <header className="mb-6 lg:mb-8 px-2 md:px-0">
        <div className="flex items-center gap-2.5 text-teal-600 mb-2">
          <FlaskConical size={18} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-widest">Configuration Console</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Test Dictionary</h1>
            <p className="text-sm font-medium text-slate-500 mt-2 max-w-xl leading-relaxed">
              Manage your master catalogue of diagnostic parameters, turnaround times, and pricing models.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 hidden md:flex">
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200/60 shadow-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20"></span>
              System Synced
            </span>
          </div>
        </div>
      </header> */}

      {/* ========================================================= */}
      {/* 2. PREMIUM SEARCH & SMART FILTERS                         */}
      {/* ========================================================= */}
      <div className="bg-white rounded-[2rem] border border-slate-200/80 p-3 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4 mb-8 relative z-20 mx-2 md:mx-0">
        
        {/* Search Input */}
        <div className="relative w-full xl:w-[400px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white outline-none transition-all shadow-inner"
            placeholder="Search Test Name, Code (e.g. CBC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full xl:w-auto">
          {/* Smart Department Filter */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-full md:w-auto border border-slate-200/50 shadow-inner overflow-x-auto no-scrollbar">
            {(["All", "Hematology", "Biochemistry", "Immunology"] as const).map((dept) => {
              const isActive = deptFilter === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setDeptFilter(dept as any)}
                  className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all outline-none whitespace-nowrap ${
                    isActive 
                      ? "bg-white text-teal-700 shadow-sm border border-slate-200/80" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                  }`}
                >
                  {dept === "All" ? "All Departments" : dept}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-black rounded-2xl shadow-lg shadow-slate-900/20 transition-all active:scale-95 shrink-0 outline-none"
          >
            <Plus size={16} strokeWidth={3} /> Configure New Test
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. UNIFIED RESPONSIVE DATA TABLE                          */}
      {/* ========================================================= */}
      <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] mb-12 relative z-10 mx-2 md:mx-0">
        
        {/* Table Scroll Wrapper */}
        <div className="w-full overflow-x-auto no-scrollbar rounded-[2rem] pb-24 -mb-24">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                <th className="py-5 px-6 font-black rounded-tl-[2rem]">Diagnostic Test</th>
                <th className="py-5 px-6 font-black">Clinical Parameter</th>
                <th className="py-5 px-6 font-black">Billing Rate</th>
                <th className="py-5 px-6 font-black">Platform Status</th>
                {/* 🚀 Sticky Glassmorphic Header */}
                <th className="py-5 px-6 text-right font-black sticky right-0 bg-slate-50/95 backdrop-blur-md shadow-[-12px_0_15px_-10px_rgba(0,0,0,0.05)] z-20 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200/80 rounded-tr-[2rem]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTests.map((test) => (
                <tr key={test.id} className={`transition-colors group relative ${test.isActive ? 'hover:bg-slate-50/60' : 'bg-slate-50/30'}`}>
                  
                  {/* 1. Test Details */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-sm shadow-sm shrink-0 ${
                        test.isActive ? 'bg-gradient-to-tr from-teal-50 to-cyan-50 border-teal-100 text-teal-700 font-black' : 'bg-slate-100 border-slate-200 text-slate-400 font-bold'
                      }`}>
                        {test.code.substring(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className={`text-sm font-black transition-colors truncate max-w-[250px] ${test.isActive ? 'text-slate-900 group-hover:text-teal-700' : 'text-slate-500'}`}>
                            {test.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-sm border ${
                            test.isActive ? 'bg-slate-100 border-slate-200/80 text-slate-600' : 'bg-transparent border-slate-200 text-slate-400'
                          }`}>
                            {test.code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono tracking-widest">{test.id}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Clinical Parameters */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex flex-col gap-2 items-start">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${test.isActive ? 'bg-white text-slate-700 border-slate-200/80' : 'bg-transparent text-slate-400 border-slate-200'}`}>
                        {getDeptIcon(test.department)}
                        {test.department}
                      </span>
                      <span className={`text-[11px] font-semibold tracking-wide ${test.isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                        Sample: <span className="font-bold">{test.sampleType}</span>
                      </span>
                    </div>
                  </td>

                  {/* 3. Billing & TAT */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`text-sm font-black font-mono block ${test.isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                        ₹{test.price.toLocaleString('en-IN')}
                      </span>
                      <span className={`text-[10px] font-bold tracking-wide flex items-center gap-1 ${test.isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                        <Clock size={10} className="mb-px" /> TAT: {test.tat}
                      </span>
                    </div>
                  </td>

                  {/* 4. Status */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border shadow-sm transition-colors ${
                      test.isActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' : 'bg-slate-50 text-slate-500 border-slate-200/80'
                    }`}>
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        {test.isActive && (
                          <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-emerald-400"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                          test.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}></span>
                      </span>
                      <span className="pt-px">{test.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>

                  {/* 5. Actions - 🚀 Sticky Glassmorphic Cell */}
                  <td className="py-4 px-6 text-right relative sticky right-0 bg-white/60 backdrop-blur-xl group-hover:bg-slate-50/60 shadow-[-12px_0_15px_-10px_rgba(0,0,0,0.05)] transition-colors z-20 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200/80">
                    <button onClick={(e) => toggleActions(e, test.id)} className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm outline-none focus:ring-2 focus:ring-teal-500/20">
                      <span>Actions</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${openActionId === test.id ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Floating Dropdown Menu */}
                    {openActionId === test.id && (
                      <>
                        <div className="fixed inset-0 z-30 cursor-default" onClick={() => setOpenActionId(null)} />
                        
                        <div className="absolute right-6 top-14 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-2 z-40 animate-in fade-in zoom-in-95 origin-top-right">
                          <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                            <FileEdit size={14} className="text-slate-400"/> Edit Parameters
                          </button>
                          <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors outline-none">
                            <Copy size={14} className="text-slate-400"/> Duplicate Test
                          </button>
                          <div className="h-px bg-slate-100 my-1.5 mx-2" />
                          <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2.5 transition-colors outline-none">
                            <PowerOff size={14} className="text-amber-400"/> {test.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors outline-none rounded-b-2xl">
                            <Trash2 size={14} className="text-rose-400"/> Delete Permanently
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Empty State Fallback */}
          {filteredTests.length === 0 && (
            <div className="py-24 text-center bg-slate-50/30">
              <div className="w-16 h-16 bg-white text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
                <Search size={32} />
              </div>
              <p className="text-slate-900 font-bold text-lg">No dictionary records found</p>
              <p className="text-sm text-slate-500 mt-1">Adjust your filters or configure a new test.</p>
              <button onClick={() => {setSearchQuery(""); setDeptFilter("All");}} className="mt-5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-md outline-none">
                Clear All Filters
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. PREMIUM SLIDE-OUT DRAWER (Configure Test)              */}
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
                  <FlaskConical size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Configure Test</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Dictionary Record</p>
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
                
                {/* Section 1: Core Metadata */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                    <FileEdit size={14} className="text-teal-600" /> Core Metadata
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Test Name <span className="text-rose-500">*</span></label>
                      <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-inner">
                        <input type="text" className="w-full py-3 px-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none" placeholder="e.g. Complete Blood Count" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Test Code <span className="text-rose-500">*</span></label>
                        <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-inner">
                          <input type="text" className="w-full py-3 px-4 bg-transparent text-sm font-black font-mono text-slate-900 placeholder:text-slate-400 outline-none uppercase" placeholder="e.g. CBC" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Department</label>
                        <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-inner">
                          <select className="w-full py-3 pl-4 pr-8 bg-transparent text-sm font-bold text-slate-900 outline-none appearance-none cursor-pointer">
                            <option>Hematology</option>
                            <option>Biochemistry</option>
                            <option>Immunology</option>
                            <option>Pathology</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Clinical Parameters */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Activity size={14} className="text-teal-600" /> Clinical Processing
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Sample Type</label>
                        <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-inner">
                          <select className="w-full py-3 pl-4 pr-8 bg-transparent text-sm font-bold text-slate-900 outline-none appearance-none cursor-pointer">
                            <option>Whole Blood</option>
                            <option>Serum</option>
                            <option>Plasma</option>
                            <option>Urine</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Standard TAT</label>
                        <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-inner">
                          <div className="pl-4 pr-1 flex items-center pointer-events-none">
                            <Clock className="h-4 w-4 text-slate-400" />
                          </div>
                          <input type="text" className="w-full py-3 pr-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none" placeholder="e.g. 4 Hours" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Billing Amount (₹)</label>
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
            <div className="p-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md flex justify-between items-center gap-3 shrink-0 sticky bottom-0 z-20">
              
              {/* Status Toggle in Footer */}
              <div className="flex items-center gap-2 pl-2">
                <div className="w-8 h-4 bg-teal-500 rounded-full relative cursor-pointer shadow-inner">
                  <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Active</span>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors outline-none"
                >
                  Cancel
                </button>
                <button 
                  className="px-8 py-3 text-sm font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 outline-none"
                >
                  <CheckCircle2 size={18} strokeWidth={2.5} /> Save Record
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}