'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw, Lock, Globe, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function LandingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setRoomId(uuidv4().substring(0, 8)); // Generate a short random room ID initially
  }, []);

  const handleGenerateRoomId = () => {
    setRoomId(uuidv4().substring(0, 8));
  };

  const handleEnterWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !roomId.trim()) return;
    if (isPrivate && !password.trim()) return;

    // We store display name in local storage so it persists over reloads
    localStorage.setItem('docsync_display_name', displayName);

    let targetUrl = `/${roomId}`;
    if (isPrivate) {
      // In a real app we'd pass this secularly or use an auth system. 
      // For this P2P demo, we just pass the password in the hash or querystring to construct the WebRTC room name
      targetUrl += `?password=${encodeURIComponent(password)}`;
    }

    router.push(targetUrl);
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen flex items-center justify-center relative px-4">
      {/* Animated Background */}
      <div className="bg-mesh pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className="glass-card rounded-2xl w-full max-w-md p-8 relative overflow-hidden z-10 transition-all duration-500 hover:shadow-2xl">
        
        {/* Glow Effects inside card */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-50"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-500 rounded-full mix-blend-screen filter blur-[80px] opacity-50"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              D
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-glow text-white">
              DocSync <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Pro</span>
            </h1>
          </div>

          <p className="text-slate-300 mb-8 text-sm">
            Real-time collaborative text editing with powerful P2P synchronization. Join a room to start collaborating instantly.
          </p>

          <form onSubmit={handleEnterWorkspace} className="space-y-6">
            
            {/* Display Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your Display Name</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alice"
                required
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Room ID Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Room ID</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="e.g. daily-standup"
                  required
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button 
                  type="button"
                  onClick={handleGenerateRoomId}
                  className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/50 transition-colors tooltip"
                  title="Generate Random ID"
                >
                  <RefreshCcw size={20} className="hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>
            </div>

            {/* Room Type Toggle */}
            <div className="bg-slate-900/50 p-1.5 rounded-lg flex relative border border-slate-700/50">
              <div 
                className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-slate-800 rounded shadow-md transition-all duration-300 ease-out"
                style={{ left: isPrivate ? 'calc(50% + 3px)' : '6px' }}
              />
              
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium z-10 transition-colors ${!isPrivate ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
              >
                <Globe size={16} /> Public
              </button>
              
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium z-10 transition-colors ${isPrivate ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
              >
                <Lock size={16} /> Private
              </button>
            </div>

            {/* Password Input (Conditionally Rendered) */}
            <div className={`space-y-2 transition-all duration-300 overflow-hidden ${isPrivate ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Room Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Required for private rooms"
                required={isPrivate}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold py-3.5 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              Enter Workspace <ChevronRight size={20} />
            </button>
            
          </form>
        </div>
      </div>
    </main>
  );
}
