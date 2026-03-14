'use client';

import { useEffect, useState } from 'react';
// ✅ FIXED: Removed '@tiptap/y-tiptap' import (not needed in Tiptap v2)
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Quote } from 'lucide-react';

interface EditorProps {
  roomId: string;
  password?: string;
  displayName: string;
  color: string;
}

interface EditorInnerProps extends EditorProps {
  ydoc: Y.Doc;
  provider: WebrtcProvider;
}

function EditorInner({ ydoc, provider, displayName, color }: EditorInnerProps) {
  // ✅ FIXED: Added immediatelyRender: false (required for Next.js + Tiptap)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // ✅ FIXED: Disable history — Yjs handles undo/redo
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
        class:
          'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[400px]',
      },
    },
    immediatelyRender: false, // ✅ CRITICAL FIX: Prevents hydration mismatch in Next.js
  });

  // ✅ FIXED: Show loading state while editor initializes
  if (!editor) {
    return <div className="p-4 text-slate-400">Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-slate-700/50 bg-slate-800/50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${editor.isActive('bold') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-300'
            }`}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${editor.isActive('italic') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-300'
            }`}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${editor.isActive('strike') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-300'
            }`}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${editor.isActive('heading', { level: 1 })
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-300'
            }`}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${editor.isActive('heading', { level: 2 })
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-300'
            }`}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${editor.isActive('bulletList')
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-300'
            }`}
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${editor.isActive('orderedList')
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-300'
            }`}
          title="Ordered List"
        >
          <ListOrdered size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${editor.isActive('blockquote')
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-300'
            }`}
          title="Blockquote"
        >
          <Quote size={18} />
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-700/50">
        {editor.isEditable ? '✏️ Editing' : '🔒 Read-only'} •{' '}
        {provider.awareness.getStates().size} user{provider.awareness.getStates().size !== 1 ? 's' : ''} online
      </div>
    </div>
  );
}

export default function Editor(props: EditorProps) {
  const { roomId, password, displayName, color } = props;
  const [collabData, setCollabData] = useState<{ ydoc: Y.Doc; provider: WebrtcProvider } | null>(null);

  // ✅ FIXED: Proper cleanup to prevent memory leaks
  useEffect(() => {
    const doc = new Y.Doc();
    const webrtcProvider = new WebrtcProvider(`docsync-room-${roomId}`, doc, {
      password: password || undefined,
    });

    webrtcProvider.awareness.setLocalStateField('user', {
      name: displayName,
      color: color,
    });

    setCollabData({ ydoc: doc, provider: webrtcProvider });

    // ✅ Cleanup function — destroys connections when component unmounts
    return () => {
      webrtcProvider.destroy();
      doc.destroy();
    };
  }, [roomId, password, displayName, color]); // ✅ Added all dependencies

  // ✅ FIXED: Show loading while Yjs connection initializes
  if (!collabData) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Connecting to collaborative room...
      </div>
    );
  }

  return <EditorInner {...props} {...collabData} />;
}