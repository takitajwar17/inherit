"use client";

import { useState, useEffect } from "react";
import QuestForm from "./QuestForm";
import Cookies from "js-cookie";

export default function QuestList() {
  const [quests, setQuests] = useState([]);
  const [isAddingQuest, setIsAddingQuest] = useState(false);
  const [editingQuest, setEditingQuest] = useState(null);

  const getAuthHeader = () => {
    const adminAuth = Cookies.get("adminAuth");
    return {
      Authorization: `Basic ${adminAuth}`,
    };
  };

  const fetchQuests = async () => {
    try {
      const response = await fetch("/api/admin/quests", {
        headers: getAuthHeader(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch quests");
      }
      const data = await response.json();
      setQuests(data);
    } catch (error) {
      console.error("Error fetching quests:", error);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this quest?")) return;

    try {
      const response = await fetch(`/api/admin/quests/${id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete quest");
      }
      
      fetchQuests();
    } catch (error) {
      console.error("Error deleting quest:", error);
    }
  };

  const handleSave = async (questData) => {
    try {
      const url = editingQuest
        ? `/api/admin/quests/${editingQuest._id}`
        : "/api/admin/quests";
      const method = editingQuest ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(questData),
      });

      if (!response.ok) {
        throw new Error("Failed to save quest");
      }

      setIsAddingQuest(false);
      setEditingQuest(null);
      fetchQuests();
    } catch (error) {
      console.error("Error saving quest:", error);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsAddingQuest(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Add New Quest
      </button>

      {(isAddingQuest || editingQuest) && (
        <QuestForm
          quest={editingQuest}
          onSave={handleSave}
          onCancel={() => {
            setIsAddingQuest(false);
            setEditingQuest(null);
          }}
        />
      )}

      <div className="grid gap-4">
        {quests.map((quest) => (
          <div
            key={quest._id}
            className="border p-4 rounded shadow-sm"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{quest.name}</h3>
              <div className="space-x-2">
                <button
                  onClick={() => setEditingQuest(quest)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(quest._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2">
              <p>Level: {quest.level}</p>
              <p>Time Limit: {quest.timeLimit} minutes</p>
              <p>Questions: {quest.questions.length}</p>
              <p>Status: {quest.isActive ? "Active" : "Inactive"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
