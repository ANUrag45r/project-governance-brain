"use client";

import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm Hermes, your Project Governance Brain. I have indexed all your Teams meetings, decisions, actions, and risks. What would you like to know?"
    }
  ]);
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
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    const newMessages = [
      ...messages,
      { id: messages.length + 1, role: "user", content: text }
    ];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      let response = "I couldn't find specific information about that in the recent meetings.";
      
      const lowerText = text.toLowerCase();
      if (lowerText.includes("sprint 12")) {
        response = "During Sprint 12 Planning on Oct 24:\n- **Decisions**: Use OAuth2 for authentication, Proceed with PostgreSQL 15 migrations.\n- **Actions**: Bob is scaffolding Auth, Charlie is drafting schema migrations.\n- **Risks**: Tight deadline for Auth module (High Severity).";
      } else if (lowerText.includes("oauth")) {
        response = "Regarding OAuth, the team decided to use **OAuth2** for authentication during the Sprint 12 Planning meeting on Oct 24. Bob is currently assigned to set up the Auth scaffolding and it is marked as 'In Progress'.";
      } else if (lowerText.includes("overdue actions")) {
        response = "There is currently 1 overdue action:\n- **Fix frontend pipeline** assigned to **Bob** (Due: Oct 19, 2026 - from Weekly Sync).";
      } else if (lowerText.includes("high severity")) {
        response = "There are 2 active high severity risks:\n1. Tight deadline for Auth module (Sprint 12 Planning)\n2. Frontend release might be delayed (Weekly Sync)";
      }

      setMessages([...newMessages, { id: newMessages.length + 1, role: "assistant", content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Hermes Chat</h1>
          <p className="text-gray-400 mt-1">Query your organizational memory.</p>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-grow overflow-y-auto bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 backdrop-blur-sm flex flex-col space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
                {/* Basic pseudo-markdown bold rendering for mock responses */}
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

      {/* Suggested Queries */}
      <div className="flex flex-wrap gap-2 mb-4">
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

      {/* Input Area */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          placeholder="Ask Hermes about decisions, actions, or risks..."
          className="w-full bg-black/40 border border-white/20 rounded-xl pl-4 pr-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-md shadow-2xl transition-all"
        />
        <button 
          onClick={() => handleSend(input)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19V6m0 0l-7 7m7-7l7 7"></path></svg>
        </button>
      </div>
    </div>
  );
}
