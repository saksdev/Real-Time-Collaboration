'use client';

import { useEffect, useState, useRef } from 'react';
import MonacoEditor, { Monaco } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { 
  Sun, Moon, Users, Link2, LogOut, Check, Type,
  MessageSquare, Send, Sparkles, Menu, X
} from 'lucide-react';
import type { editor } from 'monaco-editor';

interface EditorProps {
  roomId: string;
  displayName: string;
  color: string;
  onExit?: () => void;
  onCopyInviteLink?: () => void;
}

interface EditorInnerProps extends EditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
}

type ConnectionStatus = 'connecting' | 'connected' | 'synced' | 'disconnected';

interface ChatMessage {
  sender: string;
  color: string;
  text: string;
  timestamp: number;
}

function EditorInner({ ydoc, provider, displayName, color, onExit, onCopyInviteLink }: EditorInnerProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [peerCount, setPeerCount] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showPeerList, setShowPeerList] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<null | { message: string; kind?: 'success' | 'info' }>(null);

  // Hardcoded Monaco IDE Settings
  const language = 'javascript';
  const [fontSize, setFontSize] = useState(14);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);

  // Editor stats & position
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [stats, setStats] = useState({ lines: 1, chars: 0 });

  // P2P Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'people'>('chat');

  // Synchronize Chat Room using Yjs Array
  useEffect(() => {
    const chatArray = ydoc.getArray<ChatMessage>('chat-messages');

    const handleChatChange = () => {
      setChatMessages(chatArray.toArray());
    };

    chatArray.observe(handleChatChange);
    setChatMessages(chatArray.toArray());

    return () => {
      chatArray.unobserve(handleChatChange);
    };
  }, [ydoc]);

  // Scroll to bottom of chat log
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showPeerList]);

  // Automatically dismiss toast notifications after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Send a chat message
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const chatArray = ydoc.getArray<ChatMessage>('chat-messages');
    chatArray.push([{
      sender: displayName,
      color: color,
      text: newMessageText.trim(),
      timestamp: Date.now()
    }]);

    setNewMessageText('');
  };

  // Advanced Connection and Peer Monitoring
  useEffect(() => {
    if (!provider) return;

    const handleSync = (synced: boolean) => {
      console.log(`[Collab] Document ${synced ? 'fully synced' : 'syncing...'}`);
      if (synced) setStatus('synced');
    };

    const handleStatus = (event: { status: 'connected' | 'connecting' | 'disconnected' }) => {
      console.log(`[Collab] Connection status:`, event.status);
      if (event.status === 'connected') {
        setStatus('connected');
      } else if (event.status === 'disconnected') {
        setStatus('disconnected');
      } else {
        setStatus('connecting');
      }
    };

    const handlePeers = () => {
      const peers = provider.awareness.getStates().size;
      setPeerCount(peers);
    };

    provider.on('sync', handleSync);
    provider.on('status', handleStatus);
    provider.awareness.on('change', handlePeers);

    setPeerCount(provider.awareness.getStates().size);

    return () => {
      provider.off('sync', handleSync);
      provider.off('status', handleStatus);
      provider.awareness.off('change', handlePeers);
    };
  }, [provider]);

  // Dynamic Collaborative Cursor styling injection (Monaco)
  useEffect(() => {
    if (!provider) return;

    const handleAwareness = () => {
      const states = provider.awareness.getStates();
      
      // Clean up old dynamic styling elements
      const existingStyles = document.querySelectorAll('[id^="y-monaco-style-"]');
      existingStyles.forEach(style => style.remove());

      states.forEach((state: { user?: { name?: string; color?: string } }, clientId: number) => {
        if (state.user && state.user.color) {
          const colorVal = state.user.color;
          const nameVal = state.user.name || 'Anonymous';
          
          const styleEl = document.createElement('style');
          styleEl.id = `y-monaco-style-${clientId}`;
          styleEl.innerHTML = `
            .yRemoteSelection-${clientId} {
              background-color: ${colorVal}33 !important;
            }
            .yRemoteSelectionHead-${clientId} {
              border-left: 2px solid ${colorVal} !important;
              border-right: 2px solid ${colorVal} !important;
            }
            .yRemoteSelectionHead-${clientId}::after {
              content: "${nameVal.replace(/"/g, '\\"')}" !important;
              background-color: ${colorVal} !important;
            }
          `;
          document.head.appendChild(styleEl);
        }
      });
    };

    provider.awareness.on('change', handleAwareness);
    handleAwareness(); // Initial update

    return () => {
      provider.awareness.off('change', handleAwareness);
      const existingStyles = document.querySelectorAll('[id^="y-monaco-style-"]');
      existingStyles.forEach(style => style.remove());
    };
  }, [provider]);

  // Monaco and Yjs integration binding setup
  useEffect(() => {
    if (!editorInstance) return;

    const binding = new MonacoBinding(
      ydoc.getText('monaco'),
      editorInstance.getModel() as editor.ITextModel,
      new Set([editorInstance]),
      provider.awareness
    );

    const updateStats = () => {
      const model = editorInstance.getModel();
      if (model) {
        setStats({
          lines: model.getLineCount(),
          chars: model.getValueLength(),
        });
      }
    };

    updateStats();
    const contentDisposable = editorInstance.onDidChangeModelContent(updateStats);
    const cursorDisposable = editorInstance.onDidChangeCursorPosition((e: editor.ICursorPositionChangedEvent) => {
      setCursorPos({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    return () => {
      binding.destroy();
      contentDisposable.dispose();
      cursorDisposable.dispose();
    };
  }, [editorInstance, ydoc, provider.awareness]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'synced': return { label: 'Synced', color: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' };
      case 'connected': return { label: 'Connected', color: 'bg-cyan-400 animate-pulse' };
      case 'disconnected': return { label: 'Offline', color: 'bg-red-500' };
      default: return { label: 'Connecting...', color: 'bg-amber-500 animate-pulse' };
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

  const formatDocument = () => {
    if (editorInstance) {
      const action = editorInstance.getAction('editor.action.formatDocument');
      if (action) {
        action.run();
        setToast({ message: 'Code Formatted', kind: 'success' });
      }
    }
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    setEditorInstance(editor);
    
    // Auto-Format on Save (Ctrl+S / Cmd+S triggers document formatter instead of browser save)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const action = editor.getAction('editor.action.formatDocument');
      if (action) {
        action.run();
        setToast({ message: 'Code Formatted', kind: 'success' });
      }
    });
  };

  const activePeers = Array.from(provider.awareness.getStates().values()) as { user?: { name: string; color: string } }[];
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageText = (text: string, isMe: boolean) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline break-all ${
              isMe 
                ? 'text-indigo-200 hover:text-white font-medium' 
                : theme === 'light'
                  ? 'text-indigo-600 hover:text-indigo-800 font-medium'
                  : 'text-indigo-400 hover:text-indigo-300 font-medium'
            }`}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };



  return (
    <div className={`h-full w-full flex flex-col ${theme === 'light' ? 'bg-slate-50' : 'bg-[#0b0c10]'} overflow-hidden transition-colors duration-500`}>
      {/* HEADER SECTION */}
      <header className={`px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b shrink-0 ${
        theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/40 border-white/5'
      }`}>
        {/* Left: Brand logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-indigo-500/20 select-none">
              D
            </div>
            <div className="flex flex-col">
              <span className={`font-bold tracking-tight text-xs sm:text-sm ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                DocSync <span className="text-indigo-400">Workspace</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-500 font-mono">collaborative editor</span>
            </div>
          </div>
        </div>

        {/* Center Section: Font size and Formatting — hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          {/* Font Size Selection */}
          <div className="flex items-center gap-1.5">
            <Type size={16} className="text-slate-400" />
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className={`text-xs font-semibold py-1 px-2.5 rounded-md border focus:outline-none cursor-pointer ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800/80 border-white/5 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {[12, 13, 14, 15, 16, 18, 20].map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>

          <div className={`h-4 w-px ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>

          {/* Toggle Auto Suggestions */}
          <button
            onClick={() => setSuggestionsEnabled(!suggestionsEnabled)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all active:scale-[0.98] flex items-center gap-1.5 border ${
              suggestionsEnabled 
                ? 'bg-indigo-500 text-white border-indigo-400/20 shadow-sm shadow-indigo-500/20' 
                : theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
            }`}
            title="Toggle Auto Suggestions"
          >
            <Sparkles size={13} className={suggestionsEnabled ? 'animate-pulse text-yellow-300' : 'text-slate-400'} />
            <span>Suggestions</span>
          </button>

          <div className={`h-4 w-px ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>

          {/* Format Code */}
          <button
            onClick={formatDocument}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all active:scale-[0.98] ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
            }`}
            title="Format Code"
          >
            Format
          </button>
        </div>

        {/* Right Side: Connections & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">

          {/* Mobile menu button — shows hidden center controls on small screens */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-all border ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/5'
            }`}
            title="Menu"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          {/* Theme Toggler */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-lg transition-all border ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/5'
            }`}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Peer Count Button */}
          <button
            onClick={() => setShowPeerList(!showPeerList)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
              showPeerList 
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
                : theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
            }`}
          >
            <Users size={14} />
            <span>{peerCount}</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleCopyInvite}
            className={`p-2 rounded-lg transition-all border ${
              theme === 'light'
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-400/20 shadow-lg shadow-indigo-500/10'
            }`}
            title="Copy Invite Link"
          >
            <Link2 size={16} />
          </button>

          {/* Exit button */}
          {onExit && (
            <button
              onClick={onExit}
              className={`p-2 rounded-lg transition-all border ${
                theme === 'light'
                  ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200/50'
                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
              }`}
              title="Exit Room"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* MOBILE DROPDOWN MENU — center controls expanded for small screens */}
      {mobileMenuOpen && (
        <div className={`md:hidden flex items-center flex-wrap gap-2 px-3 py-2.5 border-b shrink-0 ${
          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-white/5'
        }`}>
          <div className="flex items-center gap-1.5">
            <Type size={14} className="text-slate-400" />
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className={`text-xs font-semibold py-1 px-2 rounded-md border focus:outline-none cursor-pointer ${
                theme === 'light'
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-slate-800/80 border-white/5 text-slate-300'
              }`}
            >
              {[12, 13, 14, 15, 16, 18, 20].map((size) => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setSuggestionsEnabled(!suggestionsEnabled); }}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 border ${
              suggestionsEnabled
                ? 'bg-indigo-500 text-white border-indigo-400/20'
                : theme === 'light'
                  ? 'bg-white text-slate-700 border-slate-200'
                  : 'bg-white/5 text-slate-300 border-white/5'
            }`}
          >
            <Sparkles size={13} className={suggestionsEnabled ? 'animate-pulse text-yellow-300' : 'text-slate-400'} />
            Suggestions
          </button>
          <button
            onClick={formatDocument}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-md transition-all border ${
              theme === 'light'
                ? 'bg-white text-slate-700 border-slate-200'
                : 'bg-white/5 text-slate-300 border-white/5'
            }`}
          >
            Format
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full flex relative overflow-hidden">
        {/* Monaco Editor Container */}
        <div className="flex-1 h-full min-w-0 relative">
          <MonacoEditor
            height="100%"
            language={language}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            onMount={handleEditorDidMount}
            options={{
              fontSize: fontSize,
              minimap: { enabled: false }, // Force disabled minimap
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbersMinChars: 3,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              padding: { top: 16, bottom: 16 },
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              quickSuggestions: suggestionsEnabled,
              suggestOnTriggerCharacters: suggestionsEnabled,
              parameterHints: { enabled: suggestionsEnabled },
              tabCompletion: suggestionsEnabled ? 'on' : 'off',
              snippetSuggestions: suggestionsEnabled ? 'inline' : 'none',
            }}
            loading={
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-inherit">
                <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold animate-pulse">
                  Assembling Monaco IDE...
                </p>
              </div>
            }
          />
        </div>

        {/* Sidebar / Active Users & Real-time Chat Drawer */}
        {showPeerList && (
          <>
            {/* Mobile overlay backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
              onClick={() => setShowPeerList(false)}
            />
            {/* Sidebar — bottom sheet on mobile, right panel on desktop */}
            <aside className={`
              fixed bottom-0 left-0 right-0 z-40 md:static md:z-auto
              w-full md:w-80 
              h-[70vh] md:h-full 
              rounded-t-2xl md:rounded-none
              border-t md:border-t-0 md:border-l 
              flex flex-col 
              shadow-2xl md:shadow-none 
              transition-all duration-300
              ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0f111a] border-white/5'
              }
            `}>
              {/* Mobile drag handle */}
              <div className="md:hidden flex justify-center pt-2 pb-1 shrink-0">
                <div className={`w-10 h-1 rounded-full ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
              </div>
              {/* Sidebar Tabs */}
              <div className={`px-2 py-1.5 border-b flex gap-1 shrink-0 bg-black/[0.05] ${
                theme === 'light' ? 'border-slate-200' : 'border-white/5'
              }`}>
                <button
                  onClick={() => setSidebarTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
                    sidebarTab === 'chat'
                      ? 'bg-indigo-500 text-white shadow-md'
                      : theme === 'light'
                        ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare size={13} />
                  Chat Room
                </button>
                <button
                  onClick={() => setSidebarTab('people')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
                    sidebarTab === 'people'
                      ? 'bg-indigo-500 text-white shadow-md'
                      : theme === 'light'
                        ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Users size={13} />
                  People ({peerCount})
                </button>
              </div>

              {/* Sidebar Content */}
              {sidebarTab === 'chat' ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  {/* Messages Log */}
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3">
                    {chatMessages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                        <MessageSquare size={24} className="text-slate-600 mb-2 opacity-50" />
                        <p className="text-[11px] text-slate-500 font-medium">No messages yet. Send a note to connect!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => {
                        const isMe = msg.sender === displayName;
                        return (
                          <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span 
                                className="text-[9px] font-bold tracking-wide uppercase px-1 rounded"
                                style={{ color: msg.color, backgroundColor: `${msg.color}15` }}
                              >
                                {msg.sender}
                              </span>
                              <span className="text-[8px] text-slate-500 font-mono">
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>
                            <div className={`px-3 py-1.5 rounded-2xl text-xs max-w-[85%] break-words selection:bg-indigo-500/30 ${
                              isMe 
                                ? 'bg-indigo-500 text-white rounded-tr-none' 
                                : theme === 'light' 
                                  ? 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50' 
                                  : 'bg-white/5 text-slate-200 rounded-tl-none'
                            }`}>
                              {renderMessageText(msg.text, isMe)}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Message Input Dock */}
                  <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/5 flex gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className={`flex-1 text-xs px-3 py-2 rounded-lg border focus:outline-none focus:border-indigo-500 transition-all ${
                        theme === 'light'
                          ? 'bg-slate-50 border-slate-200 text-slate-800'
                          : 'bg-black/30 border-white/5 text-slate-200'
                      }`}
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white shadow-md active:scale-95 transition-all"
                    >
                      <Send size={13} />
                    </button>
                  </form>
                </div>
              ) : (
                /* Collaborators List (full vertical scrollable) */
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-2">
                  {activePeers.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs font-medium">
                      Waiting for connections...
                    </div>
                  ) : (
                    activePeers.map((state, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between gap-3 py-2 px-2.5 rounded-lg transition-colors ${
                          theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-inner select-none shrink-0"
                            style={{ backgroundColor: state.user?.color || '#6366f1' }}
                          >
                            {(state.user?.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={`text-xs font-bold truncate ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
                              {state.user?.name || 'User'}
                              {state.user?.name === displayName && (
                                <span className="ml-1.5 text-[8px] font-bold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded uppercase">You</span>
                              )}
                            </span>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: state.user?.color }}></span>
                      </div>
                    ))
                  )}
                </div>
              )}

            </aside>
          </>
        )}
      </main>

      {/* FOOTER / STATUS BAR */}
      <footer className={`px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between text-[11px] font-mono border-t ${
        theme === 'light' 
          ? 'bg-slate-100 border-slate-200 text-slate-500' 
          : 'bg-[#08090d] border-white/5 text-slate-400'
      } select-none shrink-0`}>
        {/* Left Side: Stats */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-500">Pos:</span>
            <span>Ln {cursorPos.line}, Col {cursorPos.column}</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="w-px h-3 bg-slate-400/20"></div>
            <div>{stats.lines} lines</div>
            <div className="w-px h-3 bg-slate-400/20"></div>
            <div>{stats.chars} chars</div>
          </div>
        </div>

        {/* Right Side: Status */}
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${statusDisplay.color}`}></div>
          <span className="uppercase text-[9px] font-bold tracking-widest">{statusDisplay.label}</span>
        </div>
      </footer>

      {/* Toast Overlay */}
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-12 z-[70] animate-in fade-in duration-300">
          <div className={`rounded-full px-4 py-2 shadow-2xl border ${
            theme === 'light' 
              ? 'bg-white border-slate-200 text-slate-800' 
              : 'bg-slate-900 border-white/10 text-white'
          }`}>
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
  const { roomId, displayName, color } = props;
  const [collabData, setCollabData] = useState<{ ydoc: Y.Doc; provider: WebsocketProvider } | null>(null);

  useEffect(() => {
    const doc = new Y.Doc();
    
    const websocketProvider = new WebsocketProvider(
      'wss://demos.yjs.dev',
      `docsync-v2-room-${roomId.trim().toUpperCase()}`,
      doc
    );

    websocketProvider.awareness.setLocalStateField('user', {
      name: displayName,
      color: color,
    });

    console.log(`[Collab] Starting session for ${roomId} (ClientID: ${doc.clientID})`);
    
    setCollabData({ ydoc: doc, provider: websocketProvider });

    return () => {
      console.log(`[Collab] Session terminated for ${roomId}`);
      websocketProvider.destroy();
      doc.destroy();
    };
  }, [roomId, displayName, color]);

  if (!collabData) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4 bg-[#0b0c10] text-slate-400">
        <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-xs font-bold animate-pulse uppercase tracking-widest text-slate-400">
          Syncing with Workspace Signal...
        </p>
      </div>
    );
  }

  return <EditorInner {...props} {...collabData} />;
}