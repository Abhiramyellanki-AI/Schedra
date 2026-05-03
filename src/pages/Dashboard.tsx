import React, { useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useActiveClassroom } from '../hooks/useActiveClassroom';
import { LogOut, Calendar, Link as LinkIcon, MessageSquare, Copy, List, X, Bot, Users, Edit2, Check } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import EvaluationsSection from '../components/EvaluationsSection';
import ChatAssistant from '../components/ChatAssistant';
import CalendarSection from '../components/CalendarSection';
import MembersSection from '../components/MembersSection';

export default function Dashboard() {
  const { user } = useAuth();
  const { classroom, member, loading } = useActiveClassroom();
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'members'>('calendar');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [newDriveLink, setNewDriveLink] = useState('');

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">Loading...</div>;
  if (!classroom || !member) return <Navigate to="/join" />;

  const isCR = member.role === 'cr' || classroom.advisorId === user?.uid;

  const copyCode = () => {
    navigator.clipboard.writeText(classroom.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const saveDriveLink = async () => {
    if (!newDriveLink.trim()) return;
    try {
      await updateDoc(doc(db, 'classrooms', classroom.id), {
        driveFolderLink: newDriveLink
      });
      setIsEditingLink(false);
    } catch (e) {
      console.error("Error updating drive link:", e);
    }
  }

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'list': return 'Upcoming Evaluations';
      case 'calendar': return 'Monthly Schedule';
      case 'members': return 'Classroom Members';
      default: return 'Dashboard';
    }
  }

  return (
    <div className="min-h-screen flex p-6 gap-6 font-sans relative text-white">
      <div className="mesh-bg"></div>

      {/* Sidebar */}
      <div className="w-64 glass-panel flex flex-col p-6 sticky top-6 h-[calc(100vh-48px)] shrink-0 z-10">
        <h1 className="text-2xl font-bold tracking-tight mb-8 accent-text">Schedra</h1>
        
        <div className="mb-6 p-4 glass-card border-white/10 relative">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Classroom</p>
          <p className="font-medium truncate text-white">{classroom.name}</p>
          <div className="flex items-center gap-2 mt-2 group cursor-pointer" onClick={copyCode}>
            <p className="font-mono text-sm text-indigo-400">{classroom.joinCode}</p>
            <Copy className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            {copied && <span className="absolute -top-2 right-2 bg-indigo-600 text-[10px] px-1.5 py-0.5 rounded text-white animate-bounce">Copied!</span>}
          </div>
          <p className="text-xs text-slate-500 mt-2 capitalize font-semibold">Role: {member.role}</p>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'calendar' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Calendar className="w-5 h-5" />
            <span>Calendar View</span>
          </button>

          <button 
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'list' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <List className="w-5 h-5" />
            <span>List View</span>
          </button>

          <button 
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'members' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Users className="w-5 h-5" />
            <span>Members</span>
          </button>
          
          {isEditingLink ? (
            <div className="mt-2 flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10 animate-in fade-in zoom-in duration-200">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Resource Link</p>
              <div className="flex gap-2">
                <input 
                  autoFocus
                  type="url" 
                  placeholder="https://drive.google.com/..." 
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  value={newDriveLink}
                  onChange={(e) => setNewDriveLink(e.target.value)}
                />
                <button 
                  onClick={saveDriveLink}
                  className="p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                </button>
                <button 
                  onClick={() => setIsEditingLink(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group/link">
              {classroom.driveFolderLink ? (
                <a 
                  href={classroom.driveFolderLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium text-sm border border-transparent"
                >
                  <LinkIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">Resource Link</span>
                </a>
              ) : isCR ? (
                <button 
                  onClick={() => {
                    setNewDriveLink('');
                    setIsEditingLink(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all font-medium text-sm border border-dashed border-white/10"
                >
                  <LinkIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">Add Resource Link</span>
                </button>
              ) : null}

              {isCR && classroom.driveFolderLink && (
                <button 
                  onClick={() => {
                    setNewDriveLink(classroom.driveFolderLink || '');
                    setIsEditingLink(true);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-slate-900/50 opacity-0 group-hover/link:opacity-100 transition-opacity hover:bg-slate-800"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          )}
        </nav>

        <button onClick={() => auth.signOut()} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-white transition-colors mt-auto font-medium text-sm border border-transparent hover:bg-white/5 rounded-xl">
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto z-10 glass-panel p-8 h-[calc(100vh-48px)]">
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {getHeaderTitle()}
            </h2>
            <p className="text-slate-400 mt-1 text-sm font-medium">
              {activeTab === 'list' ? `View all evaluations in a list.` : activeTab === 'calendar' ? `Plan your month ahead.` : `Manage and view classroom participants.`}
            </p>
          </div>
          
          <div className="flex items-center gap-4 glass-card p-2 pr-4 pl-2 rounded-full border-white/5">
            <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-800" />
            <span className="text-sm font-medium text-slate-300">{user?.displayName}</span>
          </div>
        </header>

        {activeTab === 'list' && (
          <EvaluationsSection isCR={isCR} classroomId={classroom.id} />
        )}

        {activeTab === 'calendar' && (
          <CalendarSection classroomId={classroom.id} />
        )}

        {activeTab === 'members' && (
          <MembersSection classroomId={classroom.id} advisorId={classroom.advisorId} />
        )}
      </main>

      {/* Floating AI Assistant Pop-up */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
        {isChatOpen && (
          <div className="w-[400px] h-[600px] shadow-2xl rounded-3xl overflow-hidden glass-panel border-white/20 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-indigo-600 p-4 px-6 flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <Bot className="w-5 h-5" />
                 <span className="font-bold text-sm tracking-wide">Assistant</span>
               </div>
               <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="h-[calc(600px-60px)]">
              <ChatAssistant classroomId={classroom.id} />
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl ${isChatOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-110 shadow-indigo-600/40'}`}
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}

