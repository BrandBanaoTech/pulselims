"use client";

import { useState, useMemo } from "react";
import { 
  Users, Activity, CheckCircle2, HeartPulse
} from "lucide-react";


export default function DashboardOverviewPage() {

      // Derived Analytics
  // const totalIntake = mockPatients.length;
  // const pendingReports = mockPatients.filter(p => p.reportStatus === "Pending" || p.reportStatus === "Processing").length;
  // const completedReports = mockPatients.filter(p => p.reportStatus === "Completed").length;
  // const totalRevenue = mockPatients.reduce((sum, p) => p.paymentStatus === "Paid" ? sum + p.totalBill : sum, 0);

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden animate-in fade-in duration-500">
      <main className="flex-1 space-y-8 w-full max-w-7xl mx-auto">
        
        {/* ========================================================= */}
        {/* 1. HERO BANNER (Command Centre)                           */}
        {/* ========================================================= */}
        <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-2 relative z-10 font-sans max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-teal-300 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10 backdrop-blur-sm">
              <HeartPulse size={12} className="animate-pulse" /> Live Laboratory Workflow
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-2">Diagnostic Queue Command Centre</h2>
            <p className="text-sm text-slate-300 font-medium leading-relaxed mt-1">
              Welcome back, Register patients, route blood samples automatically, input raw metrics to instantly generate signature-ready reports, and manage dispatches.
            </p>
          </div>

          <div className="flex bg-white/5 backdrop-blur-md rounded-2xl p-5 gap-6 border border-white/10 relative z-10 shrink-0 shadow-inner">
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Sample Dispatch</p>
              <p className="text-2xl font-black font-mono mt-1 text-teal-300">88.5%</p>
            </div>
            <div className="w-px bg-white/10"></div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Hours Saved</p>
              <p className="text-2xl font-black font-mono mt-1 text-teal-300">14.5<span className="text-sm">h</span></p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. CLINICAL STATS GRID                                    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:border-teal-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl">
              <Users size={24} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-black uppercase block tracking-wider">Total Patients</span>
              {/* <span className="text-3xl font-black text-slate-900 leading-tight mt-0.5 block">{totalIntake}</span> */}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:border-amber-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl relative">
              <Activity size={24} strokeWidth={2.5} />
              <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-amber-500 border-2 border-white animate-pulse"></span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-black uppercase block tracking-wider">Draft Queue</span>
              {/* <span className="text-3xl font-black text-slate-900 leading-tight mt-0.5 block">{pendingReports}</span> */}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:border-emerald-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 size={24} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-black uppercase block tracking-wider">Signed Reports</span>
              {/* <span className="text-3xl font-black text-slate-900 leading-tight mt-0.5 block">{completedReports}</span> */}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
              <span className="text-2xl font-black font-mono leading-none">₹</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-black uppercase block tracking-wider">Revenue Ledger</span>
              <span className="text-3xl font-black font-mono text-slate-900 leading-tight mt-0.5 block">
                {/* {totalRevenue.toLocaleString("en-IN")} */}
              </span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}


// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { 
//   Users, FlaskConical, FileCheck2, TrendingUp, Plus, ArrowRight, 
//   Clock, Activity, Search, Filter, MoreVertical, AlertCircle, 
//   CalendarDays, ScanLine, ArrowUpRight, Timer
// } from "lucide-react";

// // ==========================================
// // MOCK DATA 
// // ==========================================
// const metrics = [
//   { 
//     title: "Patients Today", 
//     value: "142", 
//     trend: "+12.5%", 
//     isPositive: true, 
//     icon: Users,
//     color: "text-blue-600",
//     bgColor: "bg-blue-50",
//     borderColor: "border-blue-200/50"
//   },
//   { 
//     title: "Pending Samples", 
//     value: "34", 
//     trend: "-5.2%", 
//     isPositive: true, 
//     icon: FlaskConical,
//     color: "text-amber-600",
//     bgColor: "bg-amber-50",
//     borderColor: "border-amber-200/50"
//   },
//   { 
//     title: "Reports Dispatched", 
//     value: "389", 
//     trend: "+18.1%", 
//     isPositive: true, 
//     icon: FileCheck2,
//     color: "text-emerald-600",
//     bgColor: "bg-emerald-50",
//     borderColor: "border-emerald-200/50"
//   },
//   { 
//     title: "Daily Revenue", 
//     value: "₹1,24,500", 
//     trend: "+8.4%", 
//     isPositive: true, 
//     icon: TrendingUp,
//     color: "text-indigo-600",
//     bgColor: "bg-indigo-50",
//     borderColor: "border-indigo-200/50"
//   },
// ];

// const recentPatients = [
//   { id: "PT-10024", name: "Rahul Sharma", test: "Complete Blood Count", status: "Processing", priority: "STAT", time: "10:24 AM", tat: "1h 15m" },
//   { id: "PT-10025", name: "Priya Patel", test: "Lipid Profile", status: "Pending Sample", priority: "Routine", time: "10:45 AM", tat: "4h 30m" },
//   { id: "PT-10026", name: "Amit Kumar", test: "HbA1c", status: "Completed", priority: "Routine", time: "11:10 AM", tat: "Ready" },
//   { id: "PT-10027", name: "Sneha Reddy", test: "Thyroid Panel (T3, T4, TSH)", status: "Processing", priority: "Routine", time: "11:30 AM", tat: "2h 45m" },
//   { id: "PT-10028", name: "Vikram Singh", test: "Liver Function Test", status: "Pending Sample", priority: "Urgent", time: "11:45 AM", tat: "45m" },
// ];

// const getInitials = (name: string) => {
//   return name.split(' ').map(n => n[0]).join('').substring(0, 2);
// };

// export default function DashboardOverviewPage() {
//   const [searchQuery, setSearchQuery] = useState("");

//   return (
//     <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
//       <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-5xl mx-auto">
//         <div className="space-y-6 animate-fade-in">
//           {/* INFORMATIVE APP SUMMARY ALERT (Dribbble touch) */}
//           <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
//             <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
//             <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl"></div>
//             <div className="space-y-1.5 relative z-10 font-sans">
//               <span className="px-2.5 py-1 bg-white/10 text-teal-300 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/10">
//               ⚡ LIVE LABORATORY WORKFLOW
//               </span>
//               <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-1.5">Diagnostic Queue Command Centre</h2>
//               <p className="text-xs text-slate-305 max-w-xl font-medium leading-relaxed mt-0.5">
//                 Register patients below, route blood samples automatically, input raw metrics to instantly generate signature-ready reports, and share them via manual WhatsApp dispatches.
//               </p>
//               </div>
//             </div>
//         </div>
//       </main>
//     </div>
    // <div className="space-y-8 pb-12">
      
    //   {/* ========================================== */}
    //   {/* PAGE HEADER & QUICK ACTIONS */}
    //   {/* ========================================== */}
    //   <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    //     <div>
    //       <div className="flex items-center gap-2 text-teal-600 mb-2">
    //         <CalendarDays size={14} />
    //         <span className="text-xs font-black uppercase tracking-widest">
    //           {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
    //         </span>
    //       </div>
    //       <h2 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Command Center</h2>
    //       <p className="text-sm font-medium text-slate-500 mt-1">
    //         Real-time pulse of your laboratory operations and turnaround times.
    //       </p>
    //     </div>
        
    //     <div className="flex items-center gap-3">
    //       <button className="hidden sm:flex items-center gap-2 py-3 px-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-extrabold rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-slate-200 outline-none">
    //         <ScanLine size={18} className="text-slate-500" />
    //         Scan Barcode
    //       </button>
    //       <Link
    //         href="/dashboard/patients/new"
    //         className="group flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-teal-500/30 transition-all focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 outline-none"
    //       >
    //         <Plus size={18} strokeWidth={2.5} className="transition-transform group-hover:rotate-90" />
    //         Register Patient
    //       </Link>
    //     </div>
    //   </div>

    //   {/* ========================================== */}
    //   {/* TOP METRICS GRID */}
    //   {/* ========================================== */}
    //   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    //     {metrics.map((metric, i) => {
    //       const Icon = metric.icon;
    //       const delayClass = `delay-[${i * 100}ms]`; 
          
    //       return (
    //         <div 
    //           key={metric.title} 
    //           className={`bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-0.5 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 fill-mode-both ${delayClass}`}
    //         >
    //           <div className="flex items-start justify-between mb-6">
    //             <div className={`p-3 rounded-2xl border ${metric.bgColor} ${metric.borderColor} transition-transform duration-300 group-hover:scale-110`}>
    //               <Icon className={metric.color} size={22} strokeWidth={2.5} />
    //             </div>
    //             <div className="flex flex-col items-end">
    //               <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border ${
    //                 metric.isPositive 
    //                   ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" 
    //                   : "bg-red-50 text-red-700 border-red-200/50"
    //               }`}>
    //                 {metric.isPositive ? <ArrowUpRight size={12} strokeWidth={3}/> : null}
    //                 {metric.trend}
    //               </span>
    //               <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">vs yesterday</span>
    //             </div>
    //           </div>
    //           <div>
    //             <h3 className="text-3xl font-black text-slate-900 tracking-tight">{metric.value}</h3>
    //             <p className="text-sm font-bold text-slate-500 mt-1">{metric.title}</p>
    //           </div>
    //         </div>
    //       );
    //     })}
    //   </div>

    //   {/* ========================================== */}
    //   {/* RECENT PATIENTS DATA GRID (Full Width Now) */}
    //   {/* ========================================== */}
    //   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
    //     <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm flex flex-col overflow-hidden relative">
          
    //       {/* Subtle Top Gradient Line */}
    //       <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-blue-500 opacity-50"></div>

    //       {/* Table Header Controls */}
    //       <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 mt-1">
    //         <div>
    //           <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
    //             Live Intake Feed
    //             <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
    //           </h3>
    //           <p className="text-xs font-bold text-slate-500 mt-0.5">Showing latest 5 registrations</p>
    //         </div>
            
    //         <div className="flex items-center gap-2">
    //           <div className="relative">
    //             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
    //             <input 
    //               type="text" 
    //               placeholder="Search ID or Name..." 
    //               className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold w-48 sm:w-64 focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm"
    //               value={searchQuery}
    //               onChange={(e) => setSearchQuery(e.target.value)}
    //             />
    //           </div>
    //           <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm focus:ring-2 focus:ring-teal-500 outline-none">
    //             <Filter size={16} />
    //           </button>
    //         </div>
    //       </div>

    //       {/* Table Body */}
    //       <div className="flex-1 overflow-x-auto">
    //         <table className="w-full text-left border-collapse min-w-[700px]">
    //           <thead>
    //             <tr className="bg-white border-b border-slate-100">
    //               <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Patient Details</th>
    //               <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Requested Test</th>
    //               <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">TAT</th>
    //               <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
    //               <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
    //             </tr>
    //           </thead>
    //           <tbody className="divide-y divide-slate-50">
    //             {recentPatients.map((patient) => (
    //               <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                    
    //                 {/* Patient ID, Avatar & Name */}
    //                 <td className="px-6 py-4">
    //                   <div className="flex items-center gap-3">
    //                     <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-extrabold text-sm shrink-0">
    //                       {getInitials(patient.name)}
    //                     </div>
    //                     <div className="flex flex-col">
    //                       <span className="text-sm font-extrabold text-slate-900">{patient.name}</span>
    //                       <span className="text-xs font-bold text-slate-500 mt-0.5">{patient.id}</span>
    //                     </div>
    //                   </div>
    //                 </td>

    //                 {/* Test & Priority */}
    //                 <td className="px-6 py-4">
    //                   <div className="flex flex-col items-start gap-1.5">
    //                     <span className="text-sm font-bold text-slate-700">{patient.test}</span>
    //                     {patient.priority === "STAT" && (
    //                       <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded uppercase tracking-wider">
    //                         <AlertCircle size={10} strokeWidth={3} /> STAT
    //                       </span>
    //                     )}
    //                     {patient.priority === "Urgent" && (
    //                       <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded uppercase tracking-wider">
    //                         Urgent
    //                       </span>
    //                     )}
    //                   </div>
    //                 </td>

    //                 {/* Turnaround Time (TAT) */}
    //                 <td className="px-6 py-4">
    //                    <span className={`inline-flex items-center gap-1.5 text-xs font-black ${
    //                       patient.tat === 'Ready' ? 'text-emerald-600' : 
    //                       patient.priority === 'STAT' ? 'text-red-600' : 'text-slate-600'
    //                    }`}>
    //                      {patient.tat !== 'Ready' && <Timer size={14} />}
    //                      {patient.tat}
    //                    </span>
    //                 </td>

    //                 {/* Status Badge */}
    //                 <td className="px-6 py-4">
    //                   <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${
    //                     patient.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
    //                     patient.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200/60' :
    //                     'bg-slate-100 text-slate-600 border-slate-200/60'
    //                   }`}>
    //                     {patient.status === 'Processing' && <Activity size={14} className="animate-pulse" />}
    //                     {patient.status === 'Pending Sample' && <Clock size={14} />}
    //                     {patient.status === 'Completed' && <FileCheck2 size={14} />}
    //                     {patient.status}
    //                   </span>
    //                 </td>

    //                 {/* Actions */}
    //                 <td className="px-6 py-4 text-right">
    //                   <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:ring-2 focus:ring-teal-500 outline-none">
    //                     <MoreVertical size={18} />
    //                   </button>
    //                 </td>
    //               </tr>
    //             ))}
    //           </tbody>
    //         </table>
    //       </div>

    //       {/* Table Footer CTA */}
    //       <div className="p-4 border-t border-slate-100 bg-slate-50/80 text-center">
    //          <Link href="/dashboard/patients" className="text-xs font-black text-teal-600 hover:text-teal-700 inline-flex items-center gap-1.5 uppercase tracking-wider transition-colors">
    //           View All 142 Patients <ArrowRight size={14} strokeWidth={2.5} />
    //         </Link>
    //       </div>
    //     </div>
    //   </div>

    // </div>
  // );
// }