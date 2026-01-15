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

// Import error boundary
import { FeatureErrorBoundary } from "@/components/error";

const SUPPORTED_LANGUAGES = [
  { id: "javascript", name: "JavaScript" },
  { id: "python", name: "Python" },
  { id: "java", name: "Java" },
  { id: "cpp", name: "C++" },
  { id: "csharp", name: "C#" },
  { id: "php", name: "PHP" },
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

  // Force Monaco theme reload on mount
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      try {
        monacoRef.current.editor.setTheme("cosmic-glass");
      } catch (e) {
        console.log("Theme will load on editor mount");
      }
    }
  }, []);

  useEffect(() => {
    // Load saved code and metadata from localStorage
    const savedCode = localStorage.getItem(`code-${language}`);
    const savedMetadata = JSON.parse(
      localStorage.getItem(`metadata-${language}`) || "{}"
    );

    if (savedCode) {
      setValue(savedCode);
      setFileName(
        savedMetadata.fileName || `main.${getFileExtension(language)}`
      );
      setLastSaved(
        savedMetadata.lastSaved ? new Date(savedMetadata.lastSaved) : null
      );
    } else {
      setValue(CODE_SNIPPETS[language]);
      setFileName(`main.${getFileExtension(language)}`);
    }
  }, [language]);

  const getFileExtension = (lang) => {
    const extensions = {
      javascript: "js",
      python: "py",
      java: "java",
      cpp: "cpp",
      csharp: "cs",
      php: "php",
    };
    return extensions[lang] || "txt";
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define Cosmic Glass Theme
    monaco.editor.defineTheme("cosmic-glass", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        { token: "keyword", foreground: "8B5CF6", fontStyle: "bold" },
        { token: "string", foreground: "06B6D4" },
        { token: "number", foreground: "F59E0B" },
        { token: "function", foreground: "10B981" },
        { token: "variable", foreground: "E5E7EB" },
        { token: "type", foreground: "A78BFA" },
        { token: "class", foreground: "EC4899" },
      ],
      colors: {
        "editor.background": "#030014",
        "editor.foreground": "#E5E7EB",
        "editor.lineHighlightBackground": "#1E1B4B20",
        "editor.selectionBackground": "#8B5CF640",
        "editor.inactiveSelectionBackground": "#8B5CF620",
        "editorCursor.foreground": "#06B6D4",
        "editorWhitespace.foreground": "#6B728040",
        "editorIndentGuide.background": "#6B728020",
        "editorIndentGuide.activeBackground": "#8B5CF660",
        "editorLineNumber.foreground": "#6B7280",
        "editorLineNumber.activeForeground": "#06B6D4",
        "editor.selectionHighlightBackground": "#8B5CF630",
        "editor.wordHighlightBackground": "#06B6D420",
        "editor.findMatchBackground": "#F59E0B40",
        "editor.findMatchHighlightBackground": "#F59E0B20",
        "editorBracketMatch.background": "#8B5CF640",
        "editorBracketMatch.border": "#8B5CF6",
        "scrollbarSlider.background": "#6B728040",
        "scrollbarSlider.hoverBackground": "#6B728060",
        "scrollbarSlider.activeBackground": "#6B728080",
        "minimap.background": "#03001410",
        "minimapSlider.background": "#6B728040",
        "minimapSlider.hoverBackground": "#6B728060",
      },
    });

    // Apply the theme
    console.log("🎨 Applying Cosmic Glass theme...");
    monaco.editor.setTheme("cosmic-glass");
    console.log("✅ Cosmic Glass theme applied!");

    editor.focus();

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      setCursorPosition({
        line: position.lineNumber,
        column: position.column,
      });
    });

    // Track content changes
    editor.onDidChangeModelContent(() => {
      const content = editor.getValue();
      setWordCount(content.trim().split(/\s+/).length);
      setHasChanges(true);
    });

    // Keyboard Shortcuts

    // Ctrl/Cmd + S: Save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // Ctrl/Cmd + R: Run Code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      runCode();
    });

    // Ctrl/Cmd + Shift + R: Get AI Review
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyR,
      () => {
        handleReview();
      }
    );

    // Ctrl/Cmd + D: Duplicate Line
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.trigger("keyboard", "editor.action.copyLinesDownAction", {});
    });

    // Alt + Up/Down: Move Line Up/Down
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
      editor.trigger("keyboard", "editor.action.moveLinesUpAction", {});
    });
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
      editor.trigger("keyboard", "editor.action.moveLinesDownAction", {});
    });

    // Ctrl/Cmd + /: Toggle Comment
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.trigger("keyboard", "editor.action.commentLine", {});
    });

    // Ctrl/Cmd + Shift + K: Delete Line
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK,
      () => {
        editor.trigger("keyboard", "editor.action.deleteLines", {});
      }
    );

    // Ctrl/Cmd + Shift + F: Format Document
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        editor.trigger("keyboard", "editor.action.formatDocument", {});
      }
    );
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

    setValue(CODE_SNIPPETS[language]);
    setHasChanges(false);
    setLastSaved(null);
    setCursorPosition({ line: 1, column: 1 });
    setWordCount(0);
    setOutput([]);
    setIsError(false);
    setExecutionTime(null);
    setExecutionTimestamp(null);
    setReview("");
    setLoading(false);
    setActiveTab("editor");

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
    if (!editorRef.current) return;

    if (activeTab !== "editor") {
      setActiveTab("editor");
      await new Promise((resolve) => setTimeout(resolve, 100));
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
      setOutput([error.message || "An error occurred while running the code"]);
      setIsError(true);
      setActiveTab("output");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!editorRef.current) return;

    if (activeTab !== "editor") {
      setActiveTab("editor");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const code = editorRef.current.getValue();
    if (!code) return;

    try {
      setLoading(true);
      const reviewText = await generateReview(code);
      setReview(reviewText);
      setActiveTab("review");
    } catch (error) {
      setReview("Failed to get code review. Please try again.");
      setActiveTab("review");
    } finally {
      setLoading(false);
    }
  };

  const applyCodeFix = (newCode, lineNumber) => {
    if (activeTab !== "editor") {
      setActiveTab("editor");
      setTimeout(() => applyCodeFix(newCode, lineNumber), 100);
      return;
    }

    if (!editorRef.current || !newCode) return;

    const editor = editorRef.current;
    const maxRetries = 10;
    let retryCount = 0;

    const tryApplyFix = () => {
      if (retryCount >= maxRetries) return;

      if (!editor.getModel()) {
        retryCount++;
        setTimeout(tryApplyFix, 100);
        return;
      }

      try {
        const model = editor.getModel();
        const currentValue = model.getValue();
        const lines = currentValue.split("\n");

        let range;
        if (lineNumber && lineNumber > 0 && lineNumber <= lines.length) {
          range = {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: lines[lineNumber - 1].length + 1,
          };
        } else {
          const bestMatch = findBestMatchingLine(lines, newCode);
          if (bestMatch.index >= 0) {
            range = {
              startLineNumber: bestMatch.index + 1,
              startColumn: 1,
              endLineNumber: bestMatch.index + 1,
              endColumn: lines[bestMatch.index].length + 1,
            };
          } else {
            const position = editor.getPosition();
            range = {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            };
          }
        }

        const success = editor.executeEdits("ai-fix", [
          {
            range,
            text: newCode,
            forceMoveMarkers: true,
          },
        ]);

        if (success) {
          setValue(editor.getValue());
          editor.focus();

          setTimeout(() => {
            try {
              const formatAction = editor.getAction(
                "editor.action.formatDocument"
              );
              if (formatAction) {
                formatAction.run();
              }
            } catch (formatError) {
              // Formatting failed silently
            }
          }, 100);
        }
      } catch (error) {
        // Edit failed silently
      }
    };

    tryApplyFix();
  };

  const findBestMatchingLine = (lines, newCode) => {
    const newCodeTrimmed = newCode.trim();
    let bestIndex = -1;
    let bestScore = 0;

    lines.forEach((line, index) => {
      const lineTrimmed = line.trim();
      let score = 0;
      const words = newCodeTrimmed.split(/\W+/);

      words.forEach((word) => {
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
    const blob = new Blob([code], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".js,.py,.java,.cpp,.cs,.php";
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
    <FeatureErrorBoundary feature="Code Editor" variant="card">
      <div className="flex flex-col h-full bg-gray-900 text-gray-300">
        <EditorHeader
          fileName={fileName}
          language={language}
          languages={SUPPORTED_LANGUAGES}
          onLanguageChange={handleLanguageChange}
          onFileNameChange={setFileName}
          onExport={handleExport}
          onImport={handleImport}
          onCopy={() =>
            navigator.clipboard.writeText(editorRef.current?.getValue())
          }
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
              theme="cosmic-glass"
              language={language}
              value={value}
              onChange={(newValue) => {
                setValue(newValue);
                setHasChanges(true);
              }}
              onMount={handleEditorDidMount}
              options={{
                // Font & Display
                fontSize: 14,
                fontFamily:
                  "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                fontLigatures: true, // Enable font ligatures (e.g., => becomes arrow)
                lineHeight: 22,
                letterSpacing: 0.5,

                // Minimap (Code Overview)
                minimap: {
                  enabled: true,
                  side: "right",
                  showSlider: "mouseover",
                  renderCharacters: false, // Faster rendering
                  maxColumn: 80,
                  scale: 1,
                },

                // Line Numbers & Guides
                lineNumbers: "on",
                lineNumbersMinChars: 3,
                glyphMargin: true, // Space for breakpoints/icons
                renderLineHighlight: "all", // Highlight current line
                renderLineHighlightOnlyWhenFocus: false,
                guides: {
                  indentation: true,
                  highlightActiveIndentation: true,
                  bracketPairs: true,
                  bracketPairsHorizontal: "active",
                },

                // Scrolling
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                scrollbar: {
                  vertical: "visible",
                  horizontal: "visible",
                  useShadows: true,
                  verticalScrollbarSize: 14,
                  horizontalScrollbarSize: 14,
                  arrowSize: 30,
                },

                // Whitespace & Formatting
                renderWhitespace: "selection",
                renderControlCharacters: true,
                formatOnPaste: true,
                formatOnType: true,
                autoIndent: "full",
                tabSize: 2,
                insertSpaces: true,
                detectIndentation: true,
                trimAutoWhitespace: true,

                // Bracket Matching
                bracketPairColorization: {
                  enabled: true,
                  independentColorPoolPerBracketType: true,
                },
                matchBrackets: "always",
                autoClosingBrackets: "always",
                autoClosingQuotes: "always",
                autoClosingDelete: "always",
                autoClosingOvertype: "always",
                autoSurround: "languageDefined",

                // Word Wrap
                wordWrap: "on",
                wordWrapColumn: 120,
                wrappingIndent: "indent",
                wrappingStrategy: "advanced",

                // IntelliSense & Suggestions
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnCommitCharacter: true,
                acceptSuggestionOnEnter: "on",
                tabCompletion: "on",
                quickSuggestions: {
                  other: true,
                  comments: true,
                  strings: true,
                },
                quickSuggestionsDelay: 10,
                suggestSelection: "first",
                snippetSuggestions: "top", // Show snippets first
                wordBasedSuggestions: true,
                wordBasedSuggestionsMode: "matchingDocuments",

                // Inline Suggestions (GitHub Copilot-style)
                inlineSuggest: {
                  enabled: true,
                  mode: "subwordSmart",
                },

                // Parameter Hints
                parameterHints: {
                  enabled: true,
                  cycle: true,
                },

                // Code Folding
                folding: true,
                foldingHighlight: true,
                foldingStrategy: "indentation",
                foldingImportsByDefault: false,
                showFoldingControls: "mouseover",
                unfoldOnClickAfterEndOfLine: true,

                // Find & Replace
                find: {
                  addExtraSpaceOnTop: true,
                  autoFindInSelection: "multiline",
                  seedSearchStringFromSelection: "selection",
                  globalFindClipboard: false,
                },

                // Multi-Cursor & Selection
                multiCursorModifier: "ctrlCmd",
                multiCursorMergeOverlapping: true,
                multiCursorPaste: "spread",
                selectionHighlight: true,
                occurrencesHighlight: true,
                selectionClipboard: false,

                // Context Menu & Interactions
                contextmenu: true,
                mouseWheelZoom: true,
                mouseWheelScrollSensitivity: 1,
                fastScrollSensitivity: 5,
                links: true,
                colorDecorators: true,

                // Code Lens (Inline code info)
                codeLens: true,
                codeLensFontFamily: "'Fira Code', monospace",
                codeLensFontSize: 12,

                // Sticky Scroll (Keep function/class names visible)
                stickyScroll: {
                  enabled: true,
                  maxLineCount: 5,
                },

                // Hover
                hover: {
                  enabled: true,
                  delay: 300,
                  sticky: true,
                },

                // Performance
                renderValidationDecorations: "on",
                renderFinalNewline: "on",
                unicodeHighlight: {
                  ambiguousCharacters: true,
                  invisibleCharacters: true,
                },

                // Accessibility
                accessibilitySupport: "auto",
                accessibilityPageSize: 10,

                // Cursor
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                cursorStyle: "line",
                cursorWidth: 2,

                // Padding
                padding: {
                  top: 16,
                  bottom: 16,
                },
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
            <AIReviewPanel review={review} />
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-gray-800 rounded-lg shadow-xl p-4 flex items-center space-x-3">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span className="text-sm font-medium">
                  {activeTab === "review"
                    ? "Analyzing code..."
                    : "Running code..."}
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
    </FeatureErrorBoundary>
  );
};

export default CodeWorkspace;
