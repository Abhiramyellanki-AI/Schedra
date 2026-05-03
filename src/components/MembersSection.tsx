import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Users, Shield, GraduationCap, User, Loader2, Search } from 'lucide-react';

interface Member {
  userId: string;
  role: 'student' | 'cr' | 'faculty' | 'advisor';
  joinedAt: any;
  name?: string;
  email?: string;
}

export default function MembersSection({ classroomId, advisorId }: { classroomId: string, advisorId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const membersRef = collection(db, `classrooms/${classroomId}/members`);
    const q = query(membersRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memberList = snapshot.docs.map(doc => doc.data() as Member);
      setMembers(memberList);
      setLoading(false);
    }, (error) => {
      console.error("Snapshot listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classroomId]);

  // Fetch user details incrementally when members list changes
  useEffect(() => {
    if (members.length === 0) return;

    const fetchUserDetails = async () => {
      const membersToFetch = members.filter(m => !m.name);
      if (membersToFetch.length === 0) return;

      const detailedResults = await Promise.all(membersToFetch.map(async (m) => {
        try {
          const userDocRef = doc(db, 'users', m.userId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return { ...m, name: userData.name, email: userData.email };
          }
        } catch (e) {
          console.error(`Error fetching user profile for ${m.userId}:`, e);
        }
        return m;
      }));

      // Only update if we actually got more details to avoid infinite loop
      setMembers(prev => prev.map(m => {
        const detailed = detailedResults.find(d => d.userId === m.userId);
        return detailed || m;
      }));
    };

    fetchUserDetails();
  }, [members.length]); // depend on length to trigger when list changes

  const filteredMembers = members.filter(m => 
    (m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     m.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'advisor': return <Shield className="w-4 h-4 text-amber-400" />;
      case 'cr': return <Shield className="w-4 h-4 text-indigo-400" />;
      case 'faculty': return <GraduationCap className="w-4 h-4 text-emerald-400" />;
      default: return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'advisor': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'cr': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'faculty': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin mb-4" />
      <p className="text-sm font-medium">Loading members...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-6 border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Participants</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-1">{members.length} members found</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((m) => (
          <div key={m.userId} className="glass-card p-5 border-white/5 hover:border-white/10 transition-all group flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-xl font-bold text-slate-300 shadow-xl group-hover:scale-105 transition-transform shrink-0">
              {m.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-white truncate text-base">{m.name || 'Anonymous'}</p>
              </div>
              <p className="text-xs text-slate-500 truncate mb-3">{m.email}</p>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest shadow-sm ${getRoleBadgeClass(m.role)}`}>
                {getRoleIcon(m.role)}
                {m.role}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-20 glass-card bg-white/5 border-dashed border-white/10">
          <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No results found for your search.</p>
        </div>
      )}
    </div>
  );
}
