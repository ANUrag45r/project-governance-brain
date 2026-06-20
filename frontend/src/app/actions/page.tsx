"use client";
import { useState, useEffect } from 'react';

export default function ActionsPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/actions')
      .then(res => res.json())
      .then(data => {
        setActions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching actions:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-white text-center py-20 animate-pulse">Loading actions...</div>;
  }

  const columns = [
    { name: "Open", color: "bg-blue-500", items: actions.filter(a => a.status === "Open") },
    { name: "In Progress", color: "bg-purple-500", items: actions.filter(a => a.status === "In Progress") },
    { name: "Done", color: "bg-emerald-500", items: actions.filter(a => a.status === "Done") },
    { name: "Overdue", color: "bg-orange-500", items: actions.filter(a => a.status === "Overdue") },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Actions</h1>
        <button className="px-4 py-2 bg-blue-600/80 hover:bg-blue-500/80 text-white rounded-lg transition-all border border-blue-400/30">
          + New Action
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-grow pb-8">
        {columns.map((col) => (
          <div key={col.name} className="flex flex-col bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${col.color}`}></div>
                <h2 className="text-lg font-semibold text-white">{col.name}</h2>
              </div>
              <span className="text-xs font-bold text-gray-400 bg-black/20 px-2 py-1 rounded-full">{col.items.length}</span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {col.items.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-8 italic border border-dashed border-white/10 rounded-xl">
                  No actions
                </div>
              ) : (
                col.items.map((action) => (
                  <div key={action.id} className="bg-black/20 border border-white/5 rounded-xl p-4 hover:bg-white/5 transition-all cursor-grab active:cursor-grabbing group">
                    <p className="text-sm font-medium text-gray-200 mb-3">{action.task}</p>
                    
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500/30 to-pink-500/30 border border-white/10 flex items-center justify-center text-[10px] text-white">
                          {action.owner.charAt(0)}
                        </div>
                        <span className="text-gray-400">{action.owner}</span>
                      </div>
                      <span className={`px-2 py-1 rounded border ${
                        col.name === 'Done' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                        col.name === 'Overdue' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
                        'border-gray-500/30 text-gray-400 bg-gray-500/10'
                      }`}>
                        {action.date}
                      </span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-gray-500 uppercase truncate pr-2 max-w-[120px]" title={action.meeting}>
                        {action.meeting}
                      </span>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
