"use client";

import { useState, useEffect } from "react";

function formatDateForInput(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16); // Format: "YYYY-MM-DDThh:mm"
}

export default function QuestForm({ quest, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    quest
      ? {
          ...quest,
          startTime: formatDateForInput(quest.startTime),
          endTime: formatDateForInput(quest.endTime),
        }
      : {
          name: "",
          timeLimit: 60,
          level: "beginner",
          questions: [],
          startTime: "",
          endTime: "",
          isActive: false,
        }
  );

  const [newQuestion, setNewQuestion] = useState({
    type: "short",
    title: "",
    description: "",
    points: 0,
    testCases: [],
  });

  useEffect(() => {
    if (quest) {
      setFormData({
        ...quest,
        startTime: formatDateForInput(quest.startTime),
        endTime: formatDateForInput(quest.endTime),
      });
    }
  }, [quest]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting form data:", formData); // Debug log
    onSave(formData);
  };

  const addQuestion = () => {
    if (!newQuestion.title || !newQuestion.description) {
      alert("Please fill in both title and description for the question");
      return;
    }

    const questionToAdd = {
      ...newQuestion,
      testCases: newQuestion.type === "coding" ? newQuestion.testCases : [],
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, questionToAdd],
    }));

    // Reset new question form
    setNewQuestion({
      type: "short",
      title: "",
      description: "",
      points: 0,
      testCases: [],
    });

    console.log("Question added:", questionToAdd); // Debug log
    console.log("Updated questions array:", [...formData.questions, questionToAdd]); // Debug log
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const addTestCase = () => {
    setNewQuestion(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "" }],
    }));
  };

  const updateTestCase = (index, field, value) => {
    const updatedTestCases = [...newQuestion.testCases];
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      [field]: value,
    };
    setNewQuestion(prev => ({
      ...prev,
      testCases: updatedTestCases,
    }));
  };

  const removeTestCase = (index) => {
    setNewQuestion(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8 bg-white p-6 rounded shadow">
      <div>
        <label className="block mb-2">Quest Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-2">Time Limit (minutes)</label>
        <input
          type="number"
          value={formData.timeLimit}
          onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-2">Level</label>
        <select
          value={formData.level}
          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div>
        <label className="block mb-2">Start Time</label>
        <input
          type="datetime-local"
          value={formData.startTime}
          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-2">End Time</label>
        <input
          type="datetime-local"
          value={formData.endTime}
          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          <span>Active</span>
        </label>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">Questions ({formData.questions.length})</h3>
        
        {/* Display existing questions */}
        {formData.questions.map((q, index) => (
          <div key={index} className="mb-4 p-4 border rounded bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{q.title}</h4>
                <p className="text-sm text-gray-600">{q.type} - {q.points} points</p>
                <p className="mt-2">{q.description}</p>
                {q.type === "coding" && q.testCases.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">Test Cases:</p>
                    {q.testCases.map((test, i) => (
                      <div key={i} className="text-sm">
                        <span>Input: {test.input}</span>
                        <span className="ml-2">Expected: {test.expectedOutput}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {/* New question form */}
        <div className="space-y-4 border p-4 rounded mt-4">
          <h4 className="font-semibold">Add New Question</h4>
          
          <div>
            <label className="block mb-2">Question Type</label>
            <select
              value={newQuestion.type}
              onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="short">Short Question</option>
              <option value="coding">Coding Assignment</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Title</label>
            <input
              type="text"
              value={newQuestion.title}
              onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-2">Description</label>
            <textarea
              value={newQuestion.description}
              onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
              className="w-full p-2 border rounded"
              rows="3"
            />
          </div>

          <div>
            <label className="block mb-2">Points</label>
            <input
              type="number"
              value={newQuestion.points}
              onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>

          {newQuestion.type === "coding" && (
            <div>
              <label className="block mb-2">Test Cases</label>
              {newQuestion.testCases.map((testCase, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center">
                  <input
                    type="text"
                    placeholder="Input"
                    value={testCase.input}
                    onChange={(e) => updateTestCase(index, "input", e.target.value)}
                    className="flex-1 p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Expected Output"
                    value={testCase.expectedOutput}
                    onChange={(e) => updateTestCase(index, "expectedOutput", e.target.value)}
                    className="flex-1 p-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addTestCase}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                + Add Test Case
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={addQuestion}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Question
          </button>
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Save Quest
        </button>
      </div>
    </form>
  );
}
