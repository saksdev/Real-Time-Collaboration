'use client';

import { useEffect, useState } from 'react';
// ✅ FIXED: Removed '@tiptap/y-tiptap' import (not needed in Tiptap v2)
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Quote, Sun, Moon, Users, Link2, LogOut, Check, Undo2, Redo2, Code, Code2 } from 'lucide-react';

interface EditorProps {
  roomId: string;
  password?: string;
  displayName: string;
  color: string;
  onExit?: () => void;
  onCopyInviteLink?: () => void;
}

interface EditorInnerProps extends EditorProps {
  ydoc: Y.Doc;
  provider: WebrtcProvider;
}

type ConnectionStatus = 'connecting' | 'connected' | 'synced' | 'disconnected';

function EditorInner({ ydoc, provider, displayName, color, roomId, onExit, onCopyInviteLink }: EditorInnerProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [peerCount, setPeerCount] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showPeerList, setShowPeerList] = useState(false);
  const [toast, setToast] = useState<null | { message: string; kind?: 'success' | 'info' }>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: displayName,
          color: color,
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none focus:ring-0 min-h-[500px] p-8 md:p-12',
      },
    },
    immediatelyRender: false,
  });

  // Advanced Connection and Peer Monitoring
  useEffect(() => {
    if (!provider) return;

    const handleSync = ({ synced }: { synced: boolean }) => {
      console.log(`[Collab] Document ${synced ? 'fully synced' : 'syncing...'}`);
      if (synced) setStatus('synced');
    };

    const handleStatus = (event: { connected: boolean }) => {
      console.log(`[Collab] Connection status:`, event.connected ? 'connected' : 'disconnected');
      if (event.connected) {
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
    };

    const handlePeers = () => {
      const peers = provider.awareness.getStates().size;
      setPeerCount(peers);
    };

    provider.on('synced', handleSync);
    provider.on('status', handleStatus);
    provider.awareness.on('change', handlePeers);

    setPeerCount(provider.awareness.getStates().size);

    return () => {
      provider.off('synced', handleSync);
      provider.off('status', handleStatus);
      provider.awareness.off('change', handlePeers);
    };
  }, [provider]);

  // Lightweight toast (non-blocking)
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400 font-medium">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
          <span>Drafting Canvas...</span>
        </div>
      </div>
    );
  }

  const getStatusDisplay = () => {
    switch (status) {
      case 'synced': return { label: 'Synced', color: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' };
      case 'connected': return { label: 'Connected', color: 'bg-cyan-400 animate-pulse' };
      case 'disconnected': return { label: 'Signal Lost', color: 'bg-red-500' };
      default: return { label: 'Linking...', color: 'bg-amber-500 animate-pulse' };
    }
  };

  const statusDisplay = getStatusDisplay();

  const handleCopyInvite = async () => {
    try {
      if (onCopyInviteLink) {
        onCopyInviteLink();
      } else if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
      }
      setToast({ message: 'Invite link copied', kind: 'success' });
    } catch {
      setToast({ message: 'Could not copy invite link', kind: 'info' });
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    title, 
    children 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    title: string; 
    children: React.ReactNode 
  }) => (
    <button
      type="button"
      onMouseDown={(event) => {
        // Prevent losing the text selection before the command runs
        event.preventDefault();
        onClick();
      }}
      className={`shrink-0 p-3 sm:p-2 rounded-lg transition-all duration-200 group relative ${
        isActive 
          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105' 
          : theme === 'dark' 
            ? 'text-slate-400 hover:text-white hover:bg-white/10'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
      }`}
      title={title}
    >
      {children}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {title}
      </span>
    </button>
  );

  const activePeers = Array.from(provider.awareness.getStates().values()) as { user?: { name: string; color: string } }[];

  return (
    <div className={`h-full w-full ${theme === 'light' ? 'light-theme' : ''} transition-colors duration-500`}>
      <div className="relative flex h-full w-full overflow-hidden animate-in fade-in duration-500">
        {/* LEFT: full-height editor area */}
        <div className="relative flex-1 min-w-0 h-full flex flex-col">
          {/* Top command/format bar attached to editor */}
          <div className="px-3 pt-3 pb-2">
            <div
              className={`glass-toolbar rounded-2xl flex items-center gap-1 max-w-[min(1100px,100%)] overflow-x-auto mx-auto p-1.5 ${theme === 'light' ? 'bg-white/90 border-slate-200 shadow-xl' : 'bg-slate-900/80 border-white/10 shadow-2xl'}`}
              style={{ scrollbarWidth: 'none' }}
            >
              <div className="flex shrink-0 items-center gap-0.5 px-2 text-slate-400">
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
                  <Undo2 size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
                  <Redo2 size={18} />
                </ToolbarButton>

                <div className={`shrink-0 w-px h-6 mx-1 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>

                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
                  <Bold size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
                  <Italic size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
                  <Strikethrough size={18} />
                </ToolbarButton>
              </div>

              <div className={`w-px h-6 mx-1 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>

              <div className="flex shrink-0 items-center gap-0.5 px-2">
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
                  <Heading1 size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
                  <Heading2 size={18} />
                </ToolbarButton>
              </div>

              <div className={`w-px h-6 mx-1 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>

              <div className="flex shrink-0 items-center gap-0.5 px-2">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
                  <List size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List">
                  <ListOrdered size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
                  <Quote size={18} />
                </ToolbarButton>
              </div>

              <div className={`w-px h-6 mx-1 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>

              <div className="flex shrink-0 items-center gap-0.5 px-2">
                <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline Code">
                  <Code size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block">
                  <Code2 size={18} />
                </ToolbarButton>

                <div className={`shrink-0 w-px h-6 mx-1 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>

                <ToolbarButton onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </ToolbarButton>
              </div>

              <div className={`w-px h-6 mx-1 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>

              <div className="shrink-0 px-4 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-all duration-500 ${statusDisplay.color}`}></div>
                <span className={`text-[10px] font-bold uppercase tracking-widest min-w-[70px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {statusDisplay.label}
                </span>
              </div>
            </div>
          </div>

          {/* Editor area */}
          <div className="flex-1 w-full overflow-auto custom-scrollbar px-2 sm:px-4 md:px-8 py-6">
            <div className="w-full h-full">
              <div className={`paper-effect rounded-xl w-full min-h-[70vh] mb-6 ${theme === 'light' ? 'bg-white' : 'bg-[#020617]'}`}>
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>

        {/* Floating bottom-right sidebar trigger + panel */}
        <div className="pointer-events-none absolute inset-0">
          {/* Small box (closed state) */}
          {!showPeerList && (
            <button
              onClick={() => setShowPeerList(true)}
              className={`pointer-events-auto absolute right-4 bottom-4 sm:right-6 sm:bottom-6 rounded-full px-3.5 py-2 flex items-center gap-2 shadow-lg ${
                theme === 'light'
                  ? 'bg-white/95 border border-slate-200 text-slate-700'
                  : 'bg-slate-900/95 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex -space-x-1">
                {activePeers.slice(0, 3).map((state, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white ${
                      theme === 'light' ? 'border-slate-100' : 'border-slate-950'
                    }`}
                    style={{ backgroundColor: state.user?.color || '#6366f1' }}
                  >
                    {(state.user?.name || '?').charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-start">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                  <Users size={12} />
                  {peerCount}
                </span>
                <span className="text-[9px] opacity-70">Invite & members</span>
              </div>
            </button>
          )}

          {/* Open panel (click outside to close) */}
          {showPeerList && (
            <>
              <button
                className="pointer-events-auto absolute inset-0 bg-black/40"
                aria-label="Close sidebar"
                onClick={() => setShowPeerList(false)}
              />

              <div className="pointer-events-auto absolute right-0 bottom-0 w-full max-w-xs sm:max-w-sm px-4 pb-6">
                <div className={`glass-card rounded-2xl border shadow-2xl overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950/95 border-white/10'}`}>
                  {/* Header / room info */}
                  <div className="px-4 pt-3 pb-2 border-b border-white/10 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Room
                      </span>
                      <span className="text-[11px] font-mono break-all text-slate-300 max-h-10 overflow-hidden">
                        {roomId}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`} />
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                        {statusDisplay.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 border-b border-white/10 flex flex-col gap-2">
                    <button
                      onClick={handleCopyInvite}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.99] ${theme === 'light' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
                    >
                      <Link2 size={14} />
                      Invite link
                    </button>

                    {onExit && (
                      <button
                        onClick={onExit}
                        className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.99] ${theme === 'light' ? 'text-red-600 hover:bg-red-50' : 'text-red-300 hover:bg-red-500/10'}`}
                      >
                        <LogOut size={14} />
                        Exit room
                      </button>
                    )}
                  </div>

                  {/* Collaborators list */}
                  <div className="px-4 py-3 max-h-64 overflow-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-slate-400" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                          {peerCount} online
                        </span>
                      </div>
                    </div>

                    {activePeers.length === 0 && (
                      <p className="text-[11px] text-slate-500">
                        Waiting for collaborators...
                      </p>
                    )}

                    {activePeers.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {activePeers.map((state, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${theme === 'light' ? 'bg-slate-50' : 'bg-white/5'} transition-colors`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-inner"
                                style={{ backgroundColor: state.user?.color || '#6366f1' }}
                              >
                                {(state.user?.name || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={`text-sm font-semibold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                  {state.user?.name || 'Anonymous'}
                                  {state.user?.name === displayName && (
                                    <span className={`ml-2 text-[8px] opacity-60 uppercase px-1 rounded ${theme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-slate-200'}`}>You</span>
                                  )}
                                </span>
                                <span className="text-[9px] text-green-500 font-bold uppercase tracking-widest">
                                  Connected
                                </span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-mono uppercase tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                              {state.user?.color ? state.user.color : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-[70]">
          <div className={`glass-card rounded-full px-4 py-2 shadow-2xl border ${theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/80 border-white/10 text-white'}`}>
            <div className="flex items-center gap-2 text-xs font-bold tracking-wide">
              {toast.kind === 'success' ? <Check size={14} className="text-green-500" /> : <span className="w-2 h-2 rounded-full bg-slate-400" />}
              <span>{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Editor(props: EditorProps) {
  const { roomId, password, displayName, color } = props;
  const [collabData, setCollabData] = useState<{ ydoc: Y.Doc; provider: WebrtcProvider } | null>(null);

  // ✅ FIXED: Redundant signaling and rock-solid connection logic
  useEffect(() => {
    const doc = new Y.Doc();
    
    // Significantly expanded signaling list for global fallback support
    const webrtcProvider = new WebrtcProvider(`docsync-v2-room-${roomId.trim().toUpperCase()}`, doc, {
      password: password || undefined,
      signaling: [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
        'wss://y-webrtc-signaling-us.herokuapp.com',
        'wss://y-webrtc.fly.dev',
        'wss://y-webrtc-signaling.onrender.com',
        'wss://y-webrtc-backup.fly.dev'
      ],
      maxConns: 20 + Math.floor(Math.random() * 15), // Randomize slightly to avoid thundering herd
      peerOpts: {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      }
    });

    webrtcProvider.awareness.setLocalStateField('user', {
      name: displayName,
      color: color,
    });

    console.log(`[Collab] Starting session for ${roomId} (ClientID: ${doc.clientID})`);
    
    setCollabData({ ydoc: doc, provider: webrtcProvider });

    return () => {
      console.log(`[Collab] Session terminated for ${roomId}`);
      webrtcProvider.destroy();
      doc.destroy();
    };
  }, [roomId, password, displayName, color]);

  if (!collabData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-sm font-medium animate-pulse uppercase tracking-widest text-xs">Attaching Signal...</p>
      </div>
    );
  }

  return <EditorInner {...props} {...collabData} />;
}