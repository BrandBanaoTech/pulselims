import Link from "next/link";
import { HeartPulse, CheckCircle2, ShieldCheck, ArrowRight, Activity } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAVIGATION */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
            <HeartPulse className="text-white" size={24} />
          </div>
          <span className="text-xl font-extrabold text-slate-900">PulseLIMS</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-teal-600">Sign In</Link>
          <Link href="/login" className="px-5 py-2.5 bg-slate-900 text-white text-sm font-extrabold rounded-xl hover:bg-slate-800 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="px-8 pt-20 pb-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-bold mb-6">
          <Activity size={14} /> 
          <span>Next-Gen Laboratory Intelligence</span>
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tighter mb-8 leading-[1.1]">
          Modern LIMS for the <br/><span className="text-teal-600">Digital Clinic</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
          Streamline patient intake, automate test results, and manage your laboratory with enterprise-grade precision and speed.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/login" className="px-8 py-4 bg-teal-600 text-white font-extrabold rounded-2xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/30 flex items-center gap-2">
            Request Demo <ArrowRight size={18} />
          </Link>
        </div>
      </header>

      {/* FEATURES GRID */}
      <section className="px-8 py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { title: "Clinical Accuracy", desc: "Automated error-checking and standardized reporting workflows.", icon: CheckCircle2 },
            { title: "HIPAA Compliant", desc: "Enterprise-grade encryption and secure data handling standards.", icon: ShieldCheck },
            { title: "Real-time Sync", desc: "Seamless integration with laboratory analyzers and patient records.", icon: Activity }
          ].map((feat, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-6">
                <feat.icon className="text-teal-600" size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-3">{feat.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-8 py-12 border-t border-slate-100 text-center">
        <p className="text-sm font-bold text-slate-400">© 2026 PulseLIMS Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}

// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         {/* <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         /> */}
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//            PulseLIMS
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//            Coming Soon...
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           {/* <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a> */}
//           {/* <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a> */}
//         </div>
//       </main>
//     </div>
//   );
// }
