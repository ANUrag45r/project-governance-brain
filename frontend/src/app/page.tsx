"use client";

import { useEffect, useState } from 'react';

export default function Home() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !dashboardData) {
    return <div className="text-zinc-500 dark:text-white text-center py-20 animate-pulse font-medium">Loading dashboard...</div>;
  }

  const cards = [
    { title: 'Total Meetings', value: dashboardData.total_meetings, color: 'from-blue-500 to-cyan-400' },
    { title: 'Total Decisions', value: dashboardData.total_decisions, color: 'from-purple-500 to-indigo-400' },
    { title: 'Open Actions', value: dashboardData.open_actions, color: 'from-pink-500 to-rose-400' },
    { title: 'Risks', value: dashboardData.risks_count, color: 'from-orange-500 to-red-400' },
    { title: 'Health Score', value: `${dashboardData.health_score}%`, color: 'from-emerald-500 to-teal-400' },
  ];

  const trends = dashboardData.trends || [];
  const maxMeetings = Math.max(...trends.map((t: any) => t.meetings), 5);
  const chartHeight = 120;
  const chartWidth = 500;
  const padding = 30;

  const points = trends.map((t: any, index: number) => {
    const x = padding + (index * (chartWidth - padding * 2)) / (trends.length - 1 || 1);
    const y = chartHeight - padding - (t.meetings * (chartHeight - padding * 2)) / maxMeetings;
    return { x, y, label: t.month, value: t.meetings };
  });

  const polylinePointsStr = points.map((p: any) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-zinc-800 dark:text-white tracking-tight">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <div key={index} className="relative overflow-hidden rounded-2xl bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 backdrop-blur-sm group hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-sm">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-15 dark:opacity-20 blur-3xl group-hover:opacity-30 dark:group-hover:opacity-40 transition-opacity rounded-full -mr-16 -mt-16`}></div>
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{card.title}</h3>
            <p className="text-3xl font-bold text-zinc-800 dark:text-white mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG Chart for Meeting Trends */}
        <div className="rounded-2xl bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 backdrop-blur-sm flex flex-col justify-between shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-4">Meeting Trends</h3>
          <div className="w-full h-48 bg-zinc-200/20 dark:bg-black/20 rounded-xl p-4 flex items-center justify-center border border-zinc-200/50 dark:border-white/5 relative">
            {trends.length === 0 ? (
              <p className="text-zinc-500 italic text-sm">No data available</p>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="currentColor" className="text-zinc-200/60 dark:text-white/5 stroke-current" strokeDasharray="4" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="currentColor" className="text-zinc-300 dark:text-white/10 stroke-current" />

                {/* Main Trend Line */}
                <polyline
                  fill="none"
                  stroke="url(#chart-grad)"
                  strokeWidth="3"
                  points={polylinePointsStr}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Glow under the line */}
                <path
                  d={`M ${points[0].x} ${chartHeight - padding} L ${polylinePointsStr} L ${points[points.length-1].x} ${chartHeight - padding} Z`}
                  fill="url(#chart-area-grad)"
                  opacity="0.15"
                />

                {/* Point Circles & Tooltips */}
                {points.map((p: any, i: number) => (
                  <g key={i} className="group/dot cursor-pointer">
                    <circle cx={p.x} cy={p.y} r="5" className="fill-blue-500 stroke-white dark:stroke-[#0a0a0a] stroke-2 hover:r-7 transition-all" />
                    <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[10px] font-bold fill-blue-600 dark:fill-blue-300 opacity-0 group-hover/dot:opacity-100 transition-opacity">
                      {p.value}
                    </text>
                    {/* Month Label */}
                    <text x={p.x} y={chartHeight - 10} textAnchor="middle" className="text-[9px] fill-zinc-500 dark:fill-gray-500 font-mono font-bold">
                      {p.label}
                    </text>
                  </g>
                ))}

                {/* Gradients Definition */}
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                  <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#fafafa" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
        </div>

        {/* Recent Activities Panel */}
        <div className="rounded-2xl bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 backdrop-blur-sm min-h-[300px] shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-4">Recent Activities</h3>
          <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
            {dashboardData.recent_activities.length === 0 ? (
              <p className="text-center text-sm text-zinc-550 italic py-10">No recent activity detected.</p>
            ) : (
              dashboardData.recent_activities.map((act: any) => (
                <div key={act.id} className="flex items-center space-x-4 p-3 rounded-xl bg-zinc-200/20 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 hover:bg-zinc-250/20 dark:hover:bg-white/10 transition">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    act.type === 'meeting' ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400' : 'bg-purple-500/20 text-purple-500 dark:text-purple-400'
                  }`}>
                    {act.type === 'meeting' ? '📅' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-800 dark:text-white font-medium truncate">{act.title}</p>
                    <p className="text-xs text-zinc-550 dark:text-gray-400 truncate">{act.subtitle}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-gray-500 whitespace-nowrap font-mono">{act.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
