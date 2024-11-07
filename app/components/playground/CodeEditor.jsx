"use client";
import React, { useRef, useEffect, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { io } from "socket.io-client";

const CodeEditor = ({ roomId }) => {
  const [code, setCode] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.IO client
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL, {
      query: { roomId },
    });

    // Listen for code updates from other collaborators
    socketRef.current.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    // Cleanup on component unmount
    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId]);

  const handleEditorChange = (newCode) => {
    setCode(newCode);
    // Emit code updates to other collaborators
    socketRef.current.emit("codeUpdate", newCode);
  };

  return (
    <div className="h-full w-full border border-gray-300 rounded">
      <Editor
        height="90vh"
        defaultLanguage="javascript"
        defaultValue="// Start coding here..."
        value={code}
        onChange={handleEditorChange}
        theme="vs-dark"
      />
    </div>
  );
};

export default CodeEditor;
