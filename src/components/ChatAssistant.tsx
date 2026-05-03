import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { db, handleFirestoreError, OperationType, Timestamp } from '../lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function ChatAssistant({ classroomId }: { classroomId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello! I'm Schedra's AI assistant. Ask me anything about your upcoming evaluations, schedule, or subjects." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Fetch current calendar data to inject as context
      const q = query(collection(db, `classrooms/${classroomId}/evaluations`));
      const snapshot = await getDocs(q);
      const evals = snapshot.docs.map(doc => doc.data());
      
      const calendarContext = evals.map(e => {
        const dateVal = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
        return `- Subject: ${e.subject}, Marks: ${e.marks}, Date: ${dateVal.toLocaleString()}, Type: ${e.type || 'Exam'} ${e.description ? `(Info: ${e.description})` : ''}`;
      }).join("\n") || "No evaluations scheduled currently.";

      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are a helpful AI assistant for a classroom productivity app called "Schedra". 
Your job is to answer the student's questions accurately based ONLY on the classroom data provided below.
If the answer is not in the data, state that you don't know based on the current schedule.
Current date/time: ${new Date().toLocaleString()}

Here is the current classroom evaluations schedule:
${calendarContext}`
      });

      const chat = model.startChat({
        history: messages.slice(1).map(m => ({
          role: m.role,
          parts: [{ text: m.content }],
        })),
      });

      const result = await chat.sendMessage(userQuery);
      const response = await result.response;
      const answer = response.text() || "I'm sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'model', content: answer }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I ran into an error connecting to my brain. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel flex flex-col h-full border-white/10 relative overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 flex-shrink-0" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Schedra AI</h3>
            <p className="text-xs text-slate-400">Powered by Gemini</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'user' ? null : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 mt-1">
                <Bot className="w-4 h-4 flex-shrink-0" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600/20 border-indigo-500/30 text-white rounded-tr-sm border' : 'glass-card text-slate-300 rounded-tl-sm'}`}>
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <div className="markdown-body prose prose-sm max-w-none prose-invert">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-card rounded-tl-sm px-5 py-4 flex items-center">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="shrink-0 h-1" />
      </div>

      <div className="p-4 border-t border-white/5 mt-auto shrink-0 z-10 bg-[#0f172a]/50 backdrop-blur-md">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask about exams..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-500"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors p-2"
          >
            <Send className="w-5 h-5 flex-shrink-0" />
          </button>
        </form>
      </div>
    </div>
  );
}
