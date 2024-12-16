"use client";

import { FiX } from 'react-icons/fi';

const KeyboardShortcuts = ({ onClose }) => {
  const shortcuts = [
    {
      category: "General",
      items: [
        { key: "Ctrl + S", description: "Save changes" },
        { key: "Ctrl + Z", description: "Undo" },
        { key: "Ctrl + Y", description: "Redo" },
        { key: "Ctrl + F", description: "Find" },
        { key: "Ctrl + H", description: "Replace" },
        { key: "Ctrl + /", description: "Toggle comment" },
      ]
    },
    {
      category: "Navigation",
      items: [
        { key: "Ctrl + G", description: "Go to line" },
        { key: "Ctrl + P", description: "Quick open file" },
        { key: "Ctrl + Home", description: "Go to beginning" },
        { key: "Ctrl + End", description: "Go to end" },
        { key: "Alt + ↑/↓", description: "Move line up/down" },
      ]
    },
    {
      category: "Editor",
      items: [
        { key: "Ctrl + D", description: "Add selection to next find match" },
        { key: "Ctrl + Space", description: "Trigger suggestion" },
        { key: "Shift + Alt + F", description: "Format document" },
        { key: "Ctrl + ]", description: "Indent line" },
        { key: "Ctrl + [", description: "Outdent line" },
      ]
    },
    {
      category: "Run & Debug",
      items: [
        { key: "F5", description: "Run code" },
        { key: "Ctrl + F5", description: "Run without debugging" },
        { key: "Shift + Enter", description: "Run selected code" },
        { key: "F9", description: "Toggle breakpoint" },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-4rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h3 className="text-lg font-medium text-white mb-4">
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.items.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between text-sm"
                    >
                      <code className="px-2 py-1 rounded bg-gray-800 text-blue-400 font-mono">
                        {shortcut.key}
                      </code>
                      <span className="text-gray-300">{shortcut.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-800 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            Tip: You can customize these shortcuts in your settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
