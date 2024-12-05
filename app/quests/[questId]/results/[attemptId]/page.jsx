"use client";

import { useEffect, useState } from 'react';
import { useUser } from "@clerk/nextjs";
import Link from 'next/link';

export default function QuestResultsPage({ params }) {
  const { user } = useUser();
  const [attempt, setAttempt] = useState(null);
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Fetch attempt details
        const attemptResponse = await fetch(`/api/attempts/${params.attemptId}`);
        if (!attemptResponse.ok) throw new Error('Failed to fetch attempt');
        const attemptData = await attemptResponse.json();
        setAttempt(attemptData);

        // Fetch quest details
        const questResponse = await fetch(`/api/quests/${params.questId}`);
        if (!questResponse.ok) throw new Error('Failed to fetch quest');
        const questData = await questResponse.json();
        setQuest(questData);

        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    if (user) {
      fetchResults();
    }
  }, [params.attemptId, params.questId, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!attempt || !quest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Results not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{quest.name} - Results</h1>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {attempt.totalPoints} points
          </div>
          <div className="text-sm text-gray-500">
            Completed on {new Date(attempt.endTime).toLocaleString()}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Duration</div>
            <div className="mt-1 text-lg font-semibold">
              {Math.round((new Date(attempt.endTime) - new Date(attempt.startTime)) / 60000)} minutes
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Questions Answered</div>
            <div className="mt-1 text-lg font-semibold">
              {attempt.answers.length} / {quest.questions.length}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500">Correct Answers</div>
            <div className="mt-1 text-lg font-semibold">
              {attempt.answers.filter(a => a.isCorrect).length}
            </div>
          </div>
        </div>

        {/* Answers Review */}
        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Answer Review</h2>
          {quest.questions.map((question, index) => {
            const answer = attempt.answers.find(a => a.questionId.toString() === question._id.toString());
            
            return (
              <div key={question._id} className="border-b pb-6 last:border-b-0">
                <div className="flex items-start">
                  <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-sm font-medium mr-2 ${
                    answer?.isCorrect 
                      ? 'bg-green-100 text-green-800'
                      : answer
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    Q{index + 1}
                  </span>
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {question.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{question.description}</p>
                    
                    {answer ? (
                      <div className="space-y-2">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm font-medium text-gray-500">Your Answer:</div>
                          <div className="mt-1">{answer.answer}</div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className={`font-medium ${
                            answer.isCorrect ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {answer.points} / {question.points} points
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No answer provided</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <Link
            href="/quests"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Quests
          </Link>
        </div>
      </div>
    </div>
  );
}
