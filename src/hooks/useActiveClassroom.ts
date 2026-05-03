import { useState, useEffect } from 'react';
import { db, Timestamp } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export interface Classroom {
  id: string;
  joinCode: string;
  name: string;
  advisorId: string;
  driveFolderLink?: string;
  createdAt: any;
}

export interface Member {
  classroomId: string;
  userId: string;
  role: 'student' | 'cr' | 'faculty';
  joinedAt: any;
}

export function useActiveClassroom() {
  const { user } = useAuth();
  const [classroomId, setClassroomId] = useState<string | null>(localStorage.getItem('activeClassroomId'));
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchClassroomData = async () => {
      if (!classroomId) {
        setLoading(false);
        return;
      }

      try {
        const clsRef = doc(db, 'classrooms', classroomId);
        const clsDoc = await getDoc(clsRef);
        
        if (clsDoc.exists()) {
          const clsData = clsDoc.data();
          setClassroom({
            ...clsData,
            createdAt: clsData.createdAt instanceof Timestamp ? clsData.createdAt.toMillis() : clsData.createdAt
          } as Classroom);
          
          const memberRef = doc(db, `classrooms/${classroomId}/members/${user.uid}`);
          const memDoc = await getDoc(memberRef);
          
          if (memDoc.exists()) {
            const memData = memDoc.data();
            setMember({
              ...memData,
              joinedAt: memData.joinedAt instanceof Timestamp ? memData.joinedAt.toMillis() : memData.joinedAt
            } as Member);
          } else {
            // Not a member anymore
            setClassroom(null);
            setMember(null);
            localStorage.removeItem('activeClassroomId');
          }
        } else {
          // Classroom doesn't exist
          setClassroom(null);
          setMember(null);
          localStorage.removeItem('activeClassroomId');
        }
      } catch (e) {
        console.error("Failed to fetch classroom", e);
      } finally {
        setLoading(false);
      }
    };

    fetchClassroomData();
  }, [user, classroomId]);

  return { classroom, member, loading, setClassroomId };
}
