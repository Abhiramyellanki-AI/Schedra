import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { auth, db, handleFirestoreError, OperationType, doc, setDoc, getDoc, serverTimestamp, writeBatch } from '../lib/firebase';
import { LogOut } from 'lucide-react';

export default function JoinClassroom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [role, setRole] = useState<'student' | 'cr' | 'faculty'>('student');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // For testing: Create a classroom
  const handleCreate = async () => {
    if (!user) return;
    setIsCreating(true);
    setError('');
    const code = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 digit
    try {
      const batch = writeBatch(db);
      const classroomRef = doc(db, 'classrooms', code);
      
      batch.set(classroomRef, {
        id: code,
        joinCode: code,
        name: `${user.displayName}'s Classroom`,
        advisorId: user.uid,
        createdAt: serverTimestamp()
      });

      // Join as creator with selected role
      const memberRef = doc(db, `classrooms/${code}/members/${user.uid}`);
      batch.set(memberRef, {
        classroomId: code,
        userId: user.uid,
        role: role,
        joinedAt: serverTimestamp()
      });

      await batch.commit();

      localStorage.setItem('activeClassroomId', code);
      navigate('/dashboard');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to create classroom');
      if (e.message?.includes('permission')) {
        handleFirestoreError(e, OperationType.CREATE, `classrooms/${code}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || joinCode.length !== 10) {
      setError('Please enter a valid 10-digit code');
      return;
    }
    
    setIsJoining(true);
    setError('');

    try {
      const classroomRef = doc(db, 'classrooms', joinCode);
      const classroomDoc = await getDoc(classroomRef);

      if (!classroomDoc.exists()) {
        setError('Classroom not found');
        setIsJoining(false);
        return;
      }

      // Join with selected role
      const memberRef = doc(db, `classrooms/${joinCode}/members/${user.uid}`);
      const memberDoc = await getDoc(memberRef);

      if (!memberDoc.exists()) {
        await setDoc(memberRef, {
          classroomId: joinCode,
          userId: user.uid,
          role: role,
          joinedAt: serverTimestamp()
        });
      } else {
        // Option to update role if already member? 
        // For now, just allow entering if already member
      }

      localStorage.setItem('activeClassroomId', joinCode);
      navigate('/dashboard');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to join classroom');
      setIsJoining(false);
    }
  };

  const roles = [
    { id: 'student', label: 'Student', desc: 'Standard access' },
    { id: 'cr', label: 'CR', desc: 'Manage evaluations' },
    { id: 'faculty', label: 'Faculty', desc: 'Full advisor access' }
  ] as const;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans relative">
      <div className="mesh-bg"></div>
      <div className="glass-panel p-10 max-w-md w-full mx-4 z-10">
        <h2 className="text-3xl font-bold mb-2 text-center text-white tracking-tight">Access Classroom</h2>
        <p className="text-slate-400 text-center text-sm mb-8">Enter your 10-digit code and select your role</p>

        <form onSubmit={handleJoin} className="flex flex-col gap-6">
          <div className="space-y-4">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] text-center">Identity</p>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${role === r.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-600/10' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}
                >
                  <span className="text-sm font-bold">{r.label}</span>
                  <span className="text-[8px] uppercase tracking-wider opacity-60">{r.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] text-center">Classroom Code</p>
            <input 
              type="text" 
              placeholder="0000000000" 
              className="w-full px-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 font-mono text-center text-2xl tracking-[0.3em] transition-all"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              maxLength={10}
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</p>}
          
          <button 
            type="submit" 
            disabled={isJoining || joinCode.length !== 10}
            className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-bold uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-2xl shadow-indigo-600/40 active:scale-[0.98]"
          >
            {isJoining ? 'Joining Classroom...' : 'Join Classroom'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-4 text-center">
          <p className="text-xs text-slate-500 font-medium">New Classroom?</p>
          <button 
            onClick={handleCreate}
            disabled={isCreating}
            className="text-sm text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            {isCreating ? 'Creating...' : 'Create New Classroom'}
          </button>
        </div>

        <button onClick={() => auth.signOut()} className="mt-8 mx-auto flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
