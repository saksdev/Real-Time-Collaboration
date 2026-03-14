'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Users } from 'lucide-react';
import Editor from '@/components/Editor';

export default function WorkspacePage({
  params,
  searchParams
}: {
  params: Promise<{ roomId: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const roomId = resolvedParams.roomId;
  const password = typeof resolvedSearchParams.password === 'string' ? resolvedSearchParams.password : undefined;

  const [displayName, setDisplayName] = useState('');
  const [color, setColor] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem('docsync_display_name');
    if (!storedName) {
      router.push('/');
    } else {
      setDisplayName(storedName);
      let storedColor = localStorage.getItem('docsync_color');
      if (!storedColor) {
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#ff9800', '#ff5722'];
        storedColor = colors[Math.floor(Math.random() * colors.length)];
        localStorage.setItem('docsync_color', storedColor);
      }
      setColor(storedColor);
      setIsMounted(true);
    }
  }, [router]);

  const handleExit = () => {
    router.push('/');
  };

  if (!isMounted) {
    return <div className="flex items-center justify-center h-screen text-slate-400">Loading Workspace...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: color }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-semibold text-sm">{displayName}</h1>
            <p className="text-xs text-slate-400">Room: {roomId}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Users size={14} />
            <span>Collaborating</span>
          </div>
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Exit
          </button>
        </div>
      </header>

      {/* Editor Main Canvas */}
      <main className="flex-1 overflow-hidden">
        <Editor roomId={roomId} password={password} displayName={displayName} color={color} />
      </main>
    </div>
  );
}