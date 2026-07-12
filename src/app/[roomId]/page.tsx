'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@/components/Editor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0d0d12] text-slate-400">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="animate-pulse font-medium tracking-wide text-xs uppercase tracking-widest text-slate-400">Initializing Workspace...</p>
      </div>
    </div>
  )
});

function NameEntryModal({ onJoin, roomId }: { onJoin: (name: string) => void, roomId: string }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0d0d12]/80 backdrop-blur-xl animate-in fade-in duration-700" />
      
      <div className="glass-card w-full max-w-md rounded-3xl p-1 relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-700 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[22px] p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8 text-center">
             <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <User size={24} />
             </div>
             <h2 className="text-2xl font-black text-white tracking-tight mb-2">Identify Yourself</h2>
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 py-1 px-3 bg-indigo-500/10 rounded-full border border-indigo-500/10">
                Joining Room: {roomId}
             </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Your Alias</label>
                <input 
                  autoFocus
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="How should others see you?"
                  required
                  className="w-full bg-black/20 border border-white/5 rounded-xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 px-6 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95"
            >
              <span className="uppercase tracking-[0.15em] text-sm">Join Collaboration</span>
              <ChevronRight size={18} />
            </button>
          </form>
          
          <p className="mt-6 text-[10px] text-slate-500 text-center font-medium leading-relaxed uppercase tracking-widest opacity-50">
            Real-time synchronization will begin <br/> after you enter the vault.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WorkspacePage({
  params
}: {
  params: Promise<{ roomId: string }>
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;

  const [displayName, setDisplayName] = useState('');
  const [color, setColor] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {

    const storedName = localStorage.getItem('docsync_display_name');
    if (!storedName) {
      setShowNameModal(true);
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
  }, []);

  const handleJoin = (name: string) => {
    localStorage.setItem('docsync_display_name', name);
    setDisplayName(name);
    setShowNameModal(false);
    
    // Initialize color if it doesn't exist
    let storedColor = localStorage.getItem('docsync_color');
    if (!storedColor) {
      const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#ff9800', '#ff5722'];
      storedColor = colors[Math.floor(Math.random() * colors.length)];
      localStorage.setItem('docsync_color', storedColor);
    }
    setColor(storedColor);
    setIsMounted(true);
  };

  const handleExit = () => {
    router.push('/');
  };

  if (showNameModal) {
    return <NameEntryModal onJoin={handleJoin} roomId={roomId} />;
  }

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0d12] text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="animate-pulse font-medium tracking-wide">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  const copyInviteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    // Keep this subtle; no blocking alert dialogs in the core editor flow.
    // (We’ll show a non-blocking toast in the editor UI instead.)
  };

  return (
    <div className="h-[100dvh] w-screen bg-mesh text-slate-100 overflow-hidden font-sans">
      <Editor
        roomId={roomId}
        displayName={displayName}
        color={color}
        onExit={handleExit}
        onCopyInviteLink={copyInviteLink}
      />
    </div>
  );
}