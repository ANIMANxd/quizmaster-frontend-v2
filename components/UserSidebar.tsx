'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'My History', href: '/history' },
  { name: 'Performance', href: '/performance' },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  return (
    <aside className="w-64 bg-sky-800 text-white flex flex-col h-screen">
      <div className="p-6 text-2xl font-bold text-center border-b border-sky-700">QuizMaster Pro</div>
      <nav className="flex-grow p-4"><ul>{navLinks.map((link) => { const isActive = pathname.startsWith(link.href); return (<li key={link.name}><Link href={link.href} className={`block py-2.5 px-4 rounded-md transition-colors font-medium ${ isActive ? 'bg-cyan-600 text-white' : 'hover:bg-sky-700' }`}>{link.name}</Link></li>);})}</ul></nav>
      <div className="p-4 border-t border-sky-700"><button onClick={logout} className="w-full py-2.5 px-4 rounded-md text-left transition-colors bg-slate-600 hover:bg-slate-500">Logout</button></div>
    </aside>
  );
}