"use client";

import { useRef, useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import { executeCode } from "@/app/api/Piston/api";
import { generateReview } from "@/lib/actions/codeReview";
import { CODE_SNIPPETS } from "@/app/constants";

// Import components
import EditorHeader from "./editor/EditorHeader";
import EditorFooter from "./editor/EditorFooter";
import OutputPanel from "./editor/OutputPanel";
import AIReviewPanel from "./editor/AIReviewPanel";
import KeyboardShortcuts from "./editor/KeyboardShortcuts";

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
  { id: 'csharp', name: 'C#' },
];

const CodeWorkspace = () => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [activeTab, setActiveTab] = useState("editor");
  const [output, setOutput] = useState([]);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [fileName, setFileName] = useState("main.js");
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [wordCount, setWordCount] = useState(0);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [executionTimestamp, setExecutionTimestamp] = useState(null);

  useEffect(() => {
    // Load saved code and metadata from localStorage
    const savedCode = localStorage.getItem(`code-${language}`);
    const savedMetadata = JSON.parse(localStorage.getItem(`metadata-${language}`) || '{}');
    
    if (savedCode) {
      setValue(savedCode);
      setFileName(savedMetadata.fileName || `main.${getFileExtension(language)}`);
      setLastSaved(savedMetadata.lastSaved ? new Date(savedMetadata.lastSaved) : null);
    } else {
      setValue(CODE_SNIPPETS[language]);
      setFileName(`main.${getFileExtension(language)}`);
    }
  }, [language]);

  const getFileExtension = (lang) => {
    const extensions = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      csharp: 'cs'
    };
    return extensions[lang] || 'txt';
  };

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
      setWordCount(content.trim().split(/\\s+/).length);
      setHasChanges(true);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleSave = () => {
    const code = editorRef.current.getValue();
    const metadata = {
      fileName,
      lastSaved: new Date().toISOString(),
      language,
    };
    
    localStorage.setItem(`code-${language}`, code);
    localStorage.setItem(`metadata-${language}`, JSON.stringify(metadata));
    
    setLastSaved(new Date());
    setHasChanges(false);
  };

  const handleReset = () => {
    if (hasChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Are you sure you want to reset?"
      );
      if (!confirm) return;
    }

    // Reset code to default snippet
    setValue(CODE_SNIPPETS[language]);
    
    // Reset editor states
    setHasChanges(false);
    setLastSaved(null);
    setCursorPosition({ line: 1, column: 1 });
    setWordCount(0);
    
    // Reset output panel
    setOutput([]);
    setIsError(false);
    setExecutionTime(null);
    setExecutionTimestamp(null);
    
    // Reset AI review
    setReview("");
    
    // Reset loading state
    setLoading(false);
    
    // Switch back to editor tab
    setActiveTab("editor");

    // Focus editor after reset
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleLanguageChange = (newLanguage) => {
    if (hasChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Are you sure you want to change languages?"
      );
      if (!confirm) return;
    }
    setLanguage(newLanguage);
    setFileName(`main.${getFileExtension(newLanguage)}`);
  };

  const runCode = async () => {
    if (!editorRef.current) {
      console.error('Editor not initialized');
      return;
    }

    // Switch to editor tab first if not already there
    if (activeTab !== "editor") {
      setActiveTab("editor");
      // Wait for tab switch and editor to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;

    try {
      setLoading(true);
      const startTime = performance.now();
      
      const { run: result } = await executeCode(language, sourceCode);
      
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
      setExecutionTimestamp(new Date());
      
      setOutput(result.output.split("\n"));
      setIsError(result.stderr ? true : false);
      setActiveTab("output");
    } catch (error) {
      console.error("Error running code:", error);
      setOutput([error.message || "An error occurred while running the code"]);
      setIsError(true);
      setActiveTab("output");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!editorRef.current) {
      console.error('Editor not initialized');
      return;
    }

    // Switch to editor tab first if not already there
    if (activeTab !== "editor") {
      setActiveTab("editor");
      // Wait for tab switch and editor to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const code = editorRef.current.getValue();
    if (!code) return;

    try {
      setLoading(true);
      const reviewText = await generateReview(code);
      setReview(reviewText);
      setActiveTab("review");
    } catch (error) {
      console.error("Error getting review:", error);
      setReview("Failed to get code review. Please try again.");
      setActiveTab("review");
    } finally {
      setLoading(false);
    }
  };

  const applyCodeFix = (newCode, lineNumber) => {
    console.log('Applying fix:', { newCode, lineNumber });
    
    // First check if we're in editor tab
    if (activeTab !== "editor") {
      console.log('Switching to editor tab first');
      setActiveTab("editor");
      // Wait for tab switch and try again
      setTimeout(() => applyCodeFix(newCode, lineNumber), 100);
      return;
    }

    if (!editorRef.current || !newCode) {
      console.error('Editor or code missing:', { 
        hasEditor: !!editorRef.current, 
        hasCode: !!newCode 
      });
      return;
    }

    const editor = editorRef.current;
    
    // Add max retry count to prevent infinite loop
    const maxRetries = 10;
    let retryCount = 0;

    const tryApplyFix = () => {
      if (retryCount >= maxRetries) {
        console.error('Max retries reached, editor model not ready');
        return;
      }

      if (!editor.getModel()) {
        console.log(`Editor model not ready, retry ${retryCount + 1}/${maxRetries}`);
        retryCount++;
        setTimeout(tryApplyFix, 100);
        return;
      }

      try {
        const model = editor.getModel();
        const currentValue = model.getValue();
        const lines = currentValue.split('\n');
        
        let range;
        if (lineNumber && lineNumber > 0 && lineNumber <= lines.length) {
          range = {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: lines[lineNumber - 1].length + 1
          };
        } else {
          // Find best matching line if no line number provided
          const bestMatch = findBestMatchingLine(lines, newCode);
          if (bestMatch.index >= 0) {
            range = {
              startLineNumber: bestMatch.index + 1,
              startColumn: 1,
              endLineNumber: bestMatch.index + 1,
              endColumn: lines[bestMatch.index].length + 1
            };
          } else {
            // If no match found, insert at cursor position
            const position = editor.getPosition();
            range = {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            };
          }
        }

        const success = editor.executeEdits('ai-fix', [{
          range,
          text: newCode,
          forceMoveMarkers: true
        }]);

        if (success) {
          console.log('Edit applied successfully');
          setValue(editor.getValue());
          editor.focus();
          
          // Format document after successful edit
          setTimeout(() => {
            try {
              const formatAction = editor.getAction('editor.action.formatDocument');
              if (formatAction) {
                formatAction.run();
              }
            } catch (formatError) {
              console.warn('Format error:', formatError);
            }
          }, 100);
        } else {
          console.error('Edit operation failed');
        }
      } catch (error) {
        console.error('Error applying fix:', error);
      }
    };

    // Start the first attempt
    tryApplyFix();
  };

  // Helper function to find best matching line
  const findBestMatchingLine = (lines, newCode) => {
    const newCodeTrimmed = newCode.trim();
    let bestIndex = -1;
    let bestScore = 0;

    lines.forEach((line, index) => {
      const lineTrimmed = line.trim();
      let score = 0;
      const words = newCodeTrimmed.split(/\W+/);
      
      words.forEach(word => {
        if (lineTrimmed.includes(word)) score++;
      });

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    return { index: bestIndex, score: bestScore };
  };

  const handleExport = () => {
    const code = editorRef.current.getValue();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,.py,.java,.cpp,.cs';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        setValue(text);
        setFileName(file.name);
        setHasChanges(true);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-300">
      <EditorHeader
        fileName={fileName}
        language={language}
        languages={SUPPORTED_LANGUAGES}
        onLanguageChange={handleLanguageChange}
        onFileNameChange={setFileName}
        onExport={handleExport}
        onImport={handleImport}
        onCopy={() => navigator.clipboard.writeText(editorRef.current?.getValue())}
        onClear={handleReset}
        showKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
        onRun={runCode}
        onReview={handleReview}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        isRunning={loading && activeTab === "output"}
        isReviewing={loading && activeTab === "review"}
        hasOutput={output.length > 0}
        hasReview={review !== ""}
      />

      <div className="flex-1 relative">
        {activeTab === "editor" && (
          <Editor
            height="100%"
            theme="vs-dark"
            language={language}
            value={value}
            onChange={(newValue) => {
              setValue(newValue);
              setHasChanges(true);
            }}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              fontFamily: "'Fira Code', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              renderWhitespace: "selection",
              bracketPairColorization: true,
              formatOnPaste: true,
              formatOnType: true,
              tabSize: 2,
              autoClosingBrackets: "always",
              autoClosingQuotes: "always",
              wordWrap: "on",
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              folding: true,
              foldingHighlight: true,
              foldingStrategy: "indentation",
              showFoldingControls: "always",
              contextmenu: true,
              mouseWheelZoom: true,
              parameterHints: true,
              codeLens: true,
            }}
          />
        )}

        {activeTab === "output" && (
          <OutputPanel
            output={output}
            isError={isError}
            onClose={() => setActiveTab("editor")}
            onClear={() => setOutput([])}
            timestamp={executionTimestamp}
            executionTime={executionTime}
          />
        )}

        {activeTab === "review" && review && (
          <AIReviewPanel
            review={review}
          />
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-gray-800 rounded-lg shadow-xl p-4 flex items-center space-x-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-sm font-medium">
                {activeTab === "review" ? "Analyzing code..." : "Running code..."}
              </span>
            </div>
          </div>
        )}
      </div>

      <EditorFooter
        language={language}
        position={cursorPosition}
        wordCount={wordCount}
        lastSaved={lastSaved}
      />

      {showKeyboardShortcuts && (
        <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} />
      )}
    </div>
  );
};

export default CodeWorkspace;
