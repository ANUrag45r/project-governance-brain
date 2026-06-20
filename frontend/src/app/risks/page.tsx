"use client";
import { useState, useEffect } from 'react';

export default function RisksPage() {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/risks')
      .then(res => res.json())
      .then(data => {
        setRisks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching risks:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-zinc-550 dark:text-white text-center py-20 animate-pulse font-medium">Loading risks...</div>;
  }

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case "High": return "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30";
      case "Medium": return "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "Low": return "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30";
      default: return "text-zinc-500 dark:text-gray-400 bg-white/5 border-white/10";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white tracking-tight">Project Risks</h1>
        <button className="px-4 py-2 bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 text-zinc-800 dark:text-white rounded-lg transition-all shadow-sm cursor-pointer">
          Sort by Severity
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl bg-white/40 dark:bg-white/5 border border-red-500/20 p-6 backdrop-blur-sm shadow-sm">
          <p className="text-sm font-medium text-zinc-500 dark:text-gray-400 mb-2">High Severity</p>
          <p className="text-4xl font-bold text-red-600 dark:text-red-400">{risks.filter(r => r.severity === "High" && r.status === "Active").length}</p>
        </div>
        <div className="rounded-2xl bg-white/40 dark:bg-white/5 border border-orange-500/20 p-6 backdrop-blur-sm shadow-sm">
          <p className="text-sm font-medium text-zinc-500 dark:text-gray-400 mb-2">Medium Severity</p>
          <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">{risks.filter(r => r.severity === "Medium" && r.status === "Active").length}</p>
        </div>
        <div className="rounded-2xl bg-white/40 dark:bg-white/5 border border-emerald-500/20 p-6 backdrop-blur-sm shadow-sm">
          <p className="text-sm font-medium text-zinc-500 dark:text-gray-400 mb-2">Mitigated Risks</p>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{risks.filter(r => r.status === "Mitigated").length}</p>
        </div>
      </div>

      <div className="space-y-4">
        {risks.map((risk) => (
          <div key={risk.id} className={`rounded-xl border ${risk.status === "Mitigated" ? "bg-zinc-100/50 dark:bg-white/5 border-zinc-200 dark:border-white/5 opacity-60" : "bg-white/60 dark:bg-black/20 border-zinc-200 dark:border-white/10"} p-5 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
            <div className="flex items-start space-x-4">
              <div className={`mt-1.5 flex-shrink-0 w-3 h-3 rounded-full ${risk.severity === 'High' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : risk.severity === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
              <div>
                <p className={`text-sm leading-relaxed ${risk.status === "Mitigated" ? "line-through text-zinc-400 dark:text-gray-500" : "font-semibold text-zinc-800 dark:text-zinc-200"}`}>
                  {risk.description}
                </p>
                <div className="flex items-center space-x-3 mt-2 text-xs text-zinc-500 dark:text-gray-500">
                  <span className="flex items-center"><span className="mr-1">📅</span> Detected: {risk.detected}</span>
                  <span>•</span>
                  <span className="flex items-center"><span className="mr-1">🤝</span> Source: {risk.meeting}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 self-end md:self-auto">
              <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded border ${getSeverityColor(risk.severity)}`}>
                {risk.severity}
              </span>
              <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded border ${risk.status === 'Mitigated' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-zinc-600 dark:text-gray-400 bg-zinc-200/50 dark:bg-white/5 border-zinc-300 dark:border-white/10'}`}>
                {risk.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
