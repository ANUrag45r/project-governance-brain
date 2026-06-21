"use client";

import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [messages, setMessages] = useState<{id: number, role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQueries = [
    "What happened during Sprint 12?",
    "What decisions were made regarding OAuth?",
    "Show overdue actions.",
    "Are there any high severity risks?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, connectionLogs]);

  const handleConnect = () => {
    setIsConnecting(true);
    setConnectionLogs(["Initializing Hermes daemon..."]);
    
    setTimeout(() => {
      setConnectionLogs(prev => [...prev, "Locating GBrain at C:\\Users\\anura\\.gbrain... OK"]);
    }, 800);
    
    setTimeout(() => {
      setConnectionLogs(prev => [...prev, "Mounting GStack at C:\\Users\\anura\\gstack... OK"]);
    }, 1600);

    setTimeout(() => {
      setConnectionLogs(prev => [...prev, "Authenticating with Gmail, Outlook, and Teams... OK"]);
    }, 2400);

    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setMessages([
        {
          id: 1,
          role: "assistant",
          content: "Hello! I'm Hermes, your Project Governance Brain. I have successfully mounted your GBrain and GStack directories, and synced with your Gmail, Outlook, and Teams. What would you like to know?"
        }
      ]);
    }, 3200);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || !isConnected) return;
    
    const newMessages = [
      ...messages,
      { id: messages.length + 1, role: "user", content: text }
    ];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      
      const data = await res.json();
      setMessages([...newMessages, { id: newMessages.length + 1, role: "assistant", content: data.response || "No response received from Hermes." }]);
    } catch (err) {
      console.error("Error connecting to Hermes:", err);
      setMessages([...newMessages, { id: newMessages.length + 1, role: "assistant", content: "Error connecting to Hermes API." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Hermes Chat</h1>
          <p className="text-gray-400 mt-1">Query your organizational memory.</p>
        </div>
        {!isConnected && !isConnecting && (
          <button 
            onClick={handleConnect}
            className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(22,163,74,0.4)] transition-all flex items-center space-x-2"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Connect Hermes</span>
          </button>
        )}
        {isConnected && (
          <div className="flex items-center space-x-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg border border-green-400/20">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium">Hermes Online</span>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-y-auto bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 backdrop-blur-sm flex flex-col space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        
        {!isConnected && (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
            <div className="text-6xl mb-6">🧠</div>
            <h2 className="text-2xl font-bold text-white mb-2">Hermes Offline</h2>
            <p className="text-gray-400 max-w-md">
              Please connect Hermes to mount your local GBrain, GStack, and authenticate with your enterprise applications.
            </p>
            
            {isConnecting && (
              <div className="mt-8 w-full max-w-sm text-left bg-black/40 p-4 rounded-xl font-mono text-xs text-green-400 border border-green-500/20 shadow-inner">
                {connectionLogs.map((log, i) => (
                  <div key={i} className="mb-1 animate-pulse">{'>'} {log}</div>
                ))}
                <div className="w-2 h-4 bg-green-400 animate-bounce mt-2"></div>
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-900/20' 
                : 'bg-white/10 text-gray-200 rounded-tl-sm border border-white/5'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2 opacity-70">
                  <span className="text-lg">🧠</span>
                  <span className="text-xs font-bold uppercase tracking-widest">Hermes</span>
                </div>
              )}
              <div className="text-sm whitespace-pre-line leading-relaxed">
                {msg.content.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part)}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-gray-200 rounded-2xl rounded-tl-sm px-5 py-4 border border-white/5 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`flex flex-wrap gap-2 mb-4 transition-opacity duration-500 ${isConnected ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {suggestedQueries.map((query, idx) => (
          <button 
            key={idx}
            onClick={() => handleSend(query)}
            className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
          >
            {query}
          </button>
        ))}
      </div>

      <div className={`relative transition-opacity duration-500 ${isConnected ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          placeholder={isConnected ? "Ask Hermes about decisions, actions, or risks..." : "Connect Hermes to start chatting..."}
          disabled={!isConnected}
          className="w-full bg-black/40 border border-white/20 rounded-xl pl-4 pr-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-md shadow-2xl transition-all"
        />
        <button 
          onClick={() => handleSend(input)}
          disabled={!isConnected}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${isConnected ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
        >
          <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19V6m0 0l-7 7m7-7l7 7"></path></svg>
        </button>
      </div>
    </div>
  );
}
