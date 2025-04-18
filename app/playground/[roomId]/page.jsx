"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { executeCode } from "@/app/api/Piston/api";
import { CODE_SNIPPETS } from "@/app/constants";
import EditorHeader from "@/components/playground/editor/EditorHeader";
import EditorFooter from "@/components/learn/editor/EditorFooter";
import OutputPanel from "@/components/learn/editor/OutputPanel";
import CollaboratorAvatars from "../../../components/playground/CollaboratorAvatars";
import { pusherClient } from '../../../lib/pusher-client';

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
  { id: 'csharp', name: 'C#' },
  { id: 'php', name: 'PHP' },
];

const getFileExtension = (lang) => {
  const extensions = {
    javascript: 'js',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    csharp: 'cs',
    php: 'php'
  };
  return extensions[lang] || 'txt';
};

const RoomPage = () => {
  const { roomId } = useParams();
  const { userId } = useAuth();
  const { user } = useUser();
  const [collaborators, setCollaborators] = useState([]);
  const [code, setCode] = useState(CODE_SNIPPETS['javascript']);
  const [lastUpdateFromServer, setLastUpdateFromServer] = useState(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState([]);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [wordCount, setWordCount] = useState(0);
  const [executionTime, setExecutionTime] = useState(null);
  const [executionTimestamp, setExecutionTimestamp] = useState(null);
  const [fileName, setFileName] = useState(`main.${getFileExtension('javascript')}`);
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState({ code: false, link: false });

  const getDisplayName = (user) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.username) {
      return user.username;
    }
    if (user?.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress;
    }
    return 'Anonymous';
  };

  useEffect(() => {
    if (!roomId || !userId) return;

    console.log('Subscribing to channel:', `room-${roomId}`);
    const channel = pusherClient.subscribe(`room-${roomId}`);
    
    // Join room
    const joinRoom = async () => {
      try {
        const response = await fetch('/api/socket', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomId,
            userId,
            username: getDisplayName(user),
            event: 'join-room',
          }),
        });
        if (!response.ok) {
          console.error('Failed to join room:', await response.text());
        }
      } catch (error) {
        console.error('Error joining room:', error);
      }
    };
    
    joinRoom();

    channel.bind('collaboratorsUpdate', (data) => {
      console.log('Received collaborators update:', data);
      if (Array.isArray(data)) {
        // Sort collaborators by timestamp to ensure consistent order
        const sortedCollaborators = [...data].sort((a, b) => b.timestamp - a.timestamp);
        setCollaborators(sortedCollaborators);
      }
    });

    channel.bind('codeUpdate', (data) => {
      console.log('Received code update from:', data.username || data.userId);
      if (data && data.userId !== userId) {
        setLastUpdateFromServer(data.data);
        setCode(data.data);
      }
    });

    // Debug Pusher connection
    pusherClient.connection.bind('state_change', (states) => {
      console.log('Pusher state changed:', states);
    });

    pusherClient.connection.bind('connected', () => {
      console.log('Pusher client connected successfully');
    });

    pusherClient.connection.bind('error', (err) => {
      console.error('Pusher connection error:', err);
    });

    return () => {
      // Leave room
      fetch('/api/socket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          userId,
          username: getDisplayName(user),
          event: 'leave-room',
        }),
      }).catch(error => console.error('Error leaving room:', error));

      console.log('Unsubscribing from channel:', `room-${roomId}`);
      channel.unbind_all();
      pusherClient.unsubscribe(`room-${roomId}`);
    };
  }, [roomId, userId, user]);

  useEffect(() => {
    if (output.length > 0) {
      setShowOutput(true);
    }
  }, [output]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.focus();

    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      setCursorPosition({
        line: position.lineNumber,
        column: position.column,
      });
    });

    let timeout;
    editor.onDidChangeModelContent(() => {
      const content = editor.getValue();
      setWordCount(content.trim().split(/\s+/).length);
      setHasChanges(true);
      
      // Debounce the update
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handleEditorChange(content);
      }, 500);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleEditorChange = (value) => {
    if (value === lastUpdateFromServer) return;
    
    fetch('/api/socket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        userId,
        username: getDisplayName(user),
        event: 'codeUpdate',
        data: value,
      }),
    });
  };

  const handleLanguageChange = (newLanguage) => {
    if (hasChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Are you sure you want to change languages?"
      );
      if (!confirm) return;
    }
    setLanguage(newLanguage);
    const newCode = CODE_SNIPPETS[newLanguage] || "";
    setCode(newCode);
    setFileName(`main.${getFileExtension(newLanguage)}`);
  };

  const handleSave = () => {
    setHasChanges(false);
  };

  const handleRunCode = async () => {
    if (!editorRef.current) {
      console.error('Editor not initialized');
      return;
    }

    try {
      setLoading(true);
      setIsRunning(true);
      const startTime = performance.now();
      
      const result = await executeCode(language, code);
      
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
      setExecutionTimestamp(new Date());
      
      setOutput(result.run.output.split("\n"));
      setIsError(result.run.stderr ? true : false);
    } catch (error) {
      console.error("Error running code:", error);
      setOutput([error.message || "An error occurred while running the code"]);
      setIsError(true);
    } finally {
      setLoading(false);
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  const handleClear = () => {
    const newCode = "";
    setCode(newCode);
    fetch('/api/socket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        userId,
        username: getDisplayName(user),
        event: 'codeUpdate',
        data: newCode,
      }),
    });
  };

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setShowCopySuccess(prev => ({ ...prev, code: true }));
      setTimeout(() => setShowCopySuccess(prev => ({ ...prev, code: false })), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://inherit-xtradrill.vercel.app/playground/${roomId}`);
      setShowCopySuccess(prev => ({ ...prev, link: true }));
      setTimeout(() => setShowCopySuccess(prev => ({ ...prev, link: false })), 2000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const handleCloseOutput = () => {
    setShowOutput(false);
  };

  const handleClearOutput = () => {
    setOutput([]);
    setShowOutput(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Room: {roomId}</h1>
          <div className="flex items-center space-x-2">
            <CollaboratorAvatars collaborators={collaborators} />
            <span className="text-sm text-gray-500">
              {collaborators.length} {collaborators.length === 1 ? 'user' : 'users'} active
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCopyRoomCode}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2
              ${showCopySuccess.code 
                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {showCopySuccess.code ? (
              <>
                <span>Copied!</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            ) : (
              <>
                <span>Copy Code</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </>
            )}
          </button>
          <button
            onClick={handleCopyShareLink}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2
              ${showCopySuccess.link 
                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {showCopySuccess.link ? (
              <>
                <span>Copied!</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            ) : (
              <>
                <span>Share Link</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <EditorHeader
          fileName={fileName}
          language={language}
          languages={SUPPORTED_LANGUAGES}
          onLanguageChange={handleLanguageChange}
          onFileNameChange={setFileName}
          onCopy={handleCopy}
          onClear={handleClear}
          onRun={handleRunCode}
          isRunning={isRunning}
          code={code}
          onCodeChange={handleEditorChange}
        />
        
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language}
              value={code}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                scrollbar: {
                  vertical: 'visible',
                  verticalScrollbarSize: 10,
                },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                overviewRulerLanes: 0,
                padding: { top: 10, bottom: 10 },
              }}
              onMount={handleEditorDidMount}
            />
          </div>
          {showOutput && (
            <div className="w-1/3 overflow-hidden bg-gray-900 border-l border-gray-700">
              <OutputPanel
                output={output}
                isError={isError}
                executionTime={executionTime}
                executionTimestamp={executionTimestamp}
                onClose={handleCloseOutput}
                onClear={handleClearOutput}
              />
            </div>
          )}
        </div>
      </div>
      <EditorFooter
        language={language}
        position={cursorPosition}
        wordCount={wordCount}
        onRun={handleRunCode}
        loading={loading}
        hasChanges={hasChanges}
      />
    </div>
  );
};

export default RoomPage;
