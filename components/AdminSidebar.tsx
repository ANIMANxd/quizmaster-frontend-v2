// components/AdminSidebar.tsx

'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { name: 'Admin Dashboard', href: '/admin/dashboard', roles: ['admin'] },
    { name: 'User Management', href: '/admin/users', roles: ['admin'] },
    
    // Link ONLY for Teacher
    { name: 'Teacher Dashboard', href: '/admin/teacher-dashboard', roles: ['teacher'] },
    // Links visible to BOTH Admin and Teacher
    { name: 'Subjects', href: '/admin/subjects', roles: ['admin', 'teacher'] },
    { name: 'Chapters', href: '/admin/chapters', roles: ['admin', 'teacher'] },
    { name: 'Quizzes', href: '/admin/quizzes', roles: ['admin', 'teacher'] },
    
    // Links ONLY for Admin

  ];

  // Filter links based on the current user's role
  const accessibleLinks = navLinks.filter(link => user && link.roles.includes(user.role));

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold">QuizMaster Pro</h2>
        <p className="text-sm text-gray-400 capitalize">{user?.role} Panel</p>
      </div>
      <nav className="flex-grow">
        <ul>
          {accessibleLinks.map(link => (
            <li key={link.name}>
              <Link href={link.href} className={`block py-3 px-6 transition-colors ${pathname === link.href ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}>
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-6 border-t border-gray-700">
        <button onClick={logout} className="w-full text-left py-3 px-6 rounded-md hover:bg-red-600/50 transition-colors">
          Logout
        </button>
      </div>
    </aside>
  );
}