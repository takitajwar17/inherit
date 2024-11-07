import { useState } from "react";
import { executeCode } from "@/app/api/Piston/api";

const Output = ({ editorRef, language }) => {
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;
    try {
      setIsLoading(true);
      const { run: result } = await executeCode(language, sourceCode);
      setOutput(result.output.split("\n"));
      result.stderr ? setIsError(true) : setIsError(false);
    } catch (error) {
      console.log(error);
      alert("An error occurred: " + (error.message || "Unable to run code"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-1/2">
      <span className="mb-2 text-lg block">Output</span>
      <button
        className="mb-4 border border-green-500 text-green-500 px-4 py-2 rounded"
        disabled={isLoading}
        onClick={runCode}
      >
        {isLoading ? "Running..." : "Run Code"}
      </button>
      <div
        className={`h-75vh p-2 border rounded-md ${
          isError ? "border-red-500" : "border-gray-700"
        }`}
      >
        {output
          ? output.map((line, i) => <p key={i}>{line}</p>)
          : 'Click "Run Code" to see the output here'}
      </div>
    </div>
  );
};

export default Output;
