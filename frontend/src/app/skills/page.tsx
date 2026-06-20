"use client";

import { useEffect, useState } from 'react';

export default function SkillsPage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSkills = () => {
    fetch('http://localhost:8000/api/skills')
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching skills:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const toggleSkill = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/skills/${id}/toggle`, {
        method: 'POST'
      });
      if (res.ok) {
        setSkills(skills.map(skill => 
          skill.id === id ? { ...skill, enabled: !skill.enabled } : skill
        ));
      }
    } catch (err) {
      console.error("Failed to toggle skill:", err);
    }
  };

  if (loading && skills.length === 0) {
    return <div className="text-zinc-550 dark:text-white text-center py-20 animate-pulse font-medium">Loading skills...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-white tracking-tight">Skills Marketplace</h1>
          <p className="text-zinc-550 dark:text-gray-400 mt-2">Discover and manage GStack automated workflows.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <div key={skill.id} className={`rounded-2xl border ${skill.enabled ? 'bg-white/40 dark:bg-white/5 border-zinc-200 dark:border-white/10 shadow-sm' : 'bg-zinc-150/40 dark:bg-black/20 border-zinc-200 dark:border-white/5 opacity-70'} p-6 backdrop-blur-sm transition-all flex flex-col h-full relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/20 hover:shadow-md`}>
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${skill.color} opacity-10 dark:opacity-20 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none ${skill.enabled ? 'opacity-20 dark:opacity-30' : 'opacity-5 grayscale'}`}></div>
            
            <div className="flex justify-between items-start mb-4 z-10">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${skill.color} p-[1px] shadow-md`}>
                  <div className="w-full h-full bg-zinc-100 dark:bg-black/80 rounded-xl flex items-center justify-center">
                    <span className="text-zinc-800 dark:text-white text-lg font-bold">⌘</span>
                  </div>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${skill.enabled ? 'text-zinc-800 dark:text-white' : 'text-zinc-500 dark:text-gray-400'}`}>{skill.name}</h3>
                  <span className="text-xs text-zinc-500 dark:text-gray-500 font-mono font-bold">{skill.version}</span>
                </div>
              </div>
            </div>
            
            <p className={`text-sm mb-8 flex-grow z-10 leading-relaxed ${skill.enabled ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500 dark:text-gray-500'}`}>
              {skill.description}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-white/5 mt-auto z-10">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-zinc-500 dark:text-gray-500 font-medium">Author:</span>
                <span className="text-xs font-semibold text-zinc-600 dark:text-gray-400">{skill.author}</span>
              </div>
              
              <button 
                onClick={() => toggleSkill(skill.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-100 dark:focus:ring-offset-black cursor-pointer ${
                  skill.enabled ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-white/10'
                }`}
              >
                <span className="sr-only">Enable {skill.name}</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${
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
