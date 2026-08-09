"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { 
  Search, Plus, MoreHorizontal, FileEdit, Copy, Trash2, 
  X, FlaskConical, Microscope, Droplets, Dna, 
  TestTubes, ShieldCheck, Clock, Settings2,
  Globe, FileSignature, CheckCircle2, Zap, Info, Coffee, PowerOff, Loader2, AlertCircle
} from "lucide-react";

// ⚠️ ZUSTAND STORE INTEGRATION (Using your exact store)
import { useAuthStore } from "@/store/useAuthStore";

// ==========================================
// API CONFIGURATION
// ==========================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ==========================================
// TYPES (Aligned with FastAPI Schemas)
// ==========================================
type Department = 
  | "Hematology" | "Clinical Biochemistry" | "Endocrinology" 
  | "Immunology & Serology" | "Clinical Pathology" | "Microbiology" 
  | "Histopathology & Cytology" | "Tumor Markers";

type SampleType = 
  | "Whole Blood (EDTA)" | "Serum (SST)" | "Plasma (Fluoride)" | "Plasma (Citrate)" 
  | "Urine (Mid-stream)" | "Urine (24 Hrs)" | "Stool" | "Sputum" | "Semen"
  | "Tissue/Swab" | "Body Fluid" | "CSF";

interface LabTest {
  pdf_result_fields: never[];
  id: string; // UUID string
  master_test_id?: string | null;
  loinc_code?: string | null;
  code: string;
  name: string;
  department: Department;
  sample_type: SampleType;
  price: number;
  tat: string;
  guidelines: string;
  is_active: boolean;
}

interface MasterCatalogTest {
  id?: string; // UUID from backend (None if from NIH API)
  loinc: string;
  officialName: string;
  shortCode: string;
  department: Department;
  sampleType: SampleType;
  defaultTat: string;
  defaultPrice: number;
  pdfResultFields: string[];
  clinicalGuidelines: string;
  source: "Curated" | "NIH-API";
}

// Helper to clean complex NIH LOINC names
const cleanLoincNameForIndianLab = (rawName: string) => {
  return rawName
    .replace(/\[Presence\]/gi, "")
    .replace(/\[Mass\/volume\]/gi, "")
    .replace(/\[Number\/volume\]/gi, "")
    .replace(/in Blood by Rapid immunoassay/gi, "(Rapid Card)")
    .replace(/in Serum or Plasma/gi, "")
    .replace(/in Blood/gi, "")
    .replace(/\s+/g, " ").trim();
};

export function TestDictionaryTab() {
  // ==========================================
  // AUTH & BRANDING STATE
  // ==========================================
  const { token, activeLab, user } = useAuthStore();
  const labName = activeLab || "Apex Diagnostics";
  const labThemeColor = user?.theme_preference || "#0d9488"; // Fallback to Teal-600
  const labLogoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(labName)}&background=${labThemeColor.replace('#', '')}&color=fff&rounded=true&bold=true`;

  // ==========================================
  // COMPONENT STATE
  // ==========================================
  const [localTests, setLocalTests] = useState<LabTest[]>([]);
  const [isFetchingLocal, setIsFetchingLocal] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState<Department | "All">("All");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [selectedGlobalTest, setSelectedGlobalTest] = useState<MasterCatalogTest | null>(null);
  const [useOnlineSearch, setUseOnlineSearch] = useState(false);

  const [formIsActive, setFormIsActive] = useState(true);
  const [localTestCode, setLocalTestCode] = useState("");
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editTat, setEditTat] = useState<string>("");
  const [editGuidelines, setEditGuidelines] = useState<string>("");

  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [apiResults, setApiResults] = useState<MasterCatalogTest[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Headers for secure API requests
  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  }), [token]);

  // ==========================================
  // FETCH LOCAL LAB TESTS (FastAPI GET)
  // ==========================================
  const fetchLocalTests = useCallback(async () => {
    if (!token) return;
    try {
      setIsFetchingLocal(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/tests`, { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to load active tests");
      const data = await res.json();
      setLocalTests(data);
      setLocalError(null);
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsFetchingLocal(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    fetchLocalTests();
  }, [fetchLocalTests]);

  // ==========================================
  // REAL-TIME SEARCH (Backend DB vs NIH API)
  // ==========================================
  useEffect(() => {
    let active = true;
    if (globalSearchQuery.trim().length < 2) {
      setApiResults([]);
      setIsSearchingApi(false);
      return;
    }

    const fetchData = async () => {
      setIsSearchingApi(true);
      try {
        if (!useOnlineSearch) {
          // SEARCH 1: Securely hit your FastAPI Master Catalog
          const res = await fetch(`${API_BASE_URL}/api/v1/tests/master-catalog?search=${encodeURIComponent(globalSearchQuery)}`, { headers: authHeaders });
          if (!res.ok) throw new Error("Catalog fetch failed");
          const data = await res.json();
          
          if (active) {
            const formatted: MasterCatalogTest[] = data.map((item: any) => ({
              id: item.id, // UUID from your database
              loinc: item.loinc_code || "N/A",
              officialName: item.official_name,
              shortCode: item.official_name.split(" ")[0].substring(0, 6).toUpperCase(),
              department: item.department,
              sampleType: item.sample_type,
              defaultTat: item.default_tat,
              defaultPrice: item.default_price,
              pdfResultFields: item.pdf_result_fields || [],
              clinicalGuidelines: item.clinical_guidelines || "No special preparation required.",
              source: "Curated"
            }));
            setApiResults(formatted);
          }

        } else {
          // SEARCH 2: Hit US NIH Global LOINC API (Fallback)
          const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?terms=${encodeURIComponent(globalSearchQuery)}&maxList=15&df=LOINC_NUM,LONG_COMMON_NAME,SYSTEM,COMPONENT`);
          const data = await res.json();
          
          if (active && data[3]) {
            const formatted: MasterCatalogTest[] = data[3].map((row: string[]) => {
               const loinc = row[0];
               const rawName = row[1];
               const system = row[2]?.toLowerCase() || "";
               
               let sample: SampleType = "Serum (SST)";
               if (system.includes("bld") || system.includes("blood")) sample = "Whole Blood (EDTA)";
               else if (system.includes("ur")) sample = "Urine (Mid-stream)";
               else if (system.includes("tiss")) sample = "Tissue/Swab";
               
               let dept: Department = "Clinical Biochemistry";
               if (system.includes("ur")) dept = "Clinical Pathology";
               else if (rawName.toLowerCase().includes("antibody") || rawName.toLowerCase().includes("antigen")) dept = "Immunology & Serology";
               else if (rawName.toLowerCase().includes("culture")) dept = "Microbiology";
               
               const cleanName = cleanLoincNameForIndianLab(rawName);

               return {
                  loinc,
                  officialName: cleanName,
                  shortCode: cleanName.split(" ")[0].substring(0, 6).toUpperCase(),
                  department: dept,
                  sampleType: sample,
                  defaultTat: "24 Hours",
                  defaultPrice: 500,
                  pdfResultFields: [cleanName],
                  clinicalGuidelines: "Follow standard clinical laboratory protocols.",
                  source: "NIH-API"
               };
            });
            setApiResults(formatted);
          }
        }
      } catch (err) {
        console.error("Search Error:", err);
      } finally {
        if (active) setIsSearchingApi(false);
      }
    };

    const timer = setTimeout(fetchData, 400); // Debounce API calls
    return () => { active = false; clearTimeout(timer); };
  }, [globalSearchQuery, useOnlineSearch, authHeaders]);


  // ==========================================
  // UI HANDLERS & EVENT LISTENERS
  // ==========================================
  useEffect(() => {
    if (isDrawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isDrawerOpen]);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdownId]);

  useEffect(() => {
    if (!isDrawerOpen) {
      setTimeout(() => {
        setSelectedGlobalTest(null);
        setGlobalSearchQuery("");
        setLocalTestCode("");
        setApiResults([]);
        setUseOnlineSearch(false);
      }, 300);
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    if (selectedGlobalTest) {
      setLocalTestCode(selectedGlobalTest.shortCode);
      setEditPrice(selectedGlobalTest.defaultPrice);
      setEditTat(selectedGlobalTest.defaultTat);
      setEditGuidelines(selectedGlobalTest.clinicalGuidelines);
      setFormIsActive(true);
    }
  }, [selectedGlobalTest]);

  // ==========================================
  // SECURE CRUD OPERATIONS
  // ==========================================
  const handleSaveToDictionary = async () => {
    if (!selectedGlobalTest || !localTestCode) return;
    
    setIsSaving(true);
    try {
      // Create Payload matching FastAPI LabTestCreate Schema
      const payload = {
        master_test_id: selectedGlobalTest.id || null, // None if from NIH API
        code: localTestCode,
        name: selectedGlobalTest.officialName,
        department: selectedGlobalTest.department,
        sample_type: selectedGlobalTest.sampleType,
        price: editPrice,
        tat: editTat,
        guidelines: editGuidelines,
        is_active: formIsActive
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/tests`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to create test");
      }

      const createdTest = await res.json();
      setLocalTests(prev => [createdTest, ...prev]);
      setIsDrawerOpen(false);
    } catch (err: any) {
      alert(err.message); // In production, replace with a Toast notification
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTestStatus = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic Update
      setLocalTests(prev => prev.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t));
      setOpenDropdownId(null);

      // Backend Update
      await fetch(`${API_BASE_URL}/api/v1/tests/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ is_active: !currentStatus })
      });
    } catch (err) {
      // Revert on failure
      fetchLocalTests();
    }
  };

  const duplicateTest = async (test: LabTest) => {
    try {
      const payload = {
        master_test_id: test.master_test_id,
        code: `${test.code}-COPY`,
        name: `${test.name} (Copy)`,
        department: test.department,
        sample_type: test.sample_type,
        price: test.price,
        tat: test.tat,
        guidelines: test.guidelines,
        is_active: test.is_active
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/tests`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to duplicate");
      const duplicated = await res.json();
      setLocalTests(prev => [duplicated, ...prev]);
      setOpenDropdownId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Soft-Delete Implementation to comply with medical records retention laws
  const deleteTest = async (id: string) => {
    if(!window.confirm("Are you sure you want to deactivate this test code?")) return;
    try {
      // We use PUT to soft-delete (is_active = false) because billing codes shouldn't be hard deleted.
      const res = await fetch(`${API_BASE_URL}/api/v1/tests/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ is_active: false })
      });
      if (!res.ok) throw new Error("Failed to delete");
      
      setLocalTests(prev => prev.filter(t => t.id !== id));
      setOpenDropdownId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // DYNAMIC FILTERS
  // ==========================================
  const activeDepartments = useMemo(() => {
    const depts = new Set(localTests.map(test => test.department));
    return ["All", ...Array.from(depts)] as ("All" | Department)[];
  }, [localTests]);

  const filteredTests = useMemo(() => {
    return localTests.filter(test => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        test.name.toLowerCase().includes(query) ||
        test.code.toLowerCase().includes(query) ||
        (test.loinc_code && test.loinc_code.toLowerCase().includes(query));
      const matchesDept = deptFilter === "All" || test.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [localTests, searchQuery, deptFilter]);

  const getDeptIcon = (dept: Department) => {
    if (dept.includes("Hematology") || dept.includes("Pathology")) return <Droplets size={14} className="text-rose-500" />;
    if (dept.includes("Biochemistry") || dept.includes("Tumor")) return <FlaskConical size={14} className="text-amber-500" />;
    if (dept.includes("Endocrinology") || dept.includes("Immunology")) return <Dna size={14} className="text-indigo-500" />;
    if (dept.includes("Microbiology") || dept.includes("Histopathology")) return <Microscope size={14} className="text-emerald-500" />;
    return <TestTubes size={14} className="text-cyan-500" />;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full max-w-full animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Diagnostic Dictionary</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your master catalogue of parameters, pricing, and clinical guidelines.
          </p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95 outline-none whitespace-nowrap"
        >
          <Plus size={16} strokeWidth={2.5} /> Add Parameter
        </button>
      </div>

      {/* COMMAND BAR */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full shrink-0 mb-4">
        <div className="relative w-full lg:w-[320px] shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
            placeholder="Search local directory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex w-full lg:w-auto overflow-x-auto no-scrollbar gap-1">
          {activeDepartments.map((dept) => {
            const isActive = deptFilter === dept;
            return (
              <button
                key={dept}
                onClick={() => setDeptFilter(dept as any)}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap outline-none ${
                  isActive ? "bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {dept === "All" && <Settings2 size={14} className="mr-1.5" />}
                {dept === "All" ? "All Active Departments" : dept.replace("Clinical ", "").replace(" & Cytology", "").replace(" & Serology", "")}
              </button>
            );
          })}
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full relative z-10 flex-1 min-h-0 overflow-y-auto">
        
        {isFetchingLocal ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 size={24} className="animate-spin mb-2" />
            <p className="text-sm font-medium">Loading Lab Dictionary...</p>
          </div>
        ) : localError ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <AlertCircle size={24} className="mb-2" />
            <p className="text-sm font-medium">Failed to connect to database</p>
          </div>
        ) : (
          <table className="w-full text-left table-fixed">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-20 border-b border-slate-200">
              <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-[60%] sm:w-[40%] md:w-[35%]">Parameter & Details</th>
                <th className="py-3 px-4 hidden md:table-cell w-[25%]">Department & Tube</th>
                <th className="py-3 px-4 hidden sm:table-cell w-[20%]">Price & TAT</th>
                <th className="py-3 px-4 hidden lg:table-cell w-[10%]">Status</th>
                <th className="py-3 px-4 text-right w-[40%] sm:w-[20%] lg:w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTests.map((test, index) => {
                const requiresFasting = test.guidelines?.toLowerCase().includes("fasting") || false;
                const isBottomRow = index > 0 && index >= filteredTests.length - 2;
                const isDropdownOpen = openDropdownId === test.id;
                
                return (
                  <tr key={test.id} className="hover:bg-slate-50/60 transition-colors group bg-white">
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-8 h-8 rounded-md border hidden sm:flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          test.is_active ? 'bg-teal-50 border-teal-100 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          {test.code.substring(0, 2)}
                        </div>
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-semibold truncate ${test.is_active ? 'text-slate-900' : 'text-slate-500'}`}>
                              {test.name}
                            </span>
                            {test.loinc_code && (
                              <span className="inline-flex items-center gap-1 rounded bg-teal-50/50 px-1.5 py-0.5 text-[9px] font-bold text-teal-700 ring-1 ring-inset ring-teal-600/20 shrink-0">
                                <ShieldCheck size={10} /> ABDM
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs font-mono font-medium text-slate-500">{test.code}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="text-[10px] text-slate-400 font-mono truncate">{test.id}</span>
                          </div>

                          <div className="flex sm:hidden items-center gap-2 mt-2 text-[11px] flex-wrap">
                            <span className="font-bold text-slate-900">₹{test.price}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">{test.tat}</span>
                            <span className="text-slate-300">•</span>
                            <span className={`${test.is_active ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>{test.is_active ? 'Active' : 'Inactive'}</span>
                          </div>

                          <div className="flex md:hidden items-center gap-2 mt-1.5 text-[11px] flex-wrap">
                            <span className="text-slate-600 truncate">{test.department}</span>
                            {requiresFasting && <span className="text-amber-600 font-bold shrink-0"> • Fasting</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 hidden md:table-cell align-top">
                      <div className="flex flex-col gap-1.5 items-start">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700 truncate" title={test.department}>
                            {getDeptIcon(test.department)} {test.department}
                          </span>
                          {requiresFasting && (
                            <span className="flex items-center gap-1 text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded ring-1 ring-inset ring-amber-600/20 whitespace-nowrap">
                              <Coffee size={10} /> Fasting
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 ml-5 truncate" title={test.sample_type}>Tube: <span className="font-semibold text-slate-600">{test.sample_type}</span></span>
                      </div>
                    </td>

                    <td className="py-4 px-4 hidden sm:table-cell align-top">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-sm font-semibold font-mono text-slate-900">₹{test.price.toLocaleString('en-IN')}</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <Clock size={12} className="text-slate-400" /> TAT: {test.tat}
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 hidden lg:table-cell align-top">
                      <button 
                        onClick={() => toggleTestStatus(test.id, test.is_active)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset outline-none transition-all active:scale-95 ${
                          test.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 hover:bg-emerald-100' : 'bg-slate-50 text-slate-600 ring-slate-500/20 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${test.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {test.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    
                    <td className={`py-4 px-4 text-right relative align-top ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => {
                            // Populate drawer form from local test properties
                            setSelectedGlobalTest({
                              id: test.master_test_id || undefined,
                              loinc: test.loinc_code || "",
                              officialName: test.name,
                              shortCode: test.code,
                              department: test.department,
                              sampleType: test.sample_type,
                              defaultPrice: test.price,
                              defaultTat: test.tat,
                              clinicalGuidelines: test.guidelines || "",
                              pdfResultFields: test.pdf_result_fields || [],
                              source: test.master_test_id ? "Curated" : "NIH-API"
                            });
                            setLocalTestCode(test.code);
                            setFormIsActive(test.is_active);
                            setIsDrawerOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors outline-none sm:opacity-0 sm:group-hover:opacity-100" 
                          title="Edit Parameter"
                        >
                          <FileEdit size={16} />
                        </button>
                        
                        <div className="relative">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenDropdownId(isDropdownOpen ? null : test.id); 
                            }} 
                            className={`p-1.5 rounded-md transition-colors outline-none ${isDropdownOpen ? 'text-slate-800 bg-slate-100' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          
                          {isDropdownOpen && (
                            <div 
                              className={`absolute right-0 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 ${
                                isBottomRow ? "bottom-full mb-2 origin-bottom-right" : "top-full mt-2 origin-top-right"
                              }`}
                              onClick={(e) => e.stopPropagation()} 
                            >
                              <button onClick={() => toggleTestStatus(test.id, test.is_active)} className="w-full lg:hidden text-left px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2 outline-none transition-colors">
                                <PowerOff size={14} className="text-amber-500"/> {test.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button onClick={() => duplicateTest(test)} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 outline-none transition-colors">
                                <Copy size={14} className="text-slate-400"/> Duplicate
                              </button>
                              <div className="h-px bg-slate-100 my-1 mx-2" />
                              <button onClick={() => deleteTest(test.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 outline-none transition-colors">
                                <Trash2 size={14} className="text-red-500"/> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. SMART CONFIGURATION DRAWER                             */}
      {/* ========================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="relative w-full md:w-[600px] h-full bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-10 border-l border-slate-200">
            
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">Add Test Parameter</h2>
                <p className="text-xs text-slate-500 mt-0.5">Auto-configure using Global & ABDM guidelines</p>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md outline-none transition-colors"><X size={18} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
              
              {!selectedGlobalTest ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      autoFocus
                      className="w-full pl-10 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm transition-all"
                      placeholder={useOnlineSearch ? "Search global LOINC database..." : "Search Indian test catalog (e.g. CBC, Dengue)..."}
                      value={globalSearchQuery}
                      onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    />
                    {isSearchingApi && (
                      <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-600 animate-spin" />
                    )}
                  </div>

                  {/* 🔥 TOGGLE FOR GLOBAL API SEARCH */}
                  <div className="flex items-start gap-2 mt-2 px-1">
                    <input 
                      type="checkbox" 
                      id="onlineSearchToggle" 
                      checked={useOnlineSearch}
                      onChange={(e) => setUseOnlineSearch(e.target.checked)}
                      className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-600 cursor-pointer"
                    />
                    <label htmlFor="onlineSearchToggle" className="text-[11px] text-slate-600 cursor-pointer select-none">
                      <span className="font-semibold text-slate-800">Search Official Global Database (NIH API)</span>
                      <span className="block text-slate-500 leading-tight mt-0.5">Check this only if you cannot find the test in the pre-verified Indian master catalog.</span>
                    </label>
                  </div>

                  {!globalSearchQuery ? (
                    <div className="space-y-3 mt-6">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Zap size={14} className="text-amber-500"/> Popular Recommendations</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Empty state shortcut, fetches random suggestions later */}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col mt-4">
                      {apiResults.length > 0 ? (
                        apiResults.map((test, i) => (
                          <button 
                            key={`${test.loinc}-${i}`}
                            onClick={() => setSelectedGlobalTest(test)}
                            className="flex flex-col text-left px-4 py-3 hover:bg-teal-50/50 border-b border-slate-100 last:border-0 outline-none transition-colors group"
                          >
                            <div className="flex justify-between items-start w-full gap-2">
                              <span className="text-sm font-bold text-slate-900 leading-tight group-hover:text-teal-600 transition-colors">{test.officialName}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                {test.source === "NIH-API" && <Globe size={12} className="text-indigo-500" aria-label="Fetched from Global LOINC Registry" />}
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${test.source === "NIH-API" ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>LOINC: {test.loinc}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1.5">{getDeptIcon(test.department)} {test.department}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="truncate">{test.sampleType}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-sm text-slate-500">
                          {isSearchingApi 
                            ? "Searching..." 
                            : useOnlineSearch 
                              ? "No matching tests found globally." 
                              : "Not found in curated catalog. Try enabling 'Search Official Global Database'."}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <ShieldCheck size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {selectedGlobalTest.source === "NIH-API" ? "Official LOINC Template Loaded" : "Master Template Loaded"}
                      </span>
                    </div>
                    <button onClick={() => setSelectedGlobalTest(null)} className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline underline-offset-2 outline-none">
                      Change Template
                    </button>
                  </div>

                  <div className="bg-slate-200/50 p-4 rounded-xl border border-slate-200/80 shadow-inner overflow-hidden hidden sm:block">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                        <FileSignature size={14}/> Result Report Preview
                      </h4>
                    </div>
                    
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 font-sans mx-auto max-w-[500px]">
                      {selectedGlobalTest.clinicalGuidelines && selectedGlobalTest.clinicalGuidelines.length > 5 && (
                        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-100/80 rounded-md text-[10px] text-amber-900 flex items-start gap-2">
                          <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
                          <div>
                            <strong className="font-bold block text-amber-800 mb-0.5">Pre-analytical Guidelines (Patient Prep):</strong>
                            {selectedGlobalTest.clinicalGuidelines}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                        <img src={labLogoUrl} alt="Lab Logo" className="w-8 h-8 rounded-md shadow-sm border border-slate-100" />
                        <div>
                          <h5 className="text-xs font-black text-slate-900 tracking-wide uppercase">{labName}</h5>
                          <p className="text-[9px] text-slate-400">ABDM Compliant • LOINC: {selectedGlobalTest.loinc}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h6 className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: labThemeColor }}>
                          Investigation Panel
                        </h6>
                        <p className="text-sm font-black text-slate-900 leading-tight">{selectedGlobalTest.officialName}</p>
                      </div>

                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b-2 border-slate-800 text-slate-500">
                            <th className="pb-1.5 font-bold w-[45%]">Analyte / Parameter</th>
                            <th className="pb-1.5 font-bold w-[20%]">Result</th>
                            <th className="pb-1.5 font-bold w-[15%]">Unit</th>
                            <th className="pb-1.5 font-bold text-right w-[20%]">Ref. Interval</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedGlobalTest.pdfResultFields.map((field, i) => (
                            <tr key={i} className="border-b border-slate-100 last:border-0 group">
                              <td className="py-2 text-slate-800 font-semibold truncate pr-2" title={field}>{field}</td>
                              <td className="py-2"><div className="w-8 h-3 bg-slate-100 rounded animate-pulse"></div></td>
                              <td className="py-2 text-slate-400 text-[9px]">—</td>
                              <td className="py-2 text-right text-slate-400 text-[9px]">—</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                        <span>Tube: <span className="font-bold text-slate-500">{selectedGlobalTest.sampleType}</span></span>
                        <span>Dept: <span className="font-bold text-slate-500">{selectedGlobalTest.department}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 mb-2 border-b border-slate-100 pb-3">
                      <Settings2 size={16} className="text-teal-600" />
                      <span className="text-xs font-bold uppercase tracking-widest">Finalize Local Setup</span>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Local Display Name</label>
                      <input type="text" defaultValue={selectedGlobalTest.officialName} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Local Test Code <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          value={localTestCode}
                          onChange={(e) => setLocalTestCode(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all" 
                          placeholder="e.g. LFT" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Billing Rate (₹) <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">₹</div>
                          <input 
                            type="number" 
                            value={editPrice || ""}
                            onChange={(e) => setEditPrice(Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between">
                        <span>Patient Prep Guidelines</span>
                        <span className="text-[10px] font-normal text-slate-400">Visible to Front Desk</span>
                      </label>
                      <textarea 
                        value={editGuidelines}
                        onChange={(e) => setEditGuidelines(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedGlobalTest && (
              <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0 animate-in fade-in duration-300">
                <button type="button" onClick={() => setFormIsActive(!formIsActive)} className="flex items-center gap-2 outline-none">
                  <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${formIsActive ? 'bg-teal-500' : 'bg-slate-300'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${formIsActive ? 'left-[18px]' : 'left-0.5'}`}></div>
                  </div>
                  <span className={`text-xs font-semibold ${formIsActive ? 'text-slate-700' : 'text-slate-400'}`}>
                    {formIsActive ? 'Active Test' : 'Inactive'}
                  </span>
                </button>

                <div className="flex gap-2">
                  <button onClick={() => setIsDrawerOpen(false)} className="px-4 sm:px-5 py-2.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors outline-none">
                    Cancel
                  </button>
                  <button onClick={handleSaveToDictionary} disabled={isSaving} className="px-4 sm:px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all active:scale-95 outline-none flex items-center gap-2 disabled:opacity-50">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} strokeWidth={2.5}/>}
                    Save Parameter
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// "use client";

// import { useState, useMemo, useEffect } from "react";
// import { 
//   Search, Plus, MoreHorizontal, FileEdit, Copy, Trash2, 
//   X, FlaskConical, Microscope, Droplets, Dna, 
//   TestTubes, ShieldCheck, Clock, Settings2,
//   Globe, FileSignature, CheckCircle2, Zap, Info, Coffee, PowerOff, Loader2
// } from "lucide-react";

// // ⚠️ ADJUST THIS IMPORT TO POINT TO YOUR ZUSTAND STORE
// import { useAuthStore } from "@/store/useAuthStore";

// // ==========================================
// // TYPES & CLINICAL DOMAINS
// // ==========================================
// type Department = 
//   | "Hematology" 
//   | "Clinical Biochemistry" 
//   | "Endocrinology" 
//   | "Immunology & Serology" 
//   | "Clinical Pathology" 
//   | "Microbiology" 
//   | "Histopathology & Cytology" 
//   | "Tumor Markers";

// type SampleType = 
//   | "Whole Blood (EDTA)" | "Serum (SST)" | "Plasma (Fluoride)" | "Plasma (Citrate)" 
//   | "Urine (Mid-stream)" | "Urine (24 Hrs)" | "Stool" | "Sputum" | "Semen"
//   | "Tissue/Swab" | "Body Fluid" | "CSF" | "Other";

// interface LabTest {
//   id: string;
//   code: string;
//   loincCode?: string;
//   name: string;
//   department: Department;
//   sampleType: SampleType;
//   price: number;
//   tat: string;
//   guidelines: string;
//   isActive: boolean;
// }

// interface MasterCatalogTest {
//   loinc: string;
//   officialName: string;
//   shortCode: string;
//   department: Department;
//   sampleType: SampleType;
//   defaultTat: string;
//   defaultPrice: number;
//   pdfResultFields: string[];
//   clinicalGuidelines: string;
//   aliases: string[]; // For Indian search alias matching (e.g. maleria, mp, fever)
//   source: "Curated" | "NIH-API";
// }

// // ==========================================
// // INITIAL LOCAL LAB DATABASE
// // ==========================================
// const initialLocalTests: LabTest[] = [
//   { id: "DICT-101", code: "CBC", loincCode: "58410-2", name: "Complete Blood Count (CBC)", department: "Hematology", sampleType: "Whole Blood (EDTA)", price: 450, tat: "4 Hours", guidelines: "No special preparation required.", isActive: true },
//   { id: "DICT-102", code: "MAL-AG", loincCode: "22091-3", name: "Malaria Antigen (Pf/Pv Rapid Card)", department: "Immunology & Serology", sampleType: "Whole Blood (EDTA)", price: 400, tat: "2 Hours", guidelines: "Preferably draw blood during fever spikes.", isActive: true },
//   { id: "DICT-103", code: "FBS", loincCode: "1558-6", name: "Fasting Blood Sugar (FBS)", department: "Clinical Biochemistry", sampleType: "Plasma (Fluoride)", price: 150, tat: "2 Hours", guidelines: "Strict 10-12 hours overnight fasting mandatory.", isActive: true },
// ];

// // ==========================================
// // CURATED MASTER CATALOG (With Indian Aliases)
// // ==========================================
// const indianMasterCatalog: MasterCatalogTest[] = [
//   // Malaria Tests
//   { loinc: "22091-3", officialName: "Malaria Antigen (Pf/Pv Rapid Card)", shortCode: "MAL-AG", department: "Immunology & Serology", sampleType: "Whole Blood (EDTA)", defaultTat: "2 Hours", defaultPrice: 400, pdfResultFields: ["Plasmodium falciparum (Pf) Ag", "Plasmodium vivax (Pv) Ag", "Result Impression"], clinicalGuidelines: "Collect sample during fever spike if possible. No fasting required.", aliases: ["maleria", "malaria", "mp card", "pf/pv", "fever", "plasmodium"], source: "Curated" },
//   { loinc: "14196-0", officialName: "Malaria Parasite Smear (MP / Thick & Thin)", shortCode: "MP-SMEAR", department: "Hematology", sampleType: "Whole Blood (EDTA)", defaultTat: "4 Hours", defaultPrice: 250, pdfResultFields: ["Thick Film Examination", "Thin Film Examination", "Parasite Density (/µL)"], clinicalGuidelines: "Preferably draw blood during fever spikes.", aliases: ["maleria", "malaria", "mp smear", "parasite", "fever"], source: "Curated" },

//   // Hematology
//   { loinc: "58410-2", officialName: "Complete Blood Count (CBC)", shortCode: "CBC", department: "Hematology", sampleType: "Whole Blood (EDTA)", defaultTat: "4 Hours", defaultPrice: 400, pdfResultFields: ["Hemoglobin (Hb)", "Total RBC", "Total WBC / TLC", "Neutrophils", "Lymphocytes", "Eosinophils", "Monocytes", "Basophils", "Platelet Count", "PCV / Hematocrit", "MCV", "MCH", "MCHC"], clinicalGuidelines: "No fasting required.", aliases: ["cbc", "hemoglobin", "hb", "platelet", "tlc", "dlc", "blood count"], source: "Curated" },
//   { loinc: "4544-3", officialName: "Erythrocyte Sedimentation Rate (ESR)", shortCode: "ESR", department: "Hematology", sampleType: "Whole Blood (EDTA)", defaultTat: "2 Hours", defaultPrice: 150, pdfResultFields: ["ESR (Westergren Method)"], clinicalGuidelines: "No fasting required.", aliases: ["esr", "swelling", "inflammation"], source: "Curated" },
  
//   // Clinical Biochemistry
//   { loinc: "24325-3", officialName: "Liver Function Test (LFT)", shortCode: "LFT", department: "Clinical Biochemistry", sampleType: "Serum (SST)", defaultTat: "6 Hours", defaultPrice: 800, pdfResultFields: ["Bilirubin Total", "Bilirubin Direct", "SGOT / AST", "SGPT / ALT", "Alkaline Phosphatase (ALP)", "Total Protein", "Serum Albumin"], clinicalGuidelines: "Overnight fasting preferred but not mandatory.", aliases: ["lft", "liver", "jaundice", "sgpt", "sgot", "bilirubin"], source: "Curated" },
//   { loinc: "24326-1", officialName: "Kidney Function Test (KFT/RFT)", shortCode: "KFT", department: "Clinical Biochemistry", sampleType: "Serum (SST)", defaultTat: "6 Hours", defaultPrice: 750, pdfResultFields: ["Blood Urea Nitrogen (BUN)", "Serum Creatinine", "Serum Uric Acid", "Serum Calcium", "Serum Sodium", "Serum Potassium"], clinicalGuidelines: "No special preparation required.", aliases: ["kft", "rft", "kidney", "creatinine", "urea", "uric acid"], source: "Curated" },
//   { loinc: "24331-1", officialName: "Lipid Profile", shortCode: "LIPID", department: "Clinical Biochemistry", sampleType: "Serum (SST)", defaultTat: "6 Hours", defaultPrice: 850, pdfResultFields: ["Total Cholesterol", "Triglycerides", "HDL Cholesterol", "LDL Cholesterol", "VLDL Cholesterol"], clinicalGuidelines: "10-12 hours strict overnight fasting required.", aliases: ["lipid", "cholesterol", "heart", "triglycerides"], source: "Curated" },
//   { loinc: "1558-6", officialName: "Fasting Blood Sugar (FBS)", shortCode: "FBS", department: "Clinical Biochemistry", sampleType: "Plasma (Fluoride)", defaultTat: "2 Hours", defaultPrice: 150, pdfResultFields: ["Fasting Blood Sugar (mg/dL)"], clinicalGuidelines: "Strict 10-12 hours overnight fasting mandatory.", aliases: ["sugar", "fbs", "fasting", "diabetes", "glucose"], source: "Curated" },
//   { loinc: "1521-4", officialName: "Post-Prandial Blood Sugar (PPBS)", shortCode: "PPBS", department: "Clinical Biochemistry", sampleType: "Plasma (Fluoride)", defaultTat: "2 Hours", defaultPrice: 150, pdfResultFields: ["Post-Prandial Blood Sugar (mg/dL)"], clinicalGuidelines: "Sample must be drawn exactly 2 hours after a meal.", aliases: ["pp", "ppbs", "sugar", "post prandial"], source: "Curated" },
//   { loinc: "4548-4", officialName: "HbA1c (Glycosylated Hemoglobin)", shortCode: "HBA1C", department: "Clinical Biochemistry", sampleType: "Whole Blood (EDTA)", defaultTat: "4 Hours", defaultPrice: 550, pdfResultFields: ["HbA1c (%)", "Estimated Average Glucose (eAG)"], clinicalGuidelines: "No fasting required.", aliases: ["hba1c", "3 month sugar", "diabetes"], source: "Curated" },

//   // Serology & Infectious
//   { loinc: "5874-1", officialName: "Widal Test (Typhoid Agglutination)", shortCode: "WIDAL", department: "Immunology & Serology", sampleType: "Serum (SST)", defaultTat: "4 Hours", defaultPrice: 350, pdfResultFields: ["S. Typhi 'O' Antigen", "S. Typhi 'H' Antigen", "S. Paratyphi 'AH'", "S. Paratyphi 'BH'"], clinicalGuidelines: "No fasting required.", aliases: ["widal", "typhoid", "fever", "enteric fever"], source: "Curated" },
//   { loinc: "46222-6", officialName: "Dengue NS1 Antigen (Rapid)", shortCode: "DEN-NS1", department: "Immunology & Serology", sampleType: "Serum (SST)", defaultTat: "4 Hours", defaultPrice: 700, pdfResultFields: ["Dengue NS1 Ag Result"], clinicalGuidelines: "No fasting required.", aliases: ["dengu", "dengue", "ns1", "fever", "platelets drop"], source: "Curated" },
//   { loinc: "56501-0", officialName: "Dengue IgG & IgM Antibodies", shortCode: "DEN-AB", department: "Immunology & Serology", sampleType: "Serum (SST)", defaultTat: "4 Hours", defaultPrice: 850, pdfResultFields: ["Dengue IgM Result", "Dengue IgG Result"], clinicalGuidelines: "No fasting required.", aliases: ["dengu", "dengue", "igm", "igg"], source: "Curated" },

//   // Endocrinology
//   { loinc: "80356-9", officialName: "Thyroid Profile (T3, T4, TSH)", shortCode: "THY", department: "Endocrinology", sampleType: "Serum (SST)", defaultTat: "12 Hours", defaultPrice: 1100, pdfResultFields: ["Total T3", "Total T4", "TSH (Ultrasensitive)"], clinicalGuidelines: "Morning sample preferred.", aliases: ["thyroid", "t3", "t4", "tsh", "tft"], source: "Curated" },
//   { loinc: "14631-6", officialName: "Vitamin D3 (25-OH)", shortCode: "VIT-D3", department: "Endocrinology", sampleType: "Serum (SST)", defaultTat: "24 Hours", defaultPrice: 1500, pdfResultFields: ["Vitamin D3 Level (ng/mL)"], clinicalGuidelines: "No fasting required.", aliases: ["vit d", "vitamin d3", "bone"], source: "Curated" },
//   { loinc: "2132-9", officialName: "Vitamin B12", shortCode: "VIT-B12", department: "Endocrinology", sampleType: "Serum (SST)", defaultTat: "24 Hours", defaultPrice: 1000, pdfResultFields: ["Vitamin B12 Level (pg/mL)"], clinicalGuidelines: "Fasting preferred.", aliases: ["vit b12", "b12", "nerves"], source: "Curated" },

//   // Clinical Pathology & Microbiology
//   { loinc: "24356-8", officialName: "Urine Routine & Microscopy", shortCode: "UR-RM", department: "Clinical Pathology", sampleType: "Urine (Mid-stream)", defaultTat: "2 Hours", defaultPrice: 250, pdfResultFields: ["Color & Appearance", "Specific Gravity", "Protein", "Glucose", "Pus Cells", "RBCs"], clinicalGuidelines: "Early morning mid-stream clean catch sample.", aliases: ["urine", "urin", "routine", "pus cells"], source: "Curated" },
//   { loinc: "600-7", officialName: "Blood Culture & Sensitivity", shortCode: "BLD-CS", department: "Microbiology", sampleType: "Whole Blood (EDTA)", defaultTat: "72 Hours", defaultPrice: 1200, pdfResultFields: ["Specimen Type", "Organism Isolated", "Antibiotic Sensitivity Panel"], clinicalGuidelines: "Sample must be drawn before antibiotics.", aliases: ["culture", "blood culture", "sensitivity"], source: "Curated" }
// ];

// // Helper to normalize Indian misspellings & common aliases
// const normalizeIndianQuery = (term: string) => {
//   let q = term.toLowerCase().trim();
//   if (q.includes("maleria") || q.includes("malaria") || q.includes("mp card") || q.includes("pf/pv")) return "malaria";
//   if (q.includes("dengu")) return "dengue";
//   if (q.includes("sugar") || q.includes("diabet")) return "sugar";
//   if (q.includes("jaundice")) return "liver";
//   if (q.includes("kidny") || q.includes("kft")) return "kidney";
//   if (q.includes("typhoid")) return "widal";
//   return q;
// };

// // Helper to clean complex NIH LOINC names into user-friendly pathology titles
// const cleanLoincNameForIndianLab = (rawName: string) => {
//   let clean = rawName
//     .replace(/\[Presence\]/gi, "")
//     .replace(/\[Mass\/volume\]/gi, "")
//     .replace(/\[Number\/volume\]/gi, "")
//     .replace(/in Blood by Rapid immunoassay/gi, "(Rapid Card)")
//     .replace(/in Serum or Plasma/gi, "")
//     .replace(/in Blood/gi, "")
//     .replace(/\s+/g, " ")
//     .trim();
//   return clean;
// };

// export function TestDictionaryTab() {
//   const { activeLab, user } = useAuthStore();
//   const labName = activeLab || "Apex Diagnostics";
//   const labThemeColor = user?.theme_preference || "#0d9488";
//   const labLogoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(labName)}&background=${labThemeColor.replace('#', '')}&color=fff&rounded=true&bold=true`;

//   const [localTests, setLocalTests] = useState<LabTest[]>(initialLocalTests);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [deptFilter, setDeptFilter] = useState<Department | "All">("All");
//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const [globalSearchQuery, setGlobalSearchQuery] = useState("");
//   const [selectedGlobalTest, setSelectedGlobalTest] = useState<MasterCatalogTest | null>(null);
  
//   // 🔥 NEW: Toggle State for Master Catalog vs Global API
//   const [useOnlineSearch, setUseOnlineSearch] = useState(false);

//   const [formIsActive, setFormIsActive] = useState(true);
//   const [localTestCode, setLocalTestCode] = useState("");
//   const [editPrice, setEditPrice] = useState<number>(0);
//   const [editTat, setEditTat] = useState<string>("");
//   const [editGuidelines, setEditGuidelines] = useState<string>("");

//   const [isSearchingApi, setIsSearchingApi] = useState(false);
//   const [apiResults, setApiResults] = useState<MasterCatalogTest[]>([]);

//   useEffect(() => {
//     if (isDrawerOpen) document.body.style.overflow = "hidden";
//     else document.body.style.overflow = "unset";
//     return () => { document.body.style.overflow = "unset"; };
//   }, [isDrawerOpen]);

//   useEffect(() => {
//     const handleClickOutside = () => setOpenDropdownId(null);
//     if (openDropdownId) document.addEventListener("click", handleClickOutside);
//     return () => document.removeEventListener("click", handleClickOutside);
//   }, [openDropdownId]);

//   useEffect(() => {
//     if (!isDrawerOpen) {
//       setTimeout(() => {
//         setSelectedGlobalTest(null);
//         setGlobalSearchQuery("");
//         setLocalTestCode("");
//         setApiResults([]);
//         setUseOnlineSearch(false); // Reset toggle on close
//       }, 300);
//     }
//   }, [isDrawerOpen]);

//   useEffect(() => {
//     if (selectedGlobalTest) {
//       setLocalTestCode(selectedGlobalTest.shortCode);
//       setEditPrice(selectedGlobalTest.defaultPrice);
//       setEditTat(selectedGlobalTest.defaultTat);
//       setEditGuidelines(selectedGlobalTest.clinicalGuidelines);
//       setFormIsActive(true);
//     }
//   }, [selectedGlobalTest]);

//   // Real-time API Integration (Gated behind the toggle)
//   useEffect(() => {
//     let active = true;
    
//     // Only search API if toggle is ON and query is long enough
//     if (!useOnlineSearch || globalSearchQuery.trim().length < 3) {
//       setApiResults([]);
//       setIsSearchingApi(false);
//       return;
//     }

//     const fetchNihData = async () => {
//       setIsSearchingApi(true);
//       try {
//         const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?terms=${encodeURIComponent(globalSearchQuery)}&maxList=15&df=LOINC_NUM,LONG_COMMON_NAME,SYSTEM,COMPONENT`);
//         const data = await res.json();
        
//         if (active && data[3]) {
//           const formatted: MasterCatalogTest[] = data[3].map((row: string[]) => {
//              const loinc = row[0];
//              const rawName = row[1];
//              const system = row[2]?.toLowerCase() || "";
             
//              let sample: SampleType = "Serum (SST)";
//              if (system.includes("bld") || system.includes("blood")) sample = "Whole Blood (EDTA)";
//              else if (system.includes("ur")) sample = "Urine (Mid-stream)";
//              else if (system.includes("csf")) sample = "CSF";
//              else if (system.includes("plas")) sample = "Plasma (Fluoride)";
//              else if (system.includes("stool")) sample = "Stool";
//              else if (system.includes("tiss") || system.includes("swab")) sample = "Tissue/Swab";
             
//              let dept: Department = "Clinical Biochemistry";
//              const nameLower = rawName.toLowerCase();
//              if (system.includes("ur") || system.includes("stool")) dept = "Clinical Pathology";
//              else if (nameLower.includes("antibody") || nameLower.includes("antigen") || nameLower.includes("igg") || nameLower.includes("plasmodium")) dept = "Immunology & Serology";
//              else if (nameLower.includes("culture") || nameLower.includes("dna") || nameLower.includes("rna")) dept = "Microbiology";
//              else if (nameLower.includes("erythrocyte") || nameLower.includes("leukocyte") || nameLower.includes("platelet") || nameLower.includes("smear")) dept = "Hematology";
             
//              const cleanName = cleanLoincNameForIndianLab(rawName);

//              return {
//                 loinc,
//                 officialName: cleanName,
//                 shortCode: cleanName.split(" ")[0].substring(0, 6).toUpperCase(),
//                 department: dept,
//                 sampleType: sample,
//                 defaultTat: "24 Hours",
//                 defaultPrice: 500,
//                 pdfResultFields: [cleanName],
//                 clinicalGuidelines: "Follow standard clinical laboratory protocols.",
//                 aliases: [],
//                 source: "NIH-API"
//              };
//           });
//           setApiResults(formatted);
//         }
//       } catch (err) {
//         console.error("NIH API Fetch Error:", err);
//       } finally {
//         if (active) setIsSearchingApi(false);
//       }
//     };

//     const timer = setTimeout(fetchNihData, 400);
//     return () => { active = false; clearTimeout(timer); };
//   }, [globalSearchQuery, useOnlineSearch]);

//   // CRUD Actions
//   const handleSaveToDictionary = () => {
//     if (!selectedGlobalTest) return;
    
//     const newTest: LabTest = {
//       id: `DICT-${Math.floor(Math.random() * 9000) + 1000}`,
//       code: localTestCode || selectedGlobalTest.shortCode,
//       loincCode: selectedGlobalTest.loinc,
//       name: selectedGlobalTest.officialName,
//       department: selectedGlobalTest.department,
//       sampleType: selectedGlobalTest.sampleType,
//       price: editPrice,
//       tat: editTat,
//       guidelines: editGuidelines,
//       isActive: formIsActive
//     };

//     setLocalTests((prev) => [newTest, ...prev]);
//     setIsDrawerOpen(false);
//   };

//   const toggleTestStatus = (id: string) => {
//     setLocalTests(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
//     setOpenDropdownId(null);
//   };

//   const duplicateTest = (test: LabTest) => {
//     const duplicated: LabTest = { 
//       ...test, 
//       id: `DICT-${Math.floor(Math.random() * 9000) + 1000}`,
//       code: `${test.code}-COPY`,
//       name: `${test.name} (Copy)`
//     };
//     setLocalTests(prev => [duplicated, ...prev]);
//     setOpenDropdownId(null);
//   };

//   const deleteTest = (id: string) => {
//     setLocalTests(prev => prev.filter(t => t.id !== id));
//     setOpenDropdownId(null);
//   };

//   const activeDepartments = useMemo(() => {
//     const depts = new Set(localTests.map(test => test.department));
//     return ["All", ...Array.from(depts)] as ("All" | Department)[];
//   }, [localTests]);

//   const filteredTests = useMemo(() => {
//     return localTests.filter(test => {
//       const query = normalizeIndianQuery(searchQuery);
//       const matchesSearch = 
//         test.name.toLowerCase().includes(query) ||
//         test.code.toLowerCase().includes(query) ||
//         (test.loincCode && test.loincCode.toLowerCase().includes(query));
//       const matchesDept = deptFilter === "All" || test.department === deptFilter;
//       return matchesSearch && matchesDept;
//     });
//   }, [localTests, searchQuery, deptFilter]);

//   // 🔥 Split Search Logic based on Toggle
//   const searchDisplayResults = useMemo(() => {
//     if (!globalSearchQuery) return [];
    
//     if (useOnlineSearch) {
//       return apiResults; // Show strictly API results if toggled
//     } else {
//       const normalized = normalizeIndianQuery(globalSearchQuery);
//       return indianMasterCatalog.filter(t => 
//         t.officialName.toLowerCase().includes(normalized) || 
//         t.loinc.includes(normalized) ||
//         t.shortCode.toLowerCase().includes(normalized) ||
//         t.aliases.some(a => a.includes(normalized))
//       );
//     }
//   }, [globalSearchQuery, apiResults, useOnlineSearch]);

//   const getDeptIcon = (dept: Department) => {
//     if (dept.includes("Hematology") || dept.includes("Pathology")) return <Droplets size={14} className="text-rose-500" />;
//     if (dept.includes("Biochemistry") || dept.includes("Tumor")) return <FlaskConical size={14} className="text-amber-500" />;
//     if (dept.includes("Endocrinology") || dept.includes("Immunology")) return <Dna size={14} className="text-indigo-500" />;
//     if (dept.includes("Microbiology") || dept.includes("Histopathology")) return <Microscope size={14} className="text-emerald-500" />;
//     return <TestTubes size={14} className="text-cyan-500" />;
//   };

//   return (
//     <div className="flex flex-col h-[calc(100vh-120px)] w-full max-w-full animate-in fade-in duration-300">
      
//       {/* 1. HEADER */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mb-4">
//         <div>
//           <h2 className="text-lg font-bold text-slate-900 tracking-tight">Diagnostic Dictionary</h2>
//           <p className="text-sm text-slate-500 mt-1">
//             Manage your master catalogue of parameters, pricing, and clinical guidelines.
//           </p>
//         </div>
//         <button
//           onClick={() => setIsDrawerOpen(true)}
//           className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95 outline-none whitespace-nowrap"
//         >
//           <Plus size={16} strokeWidth={2.5} /> Add Parameter
//         </button>
//       </div>

//       {/* 2. COMMAND BAR */}
//       <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full shrink-0 mb-4">
//         <div className="relative w-full lg:w-[320px] shrink-0">
//           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//           <input
//             type="text"
//             className="w-full pl-9 pr-4 py-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
//             placeholder="Search local directory (e.g. maleria, CBC)..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />
//         </div>
        
//         <div className="flex w-full lg:w-auto overflow-x-auto no-scrollbar gap-1">
//           {activeDepartments.map((dept) => {
//             const isActive = deptFilter === dept;
//             return (
//               <button
//                 key={dept}
//                 onClick={() => setDeptFilter(dept as any)}
//                 className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap outline-none ${
//                   isActive ? "bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
//                 }`}
//               >
//                 {dept === "All" && <Settings2 size={14} className="mr-1.5" />}
//                 {dept === "All" ? "All Active Departments" : dept.replace("Clinical ", "").replace(" & Cytology", "").replace(" & Serology", "")}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* 3. RESPONSIVE TABLE (NO OVERFLOW) */}
//       <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full relative z-10 flex-1 min-h-0 overflow-y-auto">
//         <table className="w-full text-left table-fixed">
//           <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-20 border-b border-slate-200">
//             <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
//               <th className="py-3 px-4 w-[60%] sm:w-[40%] md:w-[35%]">Parameter & Details</th>
//               <th className="py-3 px-4 hidden md:table-cell w-[25%]">Department & Tube</th>
//               <th className="py-3 px-4 hidden sm:table-cell w-[20%]">Price & TAT</th>
//               <th className="py-3 px-4 hidden lg:table-cell w-[10%]">Status</th>
//               <th className="py-3 px-4 text-right w-[40%] sm:w-[20%] lg:w-[10%]">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {filteredTests.map((test, index) => {
//               const requiresFasting = test.guidelines.toLowerCase().includes("fasting");
//               const isBottomRow = index > 0 && index >= filteredTests.length - 2;
//               const isDropdownOpen = openDropdownId === test.id;
              
//               return (
//                 <tr key={test.id} className="hover:bg-slate-50/60 transition-colors group bg-white">
//                   <td className="py-4 px-4 align-top">
//                     <div className="flex items-start gap-3">
//                       <div className={`mt-0.5 w-8 h-8 rounded-md border hidden sm:flex items-center justify-center text-[10px] font-bold shrink-0 ${
//                         test.isActive ? 'bg-teal-50 border-teal-100 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-400'
//                       }`}>
//                         {test.code.substring(0, 2)}
//                       </div>
//                       <div className="flex flex-col min-w-0 pr-2">
//                         <div className="flex items-center gap-2 flex-wrap">
//                           <span className={`text-sm font-semibold truncate ${test.isActive ? 'text-slate-900' : 'text-slate-500'}`}>
//                             {test.name}
//                           </span>
//                           {test.loincCode && (
//                             <span className="inline-flex items-center gap-1 rounded bg-teal-50/50 px-1.5 py-0.5 text-[9px] font-bold text-teal-700 ring-1 ring-inset ring-teal-600/20 shrink-0">
//                               <ShieldCheck size={10} /> ABDM
//                             </span>
//                           )}
//                         </div>
//                         <div className="flex items-center gap-2 mt-0.5 flex-wrap">
//                           <span className="text-xs font-mono font-medium text-slate-500">{test.code}</span>
//                           <span className="w-1 h-1 rounded-full bg-slate-200"></span>
//                           <span className="text-[10px] text-slate-400 font-mono truncate">{test.id}</span>
//                         </div>

//                         <div className="flex sm:hidden items-center gap-2 mt-2 text-[11px] flex-wrap">
//                           <span className="font-bold text-slate-900">₹{test.price}</span>
//                           <span className="text-slate-300">•</span>
//                           <span className="text-slate-500">{test.tat}</span>
//                           <span className="text-slate-300">•</span>
//                           <span className={`${test.isActive ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>{test.isActive ? 'Active' : 'Inactive'}</span>
//                         </div>

//                         <div className="flex md:hidden items-center gap-2 mt-1.5 text-[11px] flex-wrap">
//                           <span className="text-slate-600 truncate">{test.department}</span>
//                           {requiresFasting && <span className="text-amber-600 font-bold shrink-0"> • Fasting</span>}
//                         </div>
//                       </div>
//                     </div>
//                   </td>
                  
//                   <td className="py-4 px-4 hidden md:table-cell align-top">
//                     <div className="flex flex-col gap-1.5 items-start">
//                       <div className="flex items-center gap-2 flex-wrap">
//                         <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700 truncate" title={test.department}>
//                           {getDeptIcon(test.department)} {test.department}
//                         </span>
//                         {requiresFasting && (
//                           <span className="flex items-center gap-1 text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded ring-1 ring-inset ring-amber-600/20 whitespace-nowrap">
//                             <Coffee size={10} /> Fasting
//                           </span>
//                         )}
//                       </div>
//                       <span className="text-[11px] text-slate-500 ml-5 truncate" title={test.sampleType}>Tube: <span className="font-semibold text-slate-600">{test.sampleType}</span></span>
//                     </div>
//                   </td>

//                   <td className="py-4 px-4 hidden sm:table-cell align-top">
//                     <div className="flex flex-col gap-1 items-start">
//                       <span className="text-sm font-semibold font-mono text-slate-900">₹{test.price.toLocaleString('en-IN')}</span>
//                       <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
//                         <Clock size={12} className="text-slate-400" /> TAT: {test.tat}
//                       </span>
//                     </div>
//                   </td>
                  
//                   <td className="py-4 px-4 hidden lg:table-cell align-top">
//                     <button 
//                       onClick={() => toggleTestStatus(test.id)}
//                       className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset outline-none transition-all active:scale-95 ${
//                         test.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 hover:bg-emerald-100' : 'bg-slate-50 text-slate-600 ring-slate-500/20 hover:bg-slate-100'
//                       }`}
//                     >
//                       <span className={`w-1.5 h-1.5 rounded-full ${test.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
//                       {test.isActive ? 'Active' : 'Inactive'}
//                     </button>
//                   </td>
                  
//                   <td className={`py-4 px-4 text-right relative align-top ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
//                     <div className="flex items-center justify-end gap-1">
//                       <button 
//                         onClick={() => {
//                           const master = indianMasterCatalog.find(m => m.loinc === test.loincCode) || {
//                             loinc: test.loincCode || "", officialName: test.name, shortCode: test.code, department: test.department, sampleType: test.sampleType, defaultPrice: test.price, defaultTat: test.tat, clinicalGuidelines: test.guidelines, pdfResultFields: [], aliases: [], source: "Curated"
//                           };
//                           setSelectedGlobalTest(master);
//                           setLocalTestCode(test.code);
//                           setIsDrawerOpen(true);
//                         }}
//                         className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors outline-none sm:opacity-0 sm:group-hover:opacity-100" 
//                         title="Edit Parameter"
//                       >
//                         <FileEdit size={16} />
//                       </button>
                      
//                       <div className="relative">
//                         <button 
//                           onClick={(e) => { 
//                             e.stopPropagation(); 
//                             setOpenDropdownId(isDropdownOpen ? null : test.id); 
//                           }} 
//                           className={`p-1.5 rounded-md transition-colors outline-none ${isDropdownOpen ? 'text-slate-800 bg-slate-100' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}
//                         >
//                           <MoreHorizontal size={16} />
//                         </button>
                        
//                         {/* Dropdown Menu */}
//                         {isDropdownOpen && (
//                           <div 
//                             className={`absolute right-0 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 ${
//                               isBottomRow ? "bottom-full mb-2 origin-bottom-right" : "top-full mt-2 origin-top-right"
//                             }`}
//                             onClick={(e) => e.stopPropagation()} 
//                           >
//                             <button onClick={() => toggleTestStatus(test.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2 outline-none transition-colors">
//                               <PowerOff size={14} className="text-amber-500"/> {test.isActive ? 'Deactivate' : 'Activate'}
//                             </button>
//                             <button onClick={() => duplicateTest(test)} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 outline-none transition-colors">
//                               <Copy size={14} className="text-slate-400"/> Duplicate
//                             </button>
//                             <div className="h-px bg-slate-100 my-1 mx-2" />
//                             <button onClick={() => deleteTest(test.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 outline-none transition-colors">
//                               <Trash2 size={14} className="text-red-500"/> Delete
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
        
//         {filteredTests.length === 0 && (
//           <div className="py-20 text-center">
//             <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200">
//               <Search size={20} />
//             </div>
//             <p className="text-slate-900 font-semibold text-sm">No records found</p>
//             <p className="text-xs text-slate-500 mt-1">Try searching for "maleria", "dengue", "sugar", or "CBC".</p>
//             <button onClick={() => {setSearchQuery(""); setDeptFilter("All");}} className="mt-4 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors outline-none">
//               Clear Filters
//             </button>
//           </div>
//         )}
//       </div>

//       {/* ========================================================= */}
//       {/* 4. SMART CONFIGURATION DRAWER                             */}
//       {/* ========================================================= */}
//       {isDrawerOpen && (
//         <div className="fixed inset-0 z-[100] flex justify-end">
//           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" onClick={() => setIsDrawerOpen(false)} />
          
//           <div className="relative w-full md:w-[600px] h-full bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-10 border-l border-slate-200">
            
//             <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
//               <div>
//                 <h2 className="text-base font-bold text-slate-900">Add Test Parameter</h2>
//                 <p className="text-xs text-slate-500 mt-0.5">Auto-configure using Global & ABDM guidelines</p>
//               </div>
//               <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md outline-none transition-colors"><X size={18} /></button>
//             </div>

//             <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
              
//               {/* STEP 1: CATALOG SEARCH */}
//               {!selectedGlobalTest ? (
//                 <div className="space-y-4 animate-in fade-in duration-300">
                  
//                   <div className="relative">
//                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
//                     <input 
//                       type="text" 
//                       autoFocus
//                       className="w-full pl-10 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm transition-all"
//                       placeholder={useOnlineSearch ? "Search global LOINC database..." : "Search Indian test catalog (e.g. CBC, Dengue)..."}
//                       value={globalSearchQuery}
//                       onChange={(e) => setGlobalSearchQuery(e.target.value)}
//                     />
//                     {isSearchingApi && (
//                       <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-600 animate-spin" />
//                     )}
//                   </div>

//                   {/* 🔥 TOGGLE FOR GLOBAL API SEARCH */}
//                   <div className="flex items-start gap-2 mt-2 px-1">
//                     <input 
//                       type="checkbox" 
//                       id="onlineSearchToggle" 
//                       checked={useOnlineSearch}
//                       onChange={(e) => setUseOnlineSearch(e.target.checked)}
//                       className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-600 cursor-pointer"
//                     />
//                     <label htmlFor="onlineSearchToggle" className="text-[11px] text-slate-600 cursor-pointer select-none">
//                       <span className="font-semibold text-slate-800">Search Official Global Database (NIH API)</span>
//                       <span className="block text-slate-500 leading-tight mt-0.5">Check this only if you cannot find the test in the pre-verified Indian master catalog.</span>
//                     </label>
//                   </div>

//                   {!globalSearchQuery ? (
//                     <div className="space-y-3 mt-6">
//                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Zap size={14} className="text-amber-500"/> Popular Clinical Panels</h4>
//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//                         {indianMasterCatalog.slice(0, 10).map(test => (
//                           <button 
//                             key={test.loinc}
//                             onClick={() => setSelectedGlobalTest(test)}
//                             className="text-left px-3 py-2.5 bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 rounded-lg shadow-sm transition-all outline-none group"
//                           >
//                             <span className="block text-sm font-bold text-slate-800 group-hover:text-teal-700 truncate">{test.officialName}</span>
//                             <span className="block text-[10px] text-slate-500 mt-0.5 truncate">{test.department}</span>
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col mt-4">
//                       {searchDisplayResults.length > 0 ? (
//                         searchDisplayResults.map((test, i) => (
//                           <button 
//                             key={`${test.loinc}-${i}`}
//                             onClick={() => setSelectedGlobalTest(test)}
//                             className="flex flex-col text-left px-4 py-3 hover:bg-teal-50/50 border-b border-slate-100 last:border-0 outline-none transition-colors group"
//                           >
//                             <div className="flex justify-between items-start w-full gap-2">
//                               <span className="text-sm font-bold text-slate-900 leading-tight group-hover:text-teal-600 transition-colors">{test.officialName}</span>
//                               <div className="flex items-center gap-1 shrink-0">
//                                 {test.source === "NIH-API" && <Globe size={12} className="text-indigo-500" aria-label="Fetched from Global LOINC Registry" />}
//                                 <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${test.source === "NIH-API" ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>LOINC: {test.loinc}</span>
//                               </div>
//                             </div>
//                             <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
//                               <span className="flex items-center gap-1.5">{getDeptIcon(test.department)} {test.department}</span>
//                               <span className="w-1 h-1 rounded-full bg-slate-300"></span>
//                               <span className="truncate">{test.sampleType}</span>
//                             </div>
//                           </button>
//                         ))
//                       ) : (
//                         <div className="px-4 py-6 text-center text-sm text-slate-500">
//                           {isSearchingApi 
//                             ? "Searching global registry..." 
//                             : useOnlineSearch 
//                               ? "No matching tests found globally." 
//                               : "Not found in curated catalog. Try enabling 'Search Official Global Database'."}
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2 text-emerald-600">
//                       <ShieldCheck size={16} />
//                       <span className="text-xs font-bold uppercase tracking-widest">
//                         {selectedGlobalTest.source === "NIH-API" ? "Official LOINC Template Loaded" : "Master Template Loaded"}
//                       </span>
//                     </div>
//                     <button onClick={() => setSelectedGlobalTest(null)} className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline underline-offset-2 outline-none">
//                       Change Template
//                     </button>
//                   </div>

//                   <div className="bg-slate-200/50 p-4 rounded-xl border border-slate-200/80 shadow-inner overflow-hidden hidden sm:block">
//                     <div className="flex items-center justify-between mb-3">
//                       <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
//                         <FileSignature size={14}/> Result Report Preview
//                       </h4>
//                     </div>
                    
//                     <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 font-sans mx-auto max-w-[500px]">
//                       <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-100/80 rounded-md text-[10px] text-amber-900 flex items-start gap-2">
//                         <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
//                         <div>
//                           <strong className="font-bold block text-amber-800 mb-0.5">Pre-analytical Guidelines (Patient Prep):</strong>
//                           {selectedGlobalTest.clinicalGuidelines}
//                         </div>
//                       </div>

//                       <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
//                         <img src={labLogoUrl} alt="Lab Logo" className="w-8 h-8 rounded-md shadow-sm border border-slate-100" />
//                         <div>
//                           <h5 className="text-xs font-black text-slate-900 tracking-wide uppercase">{labName}</h5>
//                           <p className="text-[9px] text-slate-400">ABDM Compliant • LOINC: {selectedGlobalTest.loinc}</p>
//                         </div>
//                       </div>

//                       <div className="mb-4">
//                         <h6 className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: labThemeColor }}>
//                           Investigation Panel
//                         </h6>
//                         <p className="text-sm font-black text-slate-900 leading-tight">{selectedGlobalTest.officialName}</p>
//                       </div>

//                       <table className="w-full text-left text-[11px]">
//                         <thead>
//                           <tr className="border-b-2 border-slate-800 text-slate-500">
//                             <th className="pb-1.5 font-bold w-[45%]">Analyte / Parameter</th>
//                             <th className="pb-1.5 font-bold w-[20%]">Result</th>
//                             <th className="pb-1.5 font-bold w-[15%]">Unit</th>
//                             <th className="pb-1.5 font-bold text-right w-[20%]">Ref. Interval</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {selectedGlobalTest.pdfResultFields.map((field, i) => (
//                             <tr key={i} className="border-b border-slate-100 last:border-0 group">
//                               <td className="py-2 text-slate-800 font-semibold truncate pr-2" title={field}>{field}</td>
//                               <td className="py-2"><div className="w-8 h-3 bg-slate-100 rounded animate-pulse"></div></td>
//                               <td className="py-2 text-slate-400 text-[9px]">—</td>
//                               <td className="py-2 text-right text-slate-400 text-[9px]">—</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>

//                       <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
//                         <span>Tube: <span className="font-bold text-slate-500">{selectedGlobalTest.sampleType}</span></span>
//                         <span>Dept: <span className="font-bold text-slate-500">{selectedGlobalTest.department}</span></span>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
//                     <div className="flex items-center gap-2 text-slate-800 mb-2 border-b border-slate-100 pb-3">
//                       <Settings2 size={16} className="text-teal-600" />
//                       <span className="text-xs font-bold uppercase tracking-widest">Finalize Local Setup</span>
//                     </div>
                    
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-700 mb-1.5">Local Display Name</label>
//                       <input type="text" defaultValue={selectedGlobalTest.officialName} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all" />
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-xs font-semibold text-slate-700 mb-1.5">Local Test Code <span className="text-rose-500">*</span></label>
//                         <input 
//                           type="text" 
//                           value={localTestCode}
//                           onChange={(e) => setLocalTestCode(e.target.value.toUpperCase())}
//                           className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all" 
//                           placeholder="e.g. LFT" 
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-xs font-semibold text-slate-700 mb-1.5">Billing Rate (₹) <span className="text-rose-500">*</span></label>
//                         <div className="relative">
//                           <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">₹</div>
//                           <input 
//                             type="number" 
//                             value={editPrice || ""}
//                             onChange={(e) => setEditPrice(Number(e.target.value))}
//                             className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none" 
//                             placeholder="0.00" 
//                           />
//                         </div>
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between">
//                         <span>Patient Prep Guidelines</span>
//                         <span className="text-[10px] font-normal text-slate-400">Visible to Front Desk</span>
//                       </label>
//                       <textarea 
//                         value={editGuidelines}
//                         onChange={(e) => setEditGuidelines(e.target.value)}
//                         className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all resize-none"
//                         rows={2}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {selectedGlobalTest && (
//               <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0 animate-in fade-in duration-300">
//                 <button type="button" onClick={() => setFormIsActive(!formIsActive)} className="flex items-center gap-2 outline-none">
//                   <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${formIsActive ? 'bg-teal-500' : 'bg-slate-300'}`}>
//                     <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${formIsActive ? 'left-[18px]' : 'left-0.5'}`}></div>
//                   </div>
//                   <span className={`text-xs font-semibold ${formIsActive ? 'text-slate-700' : 'text-slate-400'}`}>
//                     {formIsActive ? 'Active Test' : 'Inactive'}
//                   </span>
//                 </button>

//                 <div className="flex gap-2">
//                   <button onClick={() => setIsDrawerOpen(false)} className="px-4 sm:px-5 py-2.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors outline-none">
//                     Cancel
//                   </button>
//                   <button onClick={handleSaveToDictionary} className="px-4 sm:px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all active:scale-95 outline-none flex items-center gap-2">
//                     <CheckCircle2 size={16} strokeWidth={2.5}/> Save Parameter
//                   </button>
//                 </div>
//               </div>
//             )}

//           </div>
//         </div>
//       )}

//     </div>
//   );
// }