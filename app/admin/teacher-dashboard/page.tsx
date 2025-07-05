// app/admin/teacher-dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Subject } from '@/types/quiz';
import Modal from '@/components/Modal';
import UserPerformanceDetail from '@/components/UserPerformanceDetail'; // Reusing your existing component

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// We need a new type for the student list
interface Student {
  id: number;
  name: string;
  email: string;
}

export default function TeacherDashboardPage() {
  const { user, token } = useAuth();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [isLoading, setIsLoading] = useState({ subjects: true, students: false });
  const [error, setError] = useState<string | null>(null);

  // For the performance modal
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // 1. Fetch the teacher's assigned subjects
  useEffect(() => {
    if (!token || !user) return;
    // For a teacher, the /subjects endpoint automatically returns only their subjects
    const fetchMySubjects = async () => {
      setIsLoading(prev => ({ ...prev, subjects: true }));
      try {
        const res = await fetch(`${API_BASE_URL}/subjects/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch your subjects.');
        setSubjects(await res.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(prev => ({ ...prev, subjects: false }));
      }
    };
    fetchMySubjects();
  }, [token, user]);

  // 2. Fetch students for a selected subject
  const handleSelectSubject = async (subject: Subject) => {
    if (!token) return;
    setSelectedSubject(subject);
    setIsLoading(prev => ({ ...prev, students: true }));
    try {
      // We need a new backend endpoint for this!
      // Let's assume we'll create: GET /subjects/{id}/students
      const res = await fetch(`${API_BASE_URL}/subjects/${subject.id}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch students for this subject.');
      setStudents(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(prev => ({ ...prev, students: false }));
    }
  };

  const openPerformanceModal = (student: Student) => {
    setViewingStudent(student);
    setIsPerformanceModalOpen(true);
  };
  
  return (
    // ================== THE FIX IS HERE ==================
    // Apply `w-full` to constrain the width of this page component.
    // This prevents its children (the grid and tables) from stretching the entire page layout.
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Teacher Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Subjects List */}
        <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-md">
          <h2 className="font-bold text-lg border-b border-gray-300 pb-2 mb-4 text-gray-800">Your Subjects</h2>
          {isLoading.subjects ? <p className="text-gray-700">Loading...</p> : (
            <ul className="space-y-2">
              {subjects.map(subject => (
                <li key={subject.id}>
                  <button 
                    onClick={() => handleSelectSubject(subject)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${selectedSubject?.id === subject.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-800'}`}
                  >
                    {subject.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Column 2: Students List */}
        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-md overflow-x-auto">
          <h2 className="font-bold text-lg border-b border-gray-300 pb-2 mb-4 text-gray-800">
            {selectedSubject ? `Students in ${selectedSubject.name}` : 'Select a subject to view students'}
          </h2>
          {isLoading.students ? <p className="text-gray-700">Loading students...</p> : (
            selectedSubject && (
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-800 font-semibold">Name</th>
                    <th className="px-4 py-2 text-left text-gray-800 font-semibold">Email</th>
                    <th className="px-4 py-2 text-left text-gray-800 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-800">{student.name}</td>
                      <td className="px-4 py-2 text-gray-800">{student.email}</td>
                      <td className="px-4 py-2">
                        <button 
                          onClick={() => openPerformanceModal(student)}
                          className="bg-teal-600 hover:bg-teal-700 text-white py-1 px-3 text-xs rounded-md transition-colors"
                        >
                          View Performance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </div>
      
      {/* Performance Modal */}
      {viewingStudent && (
        <Modal isOpen={isPerformanceModalOpen} onClose={() => setIsPerformanceModalOpen(false)} title={`Performance for ${viewingStudent.name}`}>
          <UserPerformanceDetail userId={viewingStudent.id} />
        </Modal>
      )}
    </div>
  );
}