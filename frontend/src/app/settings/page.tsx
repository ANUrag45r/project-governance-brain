"use client";

import { useState } from 'react';

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState([
    {
      id: "azure-ad",
      name: "Azure AD / MS Graph",
      description: "Core authentication and organizational structure mapping.",
      connected: true,
      lastSync: "Oct 24, 2026 09:30 AM",
      icon: "🔑",
      color: "from-blue-600 to-indigo-500",
      syncKey: "azure-sync"
    },
    {
      id: "ms-teams",
      name: "Microsoft Teams",
      description: "Automatic recording ingestion, transcript extraction, and channel notifications.",
      connected: false,
      lastSync: "Never",
      icon: "💬",
      color: "from-indigo-500 to-purple-600",
      syncKey: "teams-sync"
    },
    {
      id: "outlook-calendar",
      name: "Outlook Calendar & Email",
      description: "Meeting schedule tracking, participant mapping, email threads, and context generation.",
      connected: false,
      lastSync: "Never",
      icon: "📅",
      color: "from-sky-500 to-blue-400",
      syncKey: "outlook-sync"
    }
  ]);

  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Integrations');
  const [syncAlert, setSyncAlert] = useState<string | null>(null);

  const handleConnect = async (id: string, syncKey: string, isConnected: boolean) => {
    setIsConnecting(id);
    setSyncAlert(null);

    // If we are connecting, let's trigger a backend simulated sync to load MS Graph data!
    if (!isConnected && syncKey !== "azure-sync") {
      try {
        const res = await fetch('http://localhost:8000/api/integrations/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: syncKey })
        });
        
        if (res.ok) {
          const data = await res.json();
          setSyncAlert(`Success: Synced and analyzed "${data.synced.join(', ')}"!`);
        }
      } catch (err) {
        console.error("Failed to sync integration:", err);
      }
    }

    setTimeout(() => {
      setIntegrations(integrations.map(int => 
        int.id === id 
          ? { ...int, connected: !int.connected, lastSync: !int.connected ? "Just now" : "Never" } 
          : int
      ));
      setIsConnecting(null);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white tracking-tight mb-2">Settings</h1>
        <p className="text-zinc-550 dark:text-gray-400">Manage your integrations, preferences, and workspace configuration.</p>
      </div>

      {/* Sync Status Alert Banner */}
      {syncAlert && (
        <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-200 px-6 py-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🚀</span>
            <p className="text-sm font-semibold">{syncAlert}</p>
          </div>
          <button onClick={() => setSyncAlert(null)} className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-white text-xs cursor-pointer font-bold">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-white/10 mb-6">
        {['Integrations', 'Workspace', 'Notifications'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 border-b-2 font-semibold text-sm transition-colors cursor-pointer ${
              activeTab === tab 
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-zinc-500 dark:text-gray-400 hover:text-zinc-800 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Integrations' && (
        <div className="space-y-6">
          <div className="bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-sm">
            <h2 className="text-xl font-bold text-zinc-800 dark:text-white mb-6">Microsoft Ecosystem</h2>
            
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-white/5 rounded-xl p-5 hover:bg-zinc-200/20 dark:hover:bg-white/5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                  
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-tr ${integration.color} flex items-center justify-center text-xl shadow-lg shadow-black/30`}>
                      {integration.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-zinc-800 dark:text-gray-200">{integration.name}</h3>
                        {integration.connected ? (
                          <span className="px-2 py-0.5 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded">Connected</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] uppercase font-bold text-zinc-500 dark:text-gray-400 bg-zinc-200/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded">Disconnected</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-650 dark:text-gray-400 leading-relaxed">{integration.description}</p>
                      {integration.connected && (
                        <p className="text-xs text-zinc-500 dark:text-gray-500 mt-2 font-mono">Last synced: {integration.lastSync}</p>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex justify-end">
                    <button 
                      onClick={() => handleConnect(integration.id, integration.syncKey, integration.connected)}
                      disabled={isConnecting === integration.id}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all w-full md:w-auto flex justify-center items-center cursor-pointer shadow-sm ${
                        integration.connected 
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20' 
                          : 'bg-zinc-200/50 dark:bg-white/10 text-zinc-800 dark:text-white border border-zinc-300 dark:border-white/20 hover:bg-zinc-350 dark:hover:bg-white/20'
                      }`}
                    >
                      {isConnecting === integration.id ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        integration.connected ? 'Disconnect' : 'Connect & Sync'
                      )}
                    </button>
                  </div>
                  
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-sm">
            <h2 className="text-xl font-bold text-zinc-800 dark:text-white mb-2">Agent Configuration</h2>
            <p className="text-sm text-zinc-550 dark:text-gray-400 mb-6">Manage global settings for Hermes and GStack autonomous agents.</p>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-gray-200">Auto-Summary Generation</h3>
                  <p className="text-xs text-zinc-500 dark:text-gray-500 mt-1">Automatically trigger Hermes to summarize meetings as soon as transcripts are uploaded.</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500 focus:outline-none cursor-pointer">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                </button>
              </div>
              
              <div className="border-t border-zinc-200 dark:border-white/5 pt-6 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-gray-200">Strict Permission Scoping</h3>
                  <p className="text-xs text-zinc-500 dark:text-gray-500 mt-1">Require explicit user approval before GStack agents can assign tasks or mutate Jira tickets.</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 dark:bg-white/10 focus:outline-none cursor-pointer">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Workspace' && (
        <div className="bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-sm">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-white mb-6">Workspace Configuration</h2>
          <p className="text-zinc-550 dark:text-gray-400 mb-8">Configure your project environment and team permissions.</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-650 dark:text-gray-300 mb-2">Project Name</label>
              <input type="text" defaultValue="Hermes Project Governance" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-zinc-650 dark:text-gray-300 mb-2">Default Timezone</label>
              <select className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                <option>UTC (Coordinated Universal Time)</option>
                <option>EST (Eastern Standard Time)</option>
                <option>PST (Pacific Standard Time)</option>
              </select>
            </div>

            <div className="pt-4">
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold cursor-pointer">
                Save Workspace Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Notifications' && (
        <div className="bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-sm">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-white mb-6">Notification Preferences</h2>
          <p className="text-zinc-550 dark:text-gray-400 mb-8">Control how and when you receive updates from Hermes.</p>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-gray-200">Email Notifications</h3>
                <p className="text-xs text-zinc-550 dark:text-gray-500 mt-1">Receive daily digests and weekly reports via email.</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500 focus:outline-none cursor-pointer">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
              </button>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-gray-200">Teams Direct Messages</h3>
                <p className="text-xs text-zinc-550 dark:text-gray-500 mt-1">Hermes will ping you on MS Teams when an action is assigned to you.</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500 focus:outline-none cursor-pointer">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-gray-200">Browser Push Notifications</h3>
                <p className="text-xs text-zinc-550 dark:text-gray-500 mt-1">Get desktop alerts for high-severity risks.</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 dark:bg-white/10 focus:outline-none cursor-pointer">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
