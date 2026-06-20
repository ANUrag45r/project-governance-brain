"use client";

import { useState } from 'react';

export default function SkillsPage() {
  const [skills, setSkills] = useState([
    {
      id: 1,
      name: "Weekly Report Generator",
      description: "Automatically synthesizes all meeting data from the past 7 days into a comprehensive PDF report for stakeholders.",
      version: "v2.1.0",
      author: "GStack Core",
      enabled: true,
      color: "from-blue-500 to-cyan-400"
    },
    {
      id: 2,
      name: "Risk Analyzer",
      description: "Scans meeting transcripts to identify potential project blockers and automatically assigns them severity scores.",
      version: "v1.4.2",
      author: "Hermes Team",
      enabled: true,
      color: "from-orange-500 to-red-400"
    },
    {
      id: 3,
      name: "Daily Action Tracker",
      description: "Sends daily morning summaries of all open and overdue actions directly to Microsoft Teams channels.",
      version: "v1.0.5",
      author: "Community",
      enabled: false,
      color: "from-purple-500 to-indigo-400"
    },
    {
      id: 4,
      name: "Jira Sync",
      description: "Automatically creates Jira tickets for newly identified actions and links them back to the governing meeting.",
      version: "v0.9.0-beta",
      author: "GStack Labs",
      enabled: false,
      color: "from-sky-400 to-blue-600"
    },
    {
      id: 5,
      name: "Meeting Summarizer",
      description: "Generates quick 3-bullet-point summaries for every meeting over 30 minutes long.",
      version: "v3.0.0",
      author: "Hermes Team",
      enabled: true,
      color: "from-emerald-400 to-teal-500"
    }
  ]);

  const toggleSkill = (id: number) => {
    setSkills(skills.map(skill => 
      skill.id === id ? { ...skill, enabled: !skill.enabled } : skill
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Skills Marketplace</h1>
          <p className="text-gray-400 mt-2">Discover and manage GStack automated workflows.</p>
        </div>
        <div className="flex space-x-3">
          <input 
            type="text" 
            placeholder="Search skills..." 
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <div key={skill.id} className={`rounded-2xl border ${skill.enabled ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5'} p-6 backdrop-blur-sm transition-all flex flex-col h-full relative overflow-hidden group hover:border-white/20`}>
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${skill.color} opacity-20 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none ${skill.enabled ? 'opacity-30' : 'opacity-10 grayscale'}`}></div>
            
            <div className="flex justify-between items-start mb-4 z-10">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${skill.color} p-[1px] shadow-lg`}>
                  <div className="w-full h-full bg-black/80 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg font-bold">⌘</span>
                  </div>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${skill.enabled ? 'text-white' : 'text-gray-400'}`}>{skill.name}</h3>
                  <span className="text-xs text-gray-500 font-mono">{skill.version}</span>
                </div>
              </div>
            </div>
            
            <p className={`text-sm mb-8 flex-grow z-10 ${skill.enabled ? 'text-gray-300' : 'text-gray-500'}`}>
              {skill.description}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto z-10">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Author:</span>
                <span className="text-xs font-medium text-gray-400">{skill.author}</span>
              </div>
              
              <button 
                onClick={() => toggleSkill(skill.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black ${
                  skill.enabled ? 'bg-blue-500' : 'bg-white/10'
                }`}
              >
                <span className="sr-only">Enable {skill.name}</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    skill.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
