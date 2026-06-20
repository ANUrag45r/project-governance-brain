export default function ReportsPage() {
  const reports = [
    {
      id: 1,
      type: "Weekly Report",
      dateRange: "Oct 19 - Oct 25, 2026",
      healthScore: 92,
      summary: "This week showed excellent progress in the backend microservices architecture design. We successfully completed 12 actions across 4 meetings. No major risks emerged, although the frontend deployment pipeline requires attention next week.",
      metrics: {
        meetings: 4,
        decisions: 8,
        completedActions: 12,
        newRisks: 1
      }
    },
    {
      id: 2,
      type: "Sprint 11 Report",
      dateRange: "Oct 5 - Oct 18, 2026",
      healthScore: 85,
      summary: "Sprint 11 concluded with most features delivered on time. The database migrations took slightly longer than estimated. Overall team velocity remains stable.",
      metrics: {
        meetings: 7,
        decisions: 15,
        completedActions: 28,
        newRisks: 3
      }
    },
    {
      id: 3,
      type: "Weekly Report",
      dateRange: "Sep 28 - Oct 4, 2026",
      healthScore: 78,
      summary: "A challenging week due to unexpected downtime in the staging environment. Team shifted focus to resolve the CI/CD pipeline issues.",
      metrics: {
        meetings: 5,
        decisions: 6,
        completedActions: 8,
        newRisks: 4
      }
    }
  ];

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 80) return "text-blue-400";
    if (score >= 70) return "text-orange-400";
    return "text-red-400";
  };

  const getHealthBg = (score: number) => {
    if (score >= 90) return "from-emerald-500/20 to-teal-500/5 border-emerald-500/30";
    if (score >= 80) return "from-blue-500/20 to-cyan-500/5 border-blue-500/30";
    if (score >= 70) return "from-orange-500/20 to-amber-500/5 border-orange-500/30";
    return "from-red-500/20 to-rose-500/5 border-red-500/30";
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Reports</h1>
        <button className="px-4 py-2 bg-blue-600/80 hover:bg-blue-500/80 text-white rounded-lg transition-all border border-blue-400/30 flex items-center space-x-2">
          <span>Generate New Report</span>
        </button>
      </div>

      <div className="space-y-6">
        {reports.map((report) => (
          <div key={report.id} className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm hover:bg-white/10 transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${getHealthBg(report.healthScore).split(' ')[0]} opacity-30 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none`}></div>
            
            <div className="flex-grow space-y-4 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h2 className="text-xl font-semibold text-white">{report.type}</h2>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-black/30 px-2 py-1 rounded-md border border-white/5">
                      {report.dateRange}
                    </span>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-white transition-colors p-2 bg-black/20 rounded-lg border border-white/5 flex items-center space-x-2 group">
                  <svg className="w-4 h-4 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  <span className="text-xs font-medium">Download PDF</span>
                </button>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed max-w-3xl">
                {report.summary}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-2xl font-semibold text-white">{report.metrics.meetings}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Meetings</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{report.metrics.decisions}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Decisions</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{report.metrics.completedActions}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Completed Actions</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{report.metrics.newRisks}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">New Risks</p>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center justify-center md:w-48 md:border-l border-white/10 md:pl-6 z-10">
              <div className={`flex flex-col items-center justify-center w-32 h-32 rounded-full bg-gradient-to-tr ${getHealthBg(report.healthScore)} border shadow-lg`}>
                <p className="text-[10px] text-white/70 uppercase tracking-widest mb-1">Health</p>
                <p className={`text-4xl font-bold ${getHealthColor(report.healthScore)}`}>{report.healthScore}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
