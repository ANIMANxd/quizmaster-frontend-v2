// app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'; // Import icons

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'user' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'An unknown error occurred.');
      }
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 py-8">
      {/* Back to Home link */}
      <div className="w-full max-w-md mb-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600 transition-colors">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>

      <div className="p-8 bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Create an Account</h1>
            <p className="text-gray-500">Join QuizMaster Pro today</p>
        </div>

        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
        {successMessage && <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
              placeholder="John Doe" required />
          </div>
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
              placeholder="name@company.com" required />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 pr-10"
                placeholder="•••••••••" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <input type={showConfirmPassword ? 'text' : 'password'} id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 pr-10"
                placeholder="•••••••••" required />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700">
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading || !!successMessage}
            className="w-full text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:outline-none focus:ring-sky-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-sky-400">
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
          
          <p className="mt-4 text-sm text-center text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-sky-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}