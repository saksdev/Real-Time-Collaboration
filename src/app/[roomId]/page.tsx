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
  
  // Unwrap Next.js 15+ promise params 
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);

  const roomId = resolvedParams.roomId;
  const password = typeof resolvedSearchParams.password === 'string' ? resolvedSearchParams.password : undefined;

  const [displayName, setDisplayName] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Attempt to load display name, otherwise bounce back to landing page
    const storedName = localStorage.getItem('docsync_display_name');
    if (!storedName) {
      router.push('/');
    } else {
      setDisplayName(storedName);
      
      // Load or generate a color for the session
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
    // Optionally clear storage if we want them to enter a new name, 
    // but usually they keep it. 
    router.push('/');
  };

  if (!isMounted) return <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center text-white"><div className="animate-pulse">Loading Workspace...</div></div>;

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d12] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 z-20 sticky top-0">
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg">
            D
          </div>
          <span className="font-bold tracking-tight text-white hidden sm:block">DocSync Pro</span>
          <div className="w-px h-6 bg-slate-800 mx-2 hidden sm:block"></div>
          <span className="text-slate-400 text-sm font-mono bg-slate-800/50 px-2 py-1 rounded">Room: {roomId}</span>
          {password && <span className="text-xs text-pink-400 font-semibold uppercase tracking-widest ml-2 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">Private</span>}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-slate-300">Live</span>
          </div>

          {/* Active User Avatar */}
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow shadow-black/50 border-2"
            style={{ backgroundColor: color, borderColor: 'rgba(255,255,255,0.2)' }}
            title={`You (${displayName})`}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>

          <button 
            onClick={handleExit}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg transition-colors border border-red-500/20"
          >
            <LogOut size={16} /> <span className="hidden sm:inline font-medium">Exit</span>
          </button>
        </div>
      </header>

      {/* Editor Main Canvas Wrapper */}
      <main className="flex-1 flex w-full relative p-2 sm:p-4 lg:p-8 bg-mesh">
        <Editor 
          roomId={roomId} 
          password={password} 
          displayName={displayName} 
          color={color} 
        />
      </main>
    </div>
  );
}
