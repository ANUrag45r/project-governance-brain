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
    return <div className="text-white text-center py-20 animate-pulse">Loading risks...</div>;
  }

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case "High": return "text-red-400 bg-red-500/10 border-red-500/30";
      case "Medium": return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "Low": return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Project Risks</h1>
        <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg transition-all">
          Sort by Severity
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl bg-white/5 border border-red-500/20 p-6 backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-400 mb-2">High Severity</p>
          <p className="text-4xl font-bold text-red-400">{risks.filter(r => r.severity === "High" && r.status === "Active").length}</p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-orange-500/20 p-6 backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-400 mb-2">Medium Severity</p>
          <p className="text-4xl font-bold text-orange-400">{risks.filter(r => r.severity === "Medium" && r.status === "Active").length}</p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-emerald-500/20 p-6 backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-400 mb-2">Mitigated Risks</p>
          <p className="text-4xl font-bold text-emerald-400">{risks.filter(r => r.status === "Mitigated").length}</p>
        </div>
      </div>

      <div className="space-y-4">
        {risks.map((risk) => (
          <div key={risk.id} className={`rounded-xl border ${risk.status === "Mitigated" ? "bg-white/5 border-white/5 opacity-60" : "bg-black/20 border-white/10"} p-5 backdrop-blur-sm hover:bg-white/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4`}>
            <div className="flex items-start space-x-4">
              <div className={`mt-1 flex-shrink-0 w-3 h-3 rounded-full ${risk.severity === 'High' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : risk.severity === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
              <div>
                <p className={`text-sm ${risk.status === "Mitigated" ? "line-through text-gray-500" : "font-medium text-gray-200"}`}>
                  {risk.description}
                </p>
                <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
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
              <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded border ${risk.status === 'Mitigated' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-gray-400 bg-white/5 border-white/10'}`}>
                {risk.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
