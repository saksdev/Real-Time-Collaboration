'use client';

import { useEffect, useState } from 'react';
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
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      } as any),
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
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f0f0f5] md:rounded-lg overflow-hidden border border-slate-700/20 shadow-2xl relative">
      <div className="flex items-center gap-2 p-3 bg-slate-900/40 border-b border-slate-700/50 backdrop-blur-md sticky top-0 z-10 rounded-t-lg">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${
            editor.isActive('bold') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-300'
          }`}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${
            editor.isActive('italic') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-300'
          }`}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${
            editor.isActive('strike') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-300'
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </button>

        <div className="w-px h-6 bg-slate-700/50 mx-1"></div>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-300'
          }`}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-300'
          }`}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </button>

        <div className="w-px h-6 bg-slate-700/50 mx-1"></div>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-300'
          }`}
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-300'
          }`}
          title="Ordered List"
        >
          <ListOrdered size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-slate-700/50 transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-300'
          }`}
          title="Blockquote"
        >
          <Quote size={18} />
        </button>
        
        <div className="flex-1"></div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Synced
        </div>
      </div>
      <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto min-h-[60vh] bg-white mt-4 mb-8 shadow-sm rounded">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}

export default function Editor(props: EditorProps) {
  const { roomId, password, displayName, color } = props;
  const [collabData, setCollabData] = useState<{ ydoc: Y.Doc; provider: WebrtcProvider } | null>(null);

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

    return () => {
      webrtcProvider.destroy();
      doc.destroy();
    };
  }, [roomId, password, displayName, color]);

  if (!collabData) {
    return (
      <div className="flex-1 flex items-center justify-center animate-pulse text-slate-400">
        Connecting to collaborative room...
      </div>
    );
  }

  return <EditorInner {...props} ydoc={collabData.ydoc} provider={collabData.provider} />;
}