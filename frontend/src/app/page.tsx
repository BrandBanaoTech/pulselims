import Link from "next/link";
import { 
  HeartPulse, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Activity, 
  Microscope, 
  FileText, 
  Zap,
  BarChart3,
  Users
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* ================= STICKY NAVBAR ================= */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-sm shadow-teal-600/20">
              <HeartPulse className="text-white" size={24} />
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">PulseLIMS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
            <Link href="#features" className="hover:text-teal-600 transition-colors">Features</Link>
            <Link href="#compliance" className="hover:text-teal-600 transition-colors">Compliance</Link>
            <Link href="#pricing" className="hover:text-teal-600 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10 hover:shadow-lg">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
        </div>

        <div className="px-6 text-center max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100/50 text-teal-700 border border-teal-200/50 rounded-full text-xs font-bold mb-8 uppercase tracking-widest shadow-sm">
            <Activity size={14} /> 
            <span>Next-Gen Laboratory Intelligence</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]">
            The intelligent OS for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">
              modern clinical labs
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Streamline patient intake, automate test results, and manage your laboratory with enterprise-grade precision, speed, and HIPAA compliance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 flex items-center justify-center gap-2 text-lg">
              Start your free trial <ArrowRight size={18} />
            </Link>
            <Link href="/demo" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 text-lg shadow-sm">
              Book a Demo
            </Link>
          </div>
        </div>

        {/* Browser Mockup / Dashboard Preview */}
        <div className="max-w-6xl mx-auto px-6 mt-20 relative z-10 hidden md:block">
          <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-sm p-2 shadow-2xl shadow-slate-200/50">
            <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
              {/* Fake Browser Header */}
              <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                </div>
                <div className="mx-auto w-64 h-6 bg-white border border-slate-200 rounded-md"></div>
              </div>
              {/* Fake Dashboard Body */}
              <div className="p-8 grid grid-cols-4 gap-6 bg-slate-50/50">
                <div className="col-span-1 space-y-4">
                  <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
                  <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
                  <div className="h-4 w-28 bg-slate-100 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-slate-100 rounded animate-pulse"></div>
                </div>
                <div className="col-span-3 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-white border border-slate-100 rounded-xl shadow-sm"></div>
                    <div className="h-24 bg-white border border-slate-100 rounded-xl shadow-sm"></div>
                    <div className="h-24 bg-white border border-slate-100 rounded-xl shadow-sm"></div>
                  </div>
                  <div className="h-64 bg-white border border-slate-100 rounded-xl shadow-sm p-6 flex flex-col justify-between">
                    <div className="h-4 w-48 bg-slate-100 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-teal-50 rounded"></div>
                      <div className="h-2 w-5/6 bg-teal-50 rounded"></div>
                      <div className="h-2 w-4/6 bg-teal-50 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= SOCIAL PROOF ================= */}
      <section className="border-y border-slate-200/60 bg-white py-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">
            Trusted by modern diagnostic centers across the country
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
            {/* Replace these with actual client logos if you have them */}
            <h2 className="text-xl font-black text-slate-800">CityPath Labs</h2>
            <h2 className="text-xl font-black text-slate-800">Nova Diagnostics</h2>
            <h2 className="text-xl font-black text-slate-800">Apex Clinical</h2>
            <h2 className="text-xl font-black text-slate-800">BioSync Healthcare</h2>
          </div>
        </div>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section id="features" className="px-6 py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Everything you need to run a world-class lab
            </h2>
            <p className="text-slate-600 text-lg">
              Say goodbye to spreadsheets and fragmented software. PulseLIMS unifies your entire clinical workflow into one beautiful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                title: "Automated Workflows", 
                desc: "Connect directly to your analyzers. Auto-validate normal results and flag anomalies instantly.", 
                icon: Zap 
              },
              { 
                title: "HIPAA Compliant", 
                desc: "Bank-level AES-256 encryption, strict RBAC, and comprehensive audit trails for every action.", 
                icon: ShieldCheck 
              },
              { 
                title: "Smart Patient Intake", 
                desc: "Reduce wait times with QR-code based registration, digital forms, and instant WhatsApp updates.", 
                icon: Users 
              },
              { 
                title: "Dynamic Reporting", 
                desc: "Generate beautiful, clinical-grade PDF reports with historical trend graphs automatically.", 
                icon: FileText 
              },
              { 
                title: "Quality Control (QC)", 
                desc: "Built-in Levey-Jennings charts and Westgard rules to monitor your instrument calibration.", 
                icon: Microscope 
              },
              { 
                title: "Business Analytics", 
                desc: "Track turnaround times (TAT), daily revenue, and test volumes with real-time dashboards.", 
                icon: BarChart3 
              }
            ].map((feat, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-teal-600 transition-colors duration-300">
                  <feat.icon className="text-teal-600 group-hover:text-white transition-colors duration-300" size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= BOTTOM CTA ================= */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to modernize your laboratory?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join hundreds of modern clinics using PulseLIMS to deliver faster, more accurate results to their patients.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-400 transition-all shadow-lg flex items-center justify-center gap-2 text-lg">
              Create Your Workspace
            </Link>
            <Link href="/contact" className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-lg">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white pt-16 pb-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                  <HeartPulse className="text-white" size={18} />
                </div>
                <span className="text-lg font-extrabold text-slate-900">PulseLIMS</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Empowering clinical laboratories with intelligent, automated, and secure management software.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="#" className="hover:text-teal-600 transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-teal-600 transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-teal-600 transition-colors">Security (HIPAA)</Link></li>
                <li><Link href="#" className="hover:text-teal-600 transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="#" className="hover:text-teal-600 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-teal-600 transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-teal-600 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-teal-600 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="#" className="hover:text-teal-600 transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-teal-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-teal-600 transition-colors">BAA Agreement</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-400">
              © 2026 PulseLIMS Technologies Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-slate-400">
              {/* Placeholder for social icons */}
              <Link href="#" className="hover:text-slate-600 transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-slate-600 transition-colors">LinkedIn</Link>
              <Link href="#" className="hover:text-slate-600 transition-colors">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}