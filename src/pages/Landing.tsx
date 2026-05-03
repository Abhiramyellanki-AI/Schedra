import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { BookOpen, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleSignIn = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Sign-in error:', error);
      setError(error.message || 'Authentication failed. Please ensure popups are permitted.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans p-6 relative">
      <div className="mesh-bg"></div>
      <div className="max-w-4xl w-full text-center z-10">
        <h1 className="text-6xl font-bold tracking-tight mb-4"><span className="accent-text">Schedra</span></h1>
        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light">
          Centralised classroom productivity platform. Organize your evaluations, schedules, and resources without the chaos of scattered chat groups.
        </p>

        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={handleSignIn}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            Continue with Google
          </button>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg max-w-md text-sm text-left">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
          <div className="glass-card p-8">
            <CalendarIcon className="w-8 h-8 mb-4 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white mb-2">Centralized Calendar</h3>
            <p className="text-slate-400 text-sm">Keep track of all upcoming tests, assignments, and submissions in one place, managed by your CR.</p>
          </div>
          <div className="glass-card p-8">
            <BookOpen className="w-8 h-8 mb-4 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white mb-2">Drive Integration</h3>
            <p className="text-slate-400 text-sm">Quick access to shared class resources, slides, and notes directly from the dashboard.</p>
          </div>
          <div className="glass-card p-8">
            <MessageSquare className="w-8 h-8 mb-4 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white mb-2">AI Chat Assistant</h3>
            <p className="text-slate-400 text-sm">Ask questions like "When is my next test?" and get instant answers based on your classroom calendar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
