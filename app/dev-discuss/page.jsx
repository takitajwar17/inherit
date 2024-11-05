"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDown, ArrowUp, Filter, Search } from "lucide-react";
import { useState } from "react";

const questions = [
  {
    id: 1,
    title: "How to center a div using Tailwind CSS?",
    description:
      "I'm trying to center a div both horizontally and vertically using Tailwind CSS. I've tried using flex classes but can't seem to get it right.",
    votes: 42,
    answers: 5,
    views: 1204,
    tags: ["javascript", "tailwindcss", "css", "html"],
    author: "john_doe",
    timePosted: "2 hours ago",
  },
  {
    id: 2,
    title: "Understanding React useEffect cleanup function",
    description:
      "I'm having trouble understanding when and how to properly use the cleanup function in useEffect. Can someone explain with practical examples?",
    votes: 28,
    answers: 3,
    views: 892,
    tags: ["javascript", "react", "hooks"],
    author: "react_learner",
    timePosted: "5 hours ago",
  },
  {
    id: 3,
    title: "Next.js 13 Server Components vs Client Components",
    description:
      "What are the main differences between Server and Client Components in Next.js 13? When should I use each one?",
    votes: 35,
    answers: 4,
    views: 1567,
    tags: ["javascript", "nextjs", "react"],
    author: "next_dev",
    timePosted: "1 day ago",
  },
];

export default function Home() {
  const [selectedTab, setSelectedTab] = useState("interesting");

  return (
    <main className="min-h-screen bg-background">
      <QuestionHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <QuestionFilters questionCount={questions.length} />
        <QuestionTabs selectedTab={selectedTab} onTabChange={setSelectedTab} />
        <QuestionList questions={questions} />
      </div>
    </main>
  );
}

function QuestionHeader() {
  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">All Questions</h1>
        <Button>Ask Question</Button>
      </div>
    </header>
  );
}

function QuestionFilters({ questionCount }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <p className="text-lg">{questionCount.toLocaleString()} questions</p>
      <div className="flex gap-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              className="pl-9 w-[300px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionTabs({ selectedTab, onTabChange }) {
  return (
    <Tabs value={selectedTab} onValueChange={onTabChange} className="mb-6">
      <TabsList>
        <TabsTrigger value="interesting">Interesting</TabsTrigger>
        <TabsTrigger value="featured">Featured</TabsTrigger>
        <TabsTrigger value="hot">Hot</TabsTrigger>
        <TabsTrigger value="week">Week</TabsTrigger>
        <TabsTrigger value="month">Month</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function QuestionList({ questions }) {
  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <QuestionCard key={question.id} question={question} />
      ))}
    </div>
  );
}

function QuestionCard({ question }) {
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
          <div className="flex flex-col items-center">
            <span className="text-lg font-semibold">{question.views}</span>
            <span className="text-sm text-muted-foreground">views</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2 hover:text-blue-600">
            <a href="#">{question.title}</a>
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
              <span>asked {question.timePosted}</span>
              <span>by</span>
              <a href="#" className="text-blue-600 hover:text-blue-800">
                {question.author}
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
