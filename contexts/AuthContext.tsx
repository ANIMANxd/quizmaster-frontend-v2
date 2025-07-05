'use client'; // This is a Client Component because it uses hooks and browser APIs

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define the shape of the user object and the context
interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'teacher'; 
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // To handle initial load
  const router = useRouter();

  // On initial load, try to get user data from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        // Clear broken storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    } finally {
        setIsLoading(false);
    }
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    // Redirect based on role
    if (userData.role === 'admin') {
      router.push('/admin/dashboard');
    } else if (userData.role === 'teacher') {
      // Teachers now go to their own dashboard
      router.push('/admin/teacher-dashboard'); 
    } else {
      router.push('/dashboard');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Create a custom hook for easy access to the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}