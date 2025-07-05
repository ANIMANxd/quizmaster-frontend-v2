'use client'; // This needs to be a client component to use state

import { useState, ReactNode } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserSidebar from '@/components/UserSidebar';

const HamburgerButton = ({ onClick, isOpen }: { onClick: () => void, isOpen: boolean }) => (
  <button onClick={onClick} className="lg:hidden z-50 p-2">
    <div className={`w-6 h-0.5 bg-gray-800 transition-transform ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
    <div className={`w-6 h-0.5 bg-gray-800 my-1.5 transition-opacity ${isOpen ? 'opacity-0' : ''}`}></div>
    <div className={`w-6 h-0.5 bg-gray-800 transition-transform ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
  </button>
);

export default function UserSectionLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <ProtectedRoute allowedRoles={['user']}>
      <div className="flex bg-slate-50 min-h-screen">
        {/* Sidebar with responsive classes */}
        <div className={`fixed lg:relative z-40 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <UserSidebar />
        </div>
        
        <div className="flex-grow flex flex-col">
          {/* Header for the hamburger button */}
          <header className="lg:hidden flex items-center p-4 bg-white shadow">
            <HamburgerButton onClick={() => setIsSidebarOpen(!isSidebarOpen)} isOpen={isSidebarOpen} />
            <h2 className="ml-4 font-bold">Menu</h2>
          </header>

          {/* Main content area */}
          <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}