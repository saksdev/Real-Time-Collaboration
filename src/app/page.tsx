'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [displayName, setDisplayName] = useState('');
  const [createRoomId, setCreateRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedName = localStorage.getItem('docsync_display_name');
    if (storedName) setDisplayName(storedName);
    setCreateRoomId(uuidv4().substring(0, 5).toUpperCase());
  }, []);

  const handleGenerateRoomId = () => {
    setCreateRoomId(uuidv4().substring(0, 5).toUpperCase());
  };

  const handleEnterWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRoomId = (activeTab === 'create' ? createRoomId : joinRoomId).trim().toUpperCase();
    if (!finalRoomId) return;
    
    // Only require name for "create" or if not already stored
    if (activeTab === 'create' && !displayName.trim()) return;

    if (displayName.trim()) {
      localStorage.setItem('docsync_display_name', displayName);
    }

    router.push(`/${finalRoomId}`);
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-[100dvh] flex items-center justify-center relative px-4 bg-[#0d0d12]">
      {/* Main Premium Card */}
      <div className="glass-card rounded-3xl w-full max-w-lg p-1 relative overflow-hidden z-10 transition-all duration-700 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[22px] p-8 sm:p-10 relative">
          {/* Header Branding */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-3xl shadow-2xl mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
              D
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
              DocSync <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">PRO</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium max-w-[280px]">
              Collaboration without limits. Synchronized in real-time.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex p-1 bg-white/5 rounded-xl mb-8 border border-white/5 relative">
            <div 
              className="absolute inset-y-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-all duration-500 ease-out z-0 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              style={{ 
                left: activeTab === 'create' ? '4px' : 'calc(50% + 4px)',
                width: 'calc(50% - 8px)'
              }}
            />
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2.5 text-sm font-bold transition-all z-10 ${activeTab === 'create' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Start New
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2.5 text-sm font-bold transition-all z-10 ${activeTab === 'join' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Join Existing
            </button>
          </div>

          <form onSubmit={handleEnterWorkspace} className="space-y-6">
            
            {activeTab === 'create' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                {/* Display Name */}
                <div className="space-y-2 group">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Architect Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-5 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                  />
                </div>

                {/* Room ID Section */}
                <div className="space-y-2 group">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Workspace ID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={createRoomId}
                      onChange={(e) => setCreateRoomId(e.target.value.toUpperCase())}
                      placeholder="Custom room slug"
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-5 py-3.5 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                    <button 
                      type="button"
                      onClick={handleGenerateRoomId}
                      className="p-3.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/5 transition-all active:scale-95 group"
                      title="Generate"
                    >
                      <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                    </button>
                  </div>
                </div>


              </div>
            )}

            {activeTab === 'join' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 mb-2">
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1">Collaboration Awaits</p>
                  <p className="text-[10px] text-slate-500">Paste the Workspace ID provided by your team architect.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Paste Vault ID</label>
                  <input 
                    type="text" 
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                    placeholder="e.g. ALPHA"
                    required
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-5 py-4 text-center text-white font-mono text-xl tracking-[0.2em] placeholder-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  />
                </div>


              </div>
            )}

            <button 
              type="submit"
              className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-black py-4.5 px-6 rounded-xl shadow-[0_10px_30px_rgba(99,102,241,0.3)] flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10 uppercase tracking-[0.15em] text-sm">
                {activeTab === 'create' ? 'Initialize Workspace' : 'Link Connection'}
              </span>
              <ChevronRight size={18} className="relative z-10" />
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center px-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">v2.11 Release</span>
            <div className="flex gap-4">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
