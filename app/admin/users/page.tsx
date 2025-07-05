'use client';

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/Modal';
import UserPerformanceDetail from '@/components/UserPerformanceDetail'; // Import our new component
import SubjectAssignmentModal from '@/components/SubjectAssignmentModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'teacher'; // Ensure this matches your backend schema
}

export default function UsersPage() {
  const { token } = useAuth();
  
  // State
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and Search State
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [addUserFormState, setAddUserFormState] = useState({ name: '', email: '', password: '', role: 'user' });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Fetch all users once on page load
  useEffect(() => {
    if (!token) return;
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to fetch users. Ensure you are an administrator.');
        setAllUsers(await res.json());
      } catch (err: any) { setError(err.message); } 
      finally { setIsLoading(false); }
    };
    fetchUsers();
  }, [token]);

  // Client-side filtering logic
  const filteredUsers = useMemo(() => {
    return allUsers
      .filter(user => roleFilter === 'all' || user.role === roleFilter)
      .filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [allUsers, roleFilter, searchQuery]);

  // Handlers
  const handleAddUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/admin/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(addUserFormState)
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to add user.');
      setIsAddModalOpen(false);
      // Manually add user to state for instant UI update, or re-fetch
      const newUser = await res.json();
      setAllUsers([...allUsers, newUser]);
    } catch (err: any) { alert(`Error: ${err.message}`); }
  };

  const openAssignModal = (user: User) => {
    if (user.role === 'admin') {
      alert("Cannot assign subjects to an admin.");
      return;
    }
    setSelectedUser(user);
    setIsAssignModalOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`${API_BASE_URL}/admin/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setAllUsers(allUsers.filter(user => user.id !== userId)); // Instant UI update
    } catch (err: any) { alert(`Error: ${err.message}`); }
  };
  
  const openPerformanceModal = (user: User) => {
    setSelectedUser(user);
    setIsPerformanceModalOpen(true);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <header className="pb-4 border-b border-gray-200 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <p className="text-sm text-gray-600">Monitor, filter, and manage all users.</p>
      </header>
      
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">+ Add New User</button>
        <div className="flex items-center gap-4">
          <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="p-2 border rounded-md text-gray-700 placeholder-gray-400"/>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="p-2 border rounded-md bg-white text-gray-700">
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 font-semibold leading-tight text-xs rounded-full ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : user.role === 'teacher'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {user.role}
                    </span>

                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex gap-2">
                      {(user.role === 'teacher' || user.role === 'user') && (
                        <button
                          onClick={() => openAssignModal(user)}
                          title="Assign quizzes to this user"
                          className="px-4 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          Assign
                        </button>
                      )}
                      
                      {user.role === 'user' && (
                        <button
                          onClick={() => openPerformanceModal(user)}
                          title="View performance report"
                          className="px-4 py-1 text-sm font-medium text-teal-600 border border-teal-600 rounded-md hover:bg-teal-50 transition-colors"
                        >
                          Performance
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete this user"
                        className="px-4 py-1 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New User">
        <form onSubmit={handleAddUserSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={addUserFormState.name} 
                onChange={e => setAddUserFormState({...addUserFormState, name: e.target.value})} 
                className="w-full p-2 border rounded-md text-gray-700 placeholder-gray-400" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                value={addUserFormState.email} 
                onChange={e => setAddUserFormState({...addUserFormState, email: e.target.value})} 
                className="w-full p-2 border rounded-md text-gray-700 placeholder-gray-400" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                value={addUserFormState.password} 
                onChange={e => setAddUserFormState({...addUserFormState, password: e.target.value})} 
                className="w-full p-2 border rounded-md text-gray-700 placeholder-gray-400" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select 
                value={addUserFormState.role} 
                onChange={e => setAddUserFormState({...addUserFormState, role: e.target.value})} 
                className="w-full p-2 border rounded-md bg-white text-gray-700"
              >
                <option value="user">User</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
              Add User
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Performance Modal */}
      {selectedUser && (
        <Modal isOpen={isPerformanceModalOpen} onClose={() => setIsPerformanceModalOpen(false)} title={`Performance for ${selectedUser.name}`}>
          <UserPerformanceDetail userId={selectedUser.id} />
        </Modal>
      )}
      
      {/* Subject Assignment Modal */}
      <SubjectAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        user={selectedUser}
      />
    </div>
  );
}