// app/components/dev-discuss/QuestionCard.jsx

import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";

export default function QuestionCard({ question }) {
  return (
    <div className="border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors">
      <div className="flex gap-6">
        {/* Stats */}
        <div className="flex flex-col items-center gap-2 min-w-[100px]">
          <div className="flex flex-col items-center">
            <span className="text-lg font-semibold">{question.votes}</span>
            <span className="text-sm text-muted-foreground">votes</span>
          </div>
          <div className="flex flex-col items-center text-green-600">
            <span className="text-lg font-semibold">{question.answers}</span>
            <span className="text-sm">answers</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2 hover:text-blue-600">
            <Link href={`/dev-discuss/questions/${question._id}`}>
              {question.title}
            </Link>
          </h2>
          <p className="text-muted-foreground mb-4">{question.description}</p>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200 cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>asked {new Date(question.createdAt).toLocaleString()}</span>
              <span>by</span>
              <a href="#" className="text-blue-600 hover:text-blue-800">
                {question.author}{" "}
                {/* You might want to fetch and display the author's name */}
              </a>
            </div>
          </div>
        </div>

        {/* Voting */}
        <div className="flex flex-col items-center gap-2">
          <Button variant="ghost" size="icon">
            <ArrowUp className="h-6 w-6" />
          </Button>
          <span className="font-semibold">{question.votes}</span>
          <Button variant="ghost" size="icon">
            <ArrowDown className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
