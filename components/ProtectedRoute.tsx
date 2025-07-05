'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // Using your existing AuthContext hook

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Array<'admin' | 'teacher' | 'user'>; // A list of roles that can access this page
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 1. Wait until the AuthProvider has finished loading the user state from localStorage
    if (isLoading) {
      return; // Do nothing while we are determining the user's status
    }

    // 2. If loading is finished and there's no user, they are not logged in. Redirect them.
    if (!user) {
      router.push('/login');
      return;
    }

    // 3. If the user's role is NOT included in the list of allowed roles, they are not authorized.
    if (!allowedRoles.includes(user.role)) {
      console.warn(`Redirecting: User with role '${user.role}' tried to access a page for roles: [${allowedRoles.join(', ')}]`);
      
      // A smart redirect: send them to their appropriate "home" page.
      if (user.role === 'admin' || user.role === 'teacher') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }

  }, [user, isLoading, router, allowedRoles]);


  // While checking, or if the user is not authorized, show a loading indicator.
  // This is crucial to prevent "flashing" the protected content before redirecting.
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen">
        {/* You can replace this with a proper spinner component */}
        <p className="text-xl">Loading...</p> 
      </div>
    );
  }

  // 4. If all checks pass (loading is done, user exists, and their role is allowed),
  // then render the actual page content.
  return <>{children}</>;
}