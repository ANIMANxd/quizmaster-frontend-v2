// components/SubjectAssignmentModal.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Subject } from '@/types/quiz';
import Modal from '@/components/Modal';

interface SubjectAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: number; name: string; role: 'teacher' | 'user' | 'admin' } | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function SubjectAssignmentModal({ isOpen, onClose, user }: SubjectAssignmentModalProps) {
  const { token } = useAuth();
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // This useEffect now fetches BOTH all subjects AND the user's current assignments
  useEffect(() => {
    // Only run if the modal is open, we have a token, and a user is selected
    if (!isOpen || !token || !user) {
      return;
    }
    
    const fetchDataForModal = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all subjects and the user's assigned subjects in parallel
        const [subjectsRes, assignedRes] = await Promise.all([
          fetch(`${API_BASE_URL}/subjects/`, { 
            headers: { Authorization: `Bearer ${token}` }
          }),
          // NEW: Call the new endpoint
          fetch(`${API_BASE_URL}/admin/admin/users/${user.id}/assigned-subjects`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!subjectsRes.ok) throw new Error("Failed to load available subjects.");
        if (!assignedRes.ok) throw new Error("Failed to load current assignments.");
        
        const subjectsData: Subject[] = await subjectsRes.json();
        const assignedIds: number[] = await assignedRes.json();

        setAllSubjects(subjectsData);
        // Pre-populate the checkboxes with the fetched IDs
        setSelectedSubjects(new Set(assignedIds));

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataForModal();
  }, [isOpen, token, user]); // Rerun whenever the user or modal state changes

  const handleCheckboxChange = (subjectId: number) => {
    const newSelection = new Set(selectedSubjects);
    if (newSelection.has(subjectId)) {
      newSelection.delete(subjectId);
    } else {
      newSelection.add(subjectId);
    }
    setSelectedSubjects(newSelection);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/admin/assign-subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          subject_ids: Array.from(selectedSubjects)
        })
      });
      if (!res.ok) {
        throw new Error((await res.json()).detail || 'Failed to assign subjects.');
      }
      alert('Subjects assigned successfully!');
      onClose();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Subjects to ${user?.name}`}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <p>Loading assignments...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-600">
                Select the subjects that this {user?.role} should have access to. This will overwrite any previous assignments.
              </p>
              <div className="space-y-2">
                {allSubjects.map(subject => (
                  <label key={subject.id} className="flex items-center p-3 rounded-md hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedSubjects.has(subject.id)}
                      onChange={() => handleCheckboxChange(subject.id)}
                    />
                    <span className="ml-3 text-sm font-medium text-gray-800">{subject.name}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end">
          <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-blue-300">
            {isLoading ? 'Loading...' : 'Save Assignments'}
          </button>
        </div>
      </form>
    </Modal>
  );
}