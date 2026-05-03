import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { BookOpen, Calendar as CalendarIcon, MessageSquare, Mail, Lock, User as UserIcon } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Sign-in error:', error);
      setError(error.message || 'Authentication failed. Please ensure popups are permitted.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Email auth error:', error);
      setError(error.message || 'Failed to authenticate with email.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans p-6 relative bg-slate-950 text-white">
      <div className="mesh-bg absolute inset-0 opacity-20 pointer-events-none"></div>
      <div className="max-w-4xl w-full text-center z-10">
        <h1 className="text-6xl font-bold tracking-tight mb-4"><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Schedra</span></h1>
        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light">
          Centralised classroom productivity platform. Organize your evaluations, schedules, and resources without the chaos of scattered chat groups.
        </p>

        <div className="max-w-md mx-auto w-full glass-card p-8 shadow-2xl border border-white/10 rounded-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-slate-400 text-sm">
              {isSignUp ? 'Sign up with your email to get started.' : 'Sign in to access your classroom.'}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            {isSignUp && (
              <div className="relative text-left">
                <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            )}
            <div className="relative text-left">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                required
              />
            </div>
            <div className="relative text-left">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={emailLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
            >
              {emailLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full bg-white text-slate-950 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl hover:bg-slate-100 transition-all mb-4"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Continue with Google
          </button>

          <p className="text-slate-400 text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-4"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mt-6 text-sm text-center">
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
