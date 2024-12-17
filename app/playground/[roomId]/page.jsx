"use client";

import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Editor } from "@monaco-editor/react";
import { executeCode } from "@/app/api/Piston/api";
import { CODE_SNIPPETS } from "@/app/constants";
import EditorHeader from "@/components/playground/editor/EditorHeader";
import EditorFooter from "@/components/learn/editor/EditorFooter";
import OutputPanel from "@/components/learn/editor/OutputPanel";
import CollaboratorAvatars from "../../../components/playground/CollaboratorAvatars";

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
  const [collaborators, setCollaborators] = useState([]);
  const [code, setCode] = useState(CODE_SNIPPETS['javascript']);
  const socket = useRef(null);
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

  useEffect(() => {
    // Connect to Socket.IO server
    socket.current = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL, {
      query: { roomId, userId },
    });

    // Listen for collaborators
    socket.current.on("collaboratorsUpdate", (updatedCollaborators) => {
      setCollaborators(updatedCollaborators);
    });

    // Receive initial code state or updates
    socket.current.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    return () => {
      socket.current.disconnect();
    };
  }, [roomId, userId]);

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

    editor.onDidChangeModelContent(() => {
      const content = editor.getValue();
      setWordCount(content.trim().split(/\s+/).length);
      setHasChanges(true);
      handleCodeChange(content);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.current.emit("codeUpdate", newCode);
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
    socket.current.emit("codeUpdate", newCode);
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
    socket.current.emit("codeUpdate", newCode);
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
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-100 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with room info and collaborators */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-b border-gray-700">
          <div className="flex justify-between items-center px-6 py-3">
            <div className="flex items-center space-x-3">
              <span className="text-gray-400 text-sm font-medium">Room</span>
              <span className="font-mono text-lg font-semibold tracking-wide">{roomId}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyRoomCode}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2
                  ${showCopySuccess.code 
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
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
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
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
            <CollaboratorAvatars collaborators={collaborators} />
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
            onCodeChange={handleCodeChange}
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
    </div>
  );
};

export default RoomPage;
