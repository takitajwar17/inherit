import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * QuestionHeader - Header component for Dev-Discuss pages
 * Uses standardized typography (text-3xl for title)
 */
export default function QuestionHeader() {
  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Questions</h1>
          <p className="text-base text-gray-600 mt-1">
            Ask questions and share knowledge with the community
          </p>
        </div>
        <Link href="/dev-discuss/ask-question">
          <Button>Ask Question</Button>
        </Link>
      </div>
    </header>
  );
}
