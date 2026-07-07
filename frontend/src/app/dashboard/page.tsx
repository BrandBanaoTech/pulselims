"use client";

import { useState } from "react";
import { Search, Plus, Calendar, Filter, FileText, Users } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // This will eventually be replaced by a real React Query fetch
  const stats = [
    { label: "Today's Intakes", value: "12", icon: Calendar, color: "text-teal-600" },
    { label: "Pending Reports", value: "4", icon: FileText, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage today's clinical operations and patient flow.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/intake" 
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> New Intake
          </Link>
        </div>
      </div>

      {/* 2. Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 bg-slate-50 rounded-xl ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{stat.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Patient Directory Data Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <h3 className="font-bold text-slate-900">Recent Intakes</h3>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by ID or name..." 
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:ring-2 focus:ring-teal-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Empty State placeholder - Ready for your next data-grid component */}
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-slate-300" size={24} />
          </div>
          <p className="text-slate-500 font-bold text-sm">No recent intakes found.</p>
          <p className="text-slate-400 text-xs mt-1">Start by adding a new patient intake above.</p>
        </div>
      </div>
    </div>
  );
}