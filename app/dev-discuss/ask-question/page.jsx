// app/dev-discuss/ask-question/page.jsx

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@clerk/nextjs"; // Adjust based on your authentication method
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { createQuestion } from "../../../lib/actions/question"; // Adjust the import path as necessary

export default function AskQuestionPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const router = useRouter();
  const { userId } = useAuth(); // Get the authenticated user's ID

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input fields
    if (!title || !description || !tags) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      // Call the createQuestion function to save the data
      const question = await createQuestion(title, description, tags, userId);

      console.log("Question created:", question);
      toast.success("Question posted successfully!");
      router.push("/dev-discuss"); // Redirect to the discussion page
    } catch (error) {
      console.error("Error creating question:", error);
      toast.error("Error posting question. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Ask a Question</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              placeholder="e.g., How to center a div using Tailwind CSS?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <Textarea
              placeholder="Include all the information someone would need to answer your question"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
            />
          </div>

          {/* Tags Field */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <Input
              placeholder="e.g., javascript, react, tailwindcss"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit">Post Your Question</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
