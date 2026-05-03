import React, { useState, useEffect } from 'react';
import { db, Timestamp } from '../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';

interface Evaluation {
  id: string;
  classroomId: string;
  subject: string;
  marks: number;
  date: number; // toMillis()
  type?: string;
  description?: string;
}

export default function CalendarSection({ classroomId }: { classroomId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => {
    const q = query(collection(db, `classrooms/${classroomId}/evaluations`));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const evals = snapshot.docs.map(doc => {
        const data = doc.data();
        let dateValue = 0;
        if (data.date instanceof Timestamp) {
          dateValue = data.date.toMillis();
        } else if (typeof data.date === 'number') {
          dateValue = data.date;
        } else if (data.date && typeof data.date.seconds === 'number') {
          // Handle POJO Timestamp
          dateValue = data.date.seconds * 1000;
        } else {
          dateValue = Date.now();
        }
        
        return {
          ...data,
          id: doc.id,
          date: dateValue
        } as Evaluation;
      });
      setEvaluations(evals);
    }, (error) => {
      console.error("Error fetching calendar evaluations:", error);
    });

    return () => unsubscribe();
  }, [classroomId]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getDayEvaluations = (day: Date) => {
    return evaluations.filter(e => isSameDay(new Date(e.date), day));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between glass-card p-6 border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{format(currentDate, 'MMMM yyyy')}</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-1">Classroom Schedule</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-slate-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10">
            Today
          </button>
          <button onClick={nextMonth} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-slate-400 hover:text-white">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="glass-card border-white/5 overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-white/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-4 text-center text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayEvals = getDayEvaluations(day);
            const isSelected = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, monthStart);
            
            return (
              <div 
                key={day.toISOString()} 
                className={`min-h-[140px] p-2 border-r border-b border-white/5 transition-colors relative group ${!isCurrentMonth ? 'opacity-25' : ''} ${isToday(day) ? 'bg-indigo-500/5' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${isToday(day) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className="space-y-1.5 overflow-y-auto max-h-[100px] scrollbar-hide">
                  {dayEvals.map(evalItem => (
                    <div 
                      key={evalItem.id}
                      onClick={() => setSelectedEvaluation(evalItem)}
                      className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-300 hover:bg-indigo-500/20 cursor-pointer transition-all border-l-2 border-l-indigo-500 truncate"
                      title={`${evalItem.subject} - ${evalItem.marks} marks`}
                    >
                      {evalItem.subject}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evaluation Detail Modal (Overlay) */}
      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#000]/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md glass-card bg-slate-900/90 border-white/10 p-8 shadow-2xl scale-in-center overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setSelectedEvaluation(null)}
                className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                <Info className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white tracking-tight">{selectedEvaluation.subject}</h4>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Evaluation Details</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Date</p>
                  <p className="text-sm text-white font-semibold">{format(new Date(selectedEvaluation.date), 'MMM do, yyyy')}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Marks</p>
                  <p className="text-sm text-white font-semibold">{selectedEvaluation.marks} pts</p>
                </div>
              </div>

              {selectedEvaluation.type && (
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Type</p>
                  <p className="text-sm text-white font-semibold capitalize">{selectedEvaluation.type}</p>
                </div>
              )}

              {selectedEvaluation.description && (
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Description</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{selectedEvaluation.description}</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setSelectedEvaluation(null)}
              className="w-full mt-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-sm font-bold uppercase tracking-widest transition-all rounded-xl shadow-lg shadow-indigo-600/20"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
