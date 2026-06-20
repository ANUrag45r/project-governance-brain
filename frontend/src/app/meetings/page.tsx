"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTranscript, setNewTranscript] = useState("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const fetchMeetings = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/meetings')
      .then(res => res.json())
      .then(data => {
        setMeetings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching meetings:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleUpload = async () => {
    if (!newTitle || !newTranscript) return;
    setUploadStatus("Starting upload...");
    
    try {
      const response = await fetch('http://localhost:8000/api/meetings/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, transcript: newTranscript })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.replace('data: ', ''));
              setUploadStatus(data.status);
              
              if (data.status === 'Complete') {
                setTimeout(() => {
                  setIsModalOpen(false);
                  setUploadStatus(null);
                  setNewTitle("");
                  setNewTranscript("");
                  fetchMeetings();
                }, 1000);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus("Error during upload.");
    }
  };

  if (loading && meetings.length === 0) {
    return <div className="text-zinc-500 dark:text-white text-center py-20 animate-pulse font-medium">Loading meetings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-white tracking-tight mb-2">Meetings</h1>
          <p className="text-zinc-550 dark:text-gray-400">Review past meetings, decisions, and action items.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium shadow-lg transition-colors flex items-center space-x-2 cursor-pointer"
        >
          <span>+ New Meeting</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Upload Meeting Transcript</h2>
              {!uploadStatus && (
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer text-lg font-bold">
                  ✕
                </button>
              )}
            </div>
            
            {uploadStatus ? (
              <div className="flex flex-col items-center justify-center py-12 flex-1">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                <h3 className="text-lg font-medium text-zinc-850 dark:text-white text-center">{uploadStatus}</h3>
                <p className="text-sm text-zinc-500 dark:text-gray-500 mt-2 text-center">Please wait while GBrain processes the transcript...</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">Meeting Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Q3 Roadmap Planning" 
                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-gray-300 mb-1">Raw Transcript</label>
                  <textarea 
                    rows={8}
                    value={newTranscript}
                    onChange={(e) => setNewTranscript(e.target.value)}
                    placeholder="Paste the raw text transcript here..." 
                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  ></textarea>
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg font-medium text-zinc-500 hover:text-zinc-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium shadow-lg transition-colors cursor-pointer">
                    Upload & Process
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <input 
          type="text" 
          placeholder="Search meetings..." 
          className="bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-850 dark:text-white placeholder-zinc-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64 shadow-sm"
        />
        <button className="px-4 py-2 bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 text-zinc-800 dark:text-white rounded-lg transition-all shadow-sm cursor-pointer">
          Filter
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {meetings.map((meeting) => (
          <Link key={meeting.id} href={`/meetings/${meeting.id}`} className="block h-full cursor-pointer">
            <div className="rounded-2xl bg-white/40 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all flex flex-col h-full group shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-zinc-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{meeting.title}</h3>
                <span className="text-xs text-zinc-500 dark:text-gray-400 bg-zinc-200/50 dark:bg-white/5 px-2 py-1 rounded-md border border-zinc-300/30 dark:border-white/5 font-medium">{meeting.date}</span>
              </div>
              
              <div className="mb-6 flex-grow space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider mb-1">Summary</h4>
                  <p className="text-zinc-700 dark:text-zinc-300 text-sm line-clamp-2 leading-relaxed">{meeting.summary}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider mb-1">Transcript Snippet</h4>
                  <p className="text-zinc-600 dark:text-gray-400 text-xs italic line-clamp-2 font-mono bg-zinc-200/30 dark:bg-black/20 p-2 rounded-md border border-zinc-200 dark:border-white/5">"{meeting.transcript}"</p>
                </div>
              </div>
              
              <div className="space-y-4 mt-auto">
                <div>
                  <p className="text-xs font-semibold text-zinc-550 dark:text-gray-400 uppercase tracking-wider mb-2">Participants</p>
                  <div className="flex space-x-2">
                    {meeting.participants.map((p: string, i: number) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-zinc-300 dark:border-white/10 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-white" title={p}>
                        {p.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-200 dark:border-white/10">
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{meeting.decisions}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-gray-400 font-semibold uppercase">Decisions</p>
                  </div>
                  <div className="text-center border-l border-r border-zinc-200 dark:border-white/10">
                    <p className="text-lg font-bold text-pink-600 dark:text-pink-400">{meeting.actions}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-gray-400 font-semibold uppercase">Actions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{meeting.risks}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-gray-400 font-semibold uppercase">Risks</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
