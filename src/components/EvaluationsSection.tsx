import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType, serverTimestamp, Timestamp, setDoc, doc } from '../lib/firebase';
import { collection, query, onSnapshot, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Evaluation {
  id: string;
  classroomId: string;
  subject: string;
  marks: number;
  date: number; // toMillis()
  type?: string;
  description?: string;
  createdBy: string;
  createdAt: number; // toMillis()
}

export default function EvaluationsSection({ isCR, classroomId }: { isCR: boolean, classroomId: string }) {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [subject, setSubject] = useState('');
  const [marks, setMarks] = useState<number>(0);
  const [date, setDate] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const q = query(collection(db, `classrooms/${classroomId}/evaluations`));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const evals = snapshot.docs.map(doc => {
        const data = doc.data();
        
        const dateValue = data.date instanceof Timestamp ? data.date.toMillis() : 
                         (data.date?.seconds ? data.date.seconds * 1000 : (typeof data.date === 'number' ? data.date : Date.now()));
        
        const createdAtValue = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 
                              (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : (typeof data.createdAt === 'number' ? data.createdAt : Date.now()));

        return {
          ...data,
          id: doc.id,
          date: dateValue,
          createdAt: createdAtValue
        } as Evaluation;
      });
      // Sort by date ascending
      evals.sort((a, b) => a.date - b.date);
      setEvaluations(evals);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `classrooms/${classroomId}/evaluations`);
      setLoading(false);
    });

    return unsubscribe;
  }, [classroomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const evalId = Math.random().toString(36).substring(2, 15);
      const evalRef = doc(db, `classrooms/${classroomId}/evaluations`, evalId);
      
      const payload: Evaluation = {
        id: evalId,
        classroomId,
        subject,
        marks,
        date: Timestamp.fromDate(new Date(date)),
        createdBy: user.uid,
        createdAt: serverTimestamp()
      };
      
      if (type) payload.type = type;
      if (description) payload.description = description;

      await setDoc(evalRef, payload);
      
      // Reset form
      setShowForm(false);
      setSubject('');
      setMarks(0);
      setDate('');
      setType('');
      setDescription('');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `classrooms/${classroomId}/evaluations`);
    }
  };

  const handleDelete = async (evalId: string) => {
    if (!confirm('Delete this evaluation?')) return;
    try {
      await deleteDoc(doc(db, `classrooms/${classroomId}/evaluations`, evalId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `classrooms/${classroomId}/evaluations`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center glass-card p-6 border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Upcoming Evaluations</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-1">
              {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
        </div>

        {isCR && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 ${showForm ? 'bg-slate-800 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
          >
            <Plus className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} />
            {showForm ? 'Cancel' : 'Add Evaluation'}
          </button>
        )}
      </div>

      {showForm && isCR && (
        <div className="glass-panel p-8 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">New Evaluation</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Subject Name</label>
              <input required type="text" placeholder="e.g. Mathematics II" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-700 font-medium" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Total Marks</label>
              <input required type="number" placeholder="e.g. 50" value={marks || ''} onChange={e => setMarks(Number(e.target.value))} className="w-full px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-700 font-medium" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Date & Time</label>
              <input required type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white [color-scheme:dark] focus:outline-none focus:border-indigo-500 transition-all font-medium" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Evaluation Type</label>
              <input type="text" placeholder="e.g. Midterm, Lab Viva" value={type} onChange={e => setType(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-700 font-medium" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Additional Details</label>
              <textarea placeholder="Syllabus, room number, materials to bring..." value={description} onChange={e => setDescription(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-700 font-medium resize-none" rows={4} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/20 transition-all transform active:scale-95">
                Schedule Evaluation
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading evaluations...</p>
      ) : evaluations.length === 0 ? (
        <div className="glass-panel p-12 text-center border-dashed border-white/10">
          <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white">No evaluations scheduled</h3>
          <p className="text-slate-400 mt-1 text-sm">Your class representatives haven't added any evaluations yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluations.map(evalu => {
            const dateObj = new Date(evalu.date);
            const isPast = dateObj.getTime() < Date.now();
            return (
              <div key={evalu.id} className={`glass-card p-5 border-l-4 border-indigo-500 flex flex-col ${isPast ? 'opacity-60 grayscale' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium leading-tight">{evalu.subject}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className="text-indigo-400 text-[10px] font-bold px-2 py-1 bg-indigo-500/10 rounded uppercase tracking-wider">
                      {evalu.type || 'Exam'}
                    </span>
                    {isCR && (
                      <button onClick={() => handleDelete(evalu.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-slate-400 text-sm mt-1">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 flex-shrink-0"></span>
                    <span className="text-slate-300 font-medium">{evalu.marks} Marks</span>
                  </div>
                </div>
                
                {evalu.description && (
                  <p className="text-sm text-slate-500 mt-4 border-t border-white/5 pt-3 leading-relaxed">{evalu.description}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
