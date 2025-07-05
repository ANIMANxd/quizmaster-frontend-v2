// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'; // Import necessary icons

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to login');
      }
      login({ id: data.id, name: data.name, email: data.email, role: data.role }, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
      {/* Back to Home link */}
      <div className="w-full max-w-md mb-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600 transition-colors">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
      
      <div className="p-8 bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">QuizMaster Pro</h1>
          <p className="text-gray-500">Sign in to your account</p>
        </div>
        
        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
              placeholder="name@company.com" required />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
              Password
            </label>
            {/* Password input with show/hide icon */}
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 pr-10"
                placeholder="•••••••••" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={isLoading}
            className="w-full text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:outline-none focus:ring-sky-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-sky-400">
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <p className="mt-4 text-sm text-center text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-sky-600 hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}