'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Subject } from '@/types/quiz';
import Modal from '@/components/Modal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function SubjectsPage() {
  const { token } = useAuth();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // State for the form fields, kept separate for clarity
  const [formState, setFormState] = useState({ name: '', description: '' });

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/subjects/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch subjects.');
      const data: Subject[] = await response.json();
      setSubjects(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSubjects();
    }
  }, [token]);

  const handleOpenAddModal = () => {
    setEditingSubject(null);
    setFormState({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormState({ name: subject.name, description: subject.description });
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const url = editingSubject
      ? `${API_BASE_URL}/subjects/${editingSubject.id}`
      : `${API_BASE_URL}/subjects/`;
    const method = editingSubject ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to save subject.');
      }
      
      setIsModalOpen(false);
      fetchSubjects(); // Refresh list
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };
  
  const handleDelete = async (subjectId: number) => {
    if (!confirm('Are you sure you want to delete this subject and all its related content?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete subject.');
      fetchSubjects();
    } catch (err: any) {
       alert(`Error: ${err.message}`);
    }
  }

  return (
    // The main container for the page content
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Page Header */}
      <header className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subjects Management</h1>
          <p className="text-sm text-gray-500">Add, edit, and manage all course subjects.</p>
        </div>
        <button 
          onClick={handleOpenAddModal} 
          className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span className="text-xl">+</span> Add New Subject
        </button>
      </header>

      {/* Table Container */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <p>Loading subjects...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    <button onClick={() => handleOpenEditModal(subject)} className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md shadow-sm">Edit</button>
                    <button onClick={() => handleDelete(subject.id)} className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md shadow-sm">Delete</button>
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
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
              <input type="text" id="name" name="name" value={formState.name} onChange={handleFormChange}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800" required />
            </div>
            <div className="mb-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea id="description" name="description" value={formState.description} onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800" rows={3}></textarea>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md">Cancel</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">Save Subject</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}