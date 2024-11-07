"use client";
import React, { useState } from "react";
import axios from "axios";

const ExecutionBlock = ({ code, language = "javascript" }) => {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const runCode = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://emkc.org/api/v2/piston/execute",
        {
          language,
          source: code,
        }
      );
      setOutput(response.data.run.output);
    } catch (error) {
      setOutput("Error executing code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 border border-gray-300 rounded bg-gray-900 text-white">
      <button
        onClick={runCode}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        disabled={isLoading}
      >
        {isLoading ? "Running..." : "Run Code"}
      </button>

      <div className="mt-4">
        <h3 className="text-lg font-bold">Output:</h3>
        <pre className="mt-2 bg-black p-3 rounded text-green-400">
          {output || "// Output will appear here"}
        </pre>
      </div>
    </div>
  );
};

export default ExecutionBlock;
