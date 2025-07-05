// components/AuthLayout.tsx
import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // The animated gradient background from your landing page
    <div className="animated-gradient flex items-center justify-center min-h-screen p-4">
      {/* 
        The "glassmorphism" card effect.
        It's semi-transparent with a blurred background and a subtle border.
      */}
      <div className="w-full max-w-md bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
        <div className="p-8 md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}