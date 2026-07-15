"use client";

import Link from "next/link";
import { 
  Users, 
  FlaskConical, 
  FileCheck2, 
  TrendingUp, 
  Plus,
  ArrowRight,
  Clock,
  Activity
} from "lucide-react";

// ==========================================
// MOCK DATA (To be replaced with real API hooks)
// ==========================================
const metrics = [
  { 
    title: "Patients Today", 
    value: "42", 
    trend: "+12%", 
    isPositive: true, 
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  { 
    title: "Pending Tests", 
    value: "18", 
    trend: "-5%", 
    isPositive: true, // Fewer pending is better
    icon: FlaskConical,
    color: "text-amber-600",
    bgColor: "bg-amber-50"
  },
  { 
    title: "Reports Completed", 
    value: "128", 
    trend: "+8%", 
    isPositive: true, 
    icon: FileCheck2,
    color: "text-teal-600",
    bgColor: "bg-teal-50"
  },
  { 
    title: "Daily Revenue", 
    value: "₹54,200", 
    trend: "+24%", 
    isPositive: true, 
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
];

const recentPatients = [
  { id: "PT-10024", name: "Rahul Sharma", test: "Complete Blood Count", status: "Processing", time: "10:24 AM" },
  { id: "PT-10025", name: "Priya Patel", test: "Lipid Profile", status: "Pending Sample", time: "10:45 AM" },
  { id: "PT-10026", name: "Amit Kumar", test: "HbA1c", status: "Completed", time: "11:10 AM" },
  { id: "PT-10027", name: "Sneha Reddy", test: "Thyroid Panel", status: "Processing", time: "11:30 AM" },
  { id: "PT-10028", name: "Vikram Singh", test: "Liver Function Test", status: "Pending Sample", time: "11:45 AM" },
];

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      
      {/* ========================================== */}
      {/* PAGE HEADER & QUICK ACTIONS */}
      {/* ========================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Today's Overview</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Real-time pulse of your laboratory operations.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/patients/new"
            className="group flex items-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-teal-500/30 transition-all"
          >
            <Plus size={18} strokeWidth={2.5} className="transition-transform group-hover:rotate-90" />
            New Patient
          </Link>
        </div>
      </div>

      {/* ========================================== */}
      {/* TOP METRICS GRID */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div 
              key={metric.title} 
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:border-slate-200 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${metric.bgColor}`}>
                  <Icon className={metric.color} size={24} />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  metric.isPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}>
                  {metric.trend}
                </span>
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-slate-900">{metric.value}</h3>
                <p className="text-sm font-bold text-slate-500 mt-1">{metric.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ========================================== */}
        {/* RECENT PATIENTS (Main Column) */}
        {/* ========================================== */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Recent Patients</h3>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Live Intake Feed</p>
            </div>
            <Link href="/dashboard/patients" className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 group">
              View All <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient ID</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Test Registered</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="py-4 text-sm font-bold text-slate-900">{patient.id}</td>
                    <td className="py-4 text-sm font-bold text-slate-700">{patient.name}</td>
                    <td className="py-4 text-sm font-medium text-slate-500">{patient.test}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        patient.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        patient.status === 'Processing' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {patient.status === 'Processing' && <Activity size={12} className="animate-pulse" />}
                        {patient.status === 'Pending Sample' && <Clock size={12} />}
                        {patient.status === 'Completed' && <FileCheck2 size={12} />}
                        {patient.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================== */}
        {/* SYSTEM STATUS (Sidebar Column) */}
        {/* ========================================== */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-6 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative background pulse */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-teal-500/20 blur-3xl rounded-full"></div>
          
          <div className="relative z-10">
            <h3 className="text-lg font-extrabold text-white">System Status</h3>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Hardware & API Sync</p>
            
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                  <span className="text-sm font-bold">Main Server</span>
                </div>
                <span className="text-sm font-bold text-emerald-400">Online</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                  <span className="text-sm font-bold">Database Auth</span>
                </div>
                <span className="text-sm font-bold text-slate-400">12ms Ping</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                  <span className="text-sm font-bold">Lab Analyzers</span>
                </div>
                <span className="text-sm font-bold text-slate-400">Synced</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 relative z-10">
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              Workspace secured with End-to-End Encryption.<br/>
              Last synced: Just now.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// "use client";

// import { useState } from "react";
// import { Search, Plus, Calendar, Filter, FileText, Users } from "lucide-react";
// import Link from "next/link";

// export default function DashboardPage() {
//   const [searchQuery, setSearchQuery] = useState("");

//   // This will eventually be replaced by a real React Query fetch
//   const stats = [
//     { label: "Today's Intakes", value: "12", icon: Calendar, color: "text-teal-600" },
//     { label: "Pending Reports", value: "4", icon: FileText, color: "text-amber-600" },
//   ];

//   return (
//     <div className="space-y-8 animate-in fade-in duration-500">
      
//       {/* 1. Header & Quick Actions */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
//           <p className="text-slate-500 text-sm mt-1">Manage today's clinical operations and patient flow.</p>
//         </div>
        
//         <div className="flex items-center gap-3">
//           <Link 
//             href="/dashboard/intake" 
//             className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
//           >
//             <Plus size={16} /> New Intake
//           </Link>
//         </div>
//       </div>

//       {/* 2. Stats Row */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {stats.map((stat, idx) => (
//           <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
//             <div className={`p-3 bg-slate-50 rounded-xl ${stat.color}`}>
//               <stat.icon size={20} />
//             </div>
//             <div>
//               <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{stat.label}</p>
//               <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stat.value}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* 3. Patient Directory Data Grid */}
//       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//         <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
//           <h3 className="font-bold text-slate-900">Recent Intakes</h3>
//           <div className="relative">
//             <Search className="absolute left-3 top-3 text-slate-400" size={16} />
//             <input 
//               type="text" 
//               placeholder="Search by ID or name..." 
//               className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:ring-2 focus:ring-teal-500 outline-none"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//         </div>

//         {/* Empty State placeholder - Ready for your next data-grid component */}
//         <div className="py-20 text-center">
//           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Users className="text-slate-300" size={24} />
//           </div>
//           <p className="text-slate-500 font-bold text-sm">No recent intakes found.</p>
//           <p className="text-slate-400 text-xs mt-1">Start by adding a new patient intake above.</p>
//         </div>
//       </div>
//     </div>
//   );
// }