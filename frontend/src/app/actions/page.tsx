"use client";

import { useState, useEffect } from 'react';

export default function ActionsPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State for New Action
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newStatus, setNewStatus] = useState("Open");

  const fetchActions = () => {
    setLoading(true);
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
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleCycleStatus = async (actionId: number, currentStatus: string) => {
    const statuses = ["Open", "In Progress", "Done", "Overdue"];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    try {
      const res = await fetch(`http://localhost:8000/api/actions/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchActions();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleCreateAction = async () => {
    if (!newTask || !newOwner) return;

    try {
      const res = await fetch('http://localhost:8000/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: newTask,
          owner: newOwner,
          status: newStatus
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewTask("");
        setNewOwner("");
        fetchActions();
      }
    } catch (err) {
      console.error("Failed to create action:", err);
    }
  };

  if (loading && actions.length === 0) {
    return <div className="text-zinc-550 dark:text-white text-center py-20 animate-pulse font-medium">Loading actions...</div>;
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
        <div>
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-white tracking-tight">Actions</h1>
          <p className="text-zinc-550 dark:text-gray-400 mt-1">Assign, track, and cycle action items dynamically.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600/80 hover:bg-blue-500/80 text-white rounded-lg transition-all border border-blue-400/30 font-medium cursor-pointer"
        >
          + New Action
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-zinc-850 dark:text-white font-sans">Create New Action</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-650 dark:text-gray-300 mb-1">Task Description</label>
                <input 
                  type="text" 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="e.g. Integrate Redis Cache" 
                  className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-650 dark:text-gray-300 mb-1">Assignee Owner</label>
                <input 
                  type="text" 
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="e.g. Bob" 
                  className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-650 dark:text-gray-300 mb-1">Initial Status</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg font-medium text-zinc-500 hover:text-zinc-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleCreateAction} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium shadow-lg transition-colors cursor-pointer">
                Create Action
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-grow pb-8">
        {columns.map((col) => (
          <div key={col.name} className="flex flex-col bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 backdrop-blur-sm min-h-[450px] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${col.color}`}></div>
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">{col.name}</h2>
              </div>
              <span className="text-xs font-bold text-zinc-600 dark:text-gray-400 bg-zinc-200/50 dark:bg-black/20 px-2 py-1 rounded-full">{col.items.length}</span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {col.items.length === 0 ? (
                <div className="text-center text-sm text-zinc-400 dark:text-gray-500 py-8 italic border border-dashed border-zinc-300 dark:border-white/10 rounded-xl">
                  No actions
                </div>
              ) : (
                col.items.map((action) => (
                  <div 
                    key={action.id} 
                    className="bg-white/60 dark:bg-black/20 border border-zinc-200 dark:border-white/5 rounded-xl p-4 hover:bg-zinc-200/25 dark:hover:bg-white/5 transition-all group relative cursor-pointer shadow-sm"
                    onClick={() => handleCycleStatus(action.id, action.status)}
                    title="Click card to cycle status"
                  >
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3 leading-relaxed">{action.task}</p>
                    
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500/20 to-pink-500/20 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-800 dark:text-white">
                          {action.owner.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-zinc-500 dark:text-gray-400 font-medium">{action.owner}</span>
                      </div>
                      <span className={`px-2 py-1 rounded border font-mono font-bold text-[10px] ${
                        col.name === 'Done' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' :
                        col.name === 'Overdue' ? 'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10' :
                        col.name === 'In Progress' ? 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10' :
                        'border-zinc-300 dark:border-gray-500/30 text-zinc-650 dark:text-gray-400 bg-zinc-200/50 dark:bg-gray-500/10'
                      }`}>
                        {action.date}
                      </span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-zinc-150 dark:border-white/5 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-zinc-500 dark:text-gray-500 uppercase truncate pr-2 max-w-[120px] font-medium" title={action.meeting}>
                        {action.meeting}
                      </span>
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 group-hover:underline font-bold">Cycle status ↻</span>
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
