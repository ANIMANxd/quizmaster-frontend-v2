'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Chapter, Subject } from '@/types/quiz'; // We already have these types!
import Modal from '@/components/Modal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function ChaptersPage() {
  const { token } = useAuth();
  
  // State for data
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]); // To populate the dropdown
  
  // State for UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // State for the form
  const [formState, setFormState] = useState({ name: '', subject_id: '' });

  // --- Data Fetching ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch both chapters and subjects in parallel
      const [chaptersRes, subjectsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/chapters/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/subjects/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!chaptersRes.ok) throw new Error('Failed to fetch chapters.');
      if (!subjectsRes.ok) throw new Error('Failed to fetch subjects for dropdown.');

      const chaptersData: Chapter[] = await chaptersRes.json();
      const subjectsData: Subject[] = await subjectsRes.json();
      
      setChapters(chaptersData);
      setSubjects(subjectsData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // --- Modal and Form Handlers ---
  const handleOpenAddModal = () => {
    setEditingChapter(null);
    // Default to the first subject in the list if it exists
    setFormState({ name: '', subject_id: subjects.length > 0 ? String(subjects[0].id) : '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormState({ name: chapter.name, subject_id: String(chapter.subject_id) });
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formState.subject_id) {
        alert("Please select a subject.");
        return;
    }
    
    const url = editingChapter
      ? `${API_BASE_URL}/chapters/${editingChapter.id}`
      : `${API_BASE_URL}/chapters/`;
    const method = editingChapter ? 'PUT' : 'POST';

    const payload = {
        name: formState.name,
        subject_id: parseInt(formState.subject_id, 10) // Ensure subject_id is a number
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to save chapter.');
      }
      
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };
  
  const handleDelete = async (chapterId: number) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    
    try {
      await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchData();
    } catch (err: any) {
       alert(`Error: ${err.message}`);
    }
  }

  // Helper to find subject name from ID
  const getSubjectName = (subjectId: number) => {
    return subjects.find(s => s.id === subjectId)?.name || 'Unknown';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <header className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chapter Management</h1>
          <p className="text-sm text-gray-500">Organize subjects into distinct chapters.</p>
        </div>
        <button 
          onClick={handleOpenAddModal} 
          className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span className="text-xl">+</span> Add New Chapter
        </button>
      </header>

      <div className="overflow-x-auto">
        {isLoading ? (
          <p>Loading data...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chapter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chapters.map((chapter) => (
                <tr key={chapter.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{chapter.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getSubjectName(chapter.subject_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    <button onClick={() => handleOpenEditModal(chapter)} className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md shadow-sm">Edit</button>
                    <button onClick={() => handleDelete(chapter.id)} className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md shadow-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* The Modal for Adding/Editing */}
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChapter ? 'Edit Chapter' : 'Add New Chapter'}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Chapter Name</label>
              <input type="text" id="name" name="name" value={formState.name} onChange={handleFormChange}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div className="mb-2">
              <label htmlFor="subject_id" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select id="subject_id" name="subject_id" value={formState.subject_id} onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white" required>
                <option value="" disabled>-- Select a Subject --</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md">Cancel</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">Save Chapter</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}