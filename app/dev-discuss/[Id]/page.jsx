"use client";

import { Button } from "@/components/ui/button";
import { getQuestionById } from "@/lib/actions/question";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function QuestionDetailPage({ params }) {
  const { Id } = params;
  const [questionData, setQuestionData] = useState(null);
  const [votes, setVotes] = useState(0);
  const [userVote, setUserVote] = useState(0);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchQuestion = async () => {
      const question = await getQuestionById(Id);
      question.replies = question.replies || []; // Initialize replies array if undefined
      setQuestionData(question);
      setVotes(question.votes);
    };
    fetchQuestion();
  }, [Id]);

  const handleUpvote = () => {
    if (userVote !== 1) {
      setVotes(votes + 1);
      setUserVote(1);
    }
  };

  const handleDownvote = () => {
    if (userVote !== -1) {
      setVotes(votes - 1);
      setUserVote(-1);
    }
  };

  const handlePostReply = async () => {
    if (!replyContent.trim()) return;

    const response = await fetch(`/api/questions/${Id}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: replyContent }),
    });

    if (response.ok) {
      const { reply } = await response.json();
      setQuestionData((prevData) => ({
        ...prevData,
        replies: [...prevData.replies, reply],
      }));
      setReplyContent(""); // Clear textarea after posting
    } else {
      console.error("Failed to post reply");
    }
  };

  if (!questionData) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <header className="mb-6 border-b pb-4">
          <h1 className="text-3xl font-bold mb-2">{questionData.title}</h1>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div>
              <span className="text-blue-600">by {questionData.author}</span> |{" "}
              <span>{new Date(questionData.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              {questionData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="flex gap-6 items-start mb-8">
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUpvote}
              disabled={userVote === 1}
            >
              <ArrowUp
                className={`h-6 w-6 ${userVote === 1 ? "text-blue-600" : ""}`}
              />
            </Button>
            <span className="text-xl font-semibold">{votes}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownvote}
              disabled={userVote === -1}
            >
              <ArrowDown
                className={`h-6 w-6 ${userVote === -1 ? "text-red-600" : ""}`}
              />
            </Button>
          </div>

          <div className="flex-1">
            <p className="text-lg mb-6">{questionData.description}</p>
            <p className="text-muted-foreground">
              <span className="font-semibold">{questionData.answers}</span>{" "}
              answers
            </p>
          </div>
        </div>

        {/* Replies Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Replies</h2>
          <div className="space-y-6">
            {questionData.replies && questionData.replies.length ? (
              questionData.replies.map((reply, index) => (
                <div key={index} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-blue-600">
                      {reply.author}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{reply.content}</p>
                </div>
              ))
            ) : (
              <div>No replies yet. Be the first to reply!</div>
            )}
          </div>
        </section>

        {/* Add a Reply */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Your Reply</h2>
          <textarea
            rows="4"
            className="w-full p-3 border rounded-md focus:border-blue-500 focus:ring focus:ring-blue-200"
            placeholder="Write your answer here..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
          />
          <Button className="mt-4" onClick={handlePostReply}>
            Post Reply
          </Button>
        </div>
      </div>
    </main>
  );
}
