// app/dev-discuss/page.jsx

"use client";

import QuestionsLoading from "@/app/components/dev-discuss/Loading";
import QuestionFilters from "@/app/components/dev-discuss/QuestionFilters";
import QuestionHeader from "@/app/components/dev-discuss/QuestionHeader";
import QuestionList from "@/app/components/dev-discuss/QuestionList";
import QuestionTabs from "@/app/components/dev-discuss/QuestionTabs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// Lightning-fast fetch function
const fetchQuestions = async () => {
  const response = await fetch("/api/questions/all-questions");
  const result = await response.json();
  return result.data || result;
};

// Optimized question processing with memoization
const useProcessedQuestions = (questionsData, selectedTab) => {
  return useMemo(() => {
    if (!questionsData) return [];

    const { owned = [], others = [] } = questionsData;
    
    switch (selectedTab) {
      case "all":
        return [...owned, ...others];
      case "my questions":
        return owned;
      case "popular":
        return [...owned, ...others]
          .map((question) => ({
            ...question,
            score: (question.votes || 0) + (question.answers || 0) * 2,
          }))
          .sort((a, b) => b.score - a.score);
      default:
        return [];
    }
  }, [questionsData, selectedTab]);
};

export default function Home() {
  const [selectedTab, setSelectedTab] = useState("all");
  const tabs = ["all", "my questions", "popular"];

  // Lightning-fast query with aggressive caching
  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: fetchQuestions,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Optimized question processing
  const displayedQuestions = useProcessedQuestions(questionsData, selectedTab);

  if (isLoading) {
    return <QuestionsLoading />;
  }

  return (
    <main className="min-h-screen bg-background">
      <QuestionHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <QuestionFilters questionCount={displayedQuestions.length} />
        <QuestionTabs
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          tabs={tabs}
        />
        <QuestionList questions={displayedQuestions} />
      </div>
    </main>
  );
}
