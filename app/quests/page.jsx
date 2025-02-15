"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  FiClock,
  FiCalendar,
  FiAward,
  FiBook,
  FiFilter,
  FiArchive,
  FiSearch,
  FiTarget,
  FiCheck,
  FiAward as FiTrophy,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { QuestPageLoader } from "@/app/components/fun-loaders";

const LeaderboardCard = ({ leaderboard }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FiTrophy className="text-yellow-500" />
          Leaderboard
        </h2>
      </div>

      <div className="space-y-4">
        {leaderboard.map((entry) => (
          <div
            key={entry._id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              entry.isCurrentUser
                ? "bg-blue-50 border border-blue-100"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium
                ${
                  entry.rank <= 3
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {entry.rank}
              </span>
              <div>
                <p className="font-medium text-gray-900">{entry.username}</p>
                <div className="flex items-center text-sm text-gray-500 space-x-2">
                  <span className="flex items-center">
                    <FiTarget className="mr-1" />
                    {entry.totalScore} pts
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <FiCheck className="mr-1" />
                    {entry.questsCompleted} quests
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900">
                {(entry.averageScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuestSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{
          translateX: ["100%", "-100%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
        }}
      />
      <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
      <div className="h-8 w-3/4 bg-gray-200 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 rounded" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-20 bg-gray-200 rounded" />
        <div className="h-8 w-20 bg-gray-200 rounded" />
      </div>
    </motion.div>
  );
};

const FilterSection = ({ filters, setFilters, showFilters }) => (
  <div
    className={`transition-all duration-200 ease-in-out ${
      showFilters ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
    }`}
  >
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search quests..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Level Filter */}
          <div className="min-w-[150px]">
            <select
              value={filters.level}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, level: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Duration Filter */}
          <div className="min-w-[150px]">
            <select
              value={filters.duration}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, duration: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Durations</option>
              <option value="short">Short (&lt;30 min)</option>
              <option value="medium">Medium (30-60 min)</option>
              <option value="long">Long (&gt;60 min)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const QuestCard = ({ quest, status }) => {
  const startTime = new Date(quest.startTime);
  const endTime = new Date(quest.endTime);
  const now = new Date();
  const canStart = status === "active" && startTime <= now && endTime >= now;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-gray-200 relative overflow-hidden">
      {/* Status Badge */}
      <div
        className={`absolute top-0 right-0 w-24 text-center py-1 text-xs font-semibold transform rotate-45 translate-x-7 translate-y-4
        ${
          status === "upcoming"
            ? "bg-blue-500 text-white"
            : status === "active"
            ? "bg-green-500 text-white"
            : "bg-gray-500 text-white"
        }`}
      >
        {status}
      </div>

      <div className="space-y-4">
        {/* Quest Header */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{quest.name}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FiAward
              className={`
              ${
                quest.level === "beginner"
                  ? "text-green-500"
                  : quest.level === "intermediate"
                  ? "text-yellow-500"
                  : "text-red-500"
              }`}
            />
            <span className="capitalize">{quest.level}</span>
          </div>
        </div>

        {/* Quest Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <FiClock className="text-gray-400" />
            <span>{quest.timeLimit} min</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiBook className="text-gray-400" />
            <span>{quest.questions.length} questions</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <FiCalendar className="text-gray-400" />
            <span>
              Starts:{" "}
              {startTime.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <FiCalendar className="text-gray-400" />
            <span>
              Ends:{" "}
              {endTime.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {canStart && (
          <Link
            href={`/quests/${quest._id}/attempt`}
            className="block w-full text-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            View Quest
          </Link>
        )}
      </div>
    </div>
  );
};

const filterQuests = (questList, filters) => {
  return questList.filter((quest) => {
    const levelMatch = filters.level === "all" || quest.level === filters.level;
    const durationMatch =
      filters.duration === "all" ||
      (filters.duration === "short" && quest.timeLimit <= 30) ||
      (filters.duration === "medium" &&
        quest.timeLimit > 30 &&
        quest.timeLimit <= 60) ||
      (filters.duration === "long" && quest.timeLimit > 60);
    const searchMatch =
      !filters.search ||
      quest.name.toLowerCase().includes(filters.search.toLowerCase());

    return levelMatch && durationMatch && searchMatch;
  });
};

export default function QuestsPage() {
  const { user } = useUser();
  const [quests, setQuests] = useState({
    upcoming: [],
    active: [],
    past: [],
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    level: "all",
    duration: "all",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questsResponse, leaderboardResponse] = await Promise.all([
          fetch("/api/quests"),
          fetch("/api/leaderboard"),
        ]);

        const questsResponseFromUser = await fetch("/api/quests/user");
        const questsDataFromUser = await questsResponseFromUser.json();

        const questsData = await questsResponse.json();
        const leaderboardData = await leaderboardResponse.json();

        const now = new Date();
        const categorizedQuests = {
          upcoming: [],
          active: [...questsDataFromUser.active],
          past: [],
        };

        questsData.forEach((quest) => {
          const startTime = new Date(quest.startTime);
          const endTime = new Date(quest.endTime);

          if (startTime > now) {
            categorizedQuests.upcoming.push(quest);
          } else if (endTime < now) {
            categorizedQuests.past.push(quest);
          } else {
            // categorizedQuests.active.push(quest); // This is not needed, already fetched from api/quest/ser
          }
        });

        setQuests(categorizedQuests);
        setLeaderboard(leaderboardData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <motion.div
            className="h-10 w-48 bg-gray-200 rounded"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <QuestSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  const filteredQuests = filterQuests(quests[activeTab], filters);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {/* Header with Filter Toggle */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Quests</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <FiFilter
                className={`${
                  showFilters ? "text-blue-500" : "text-gray-400"
                } transition-colors duration-200`}
              />
              <span>Filters</span>
            </button>
          </div>

          {/* Filter Section */}
          <FilterSection
            filters={filters}
            setFilters={setFilters}
            showFilters={showFilters}
          />

          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-8 border-b border-gray-200">
            {["active", "upcoming", "past"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-4 text-sm font-medium transition-colors duration-200 relative
                  ${
                    activeTab === tab
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <div className="flex items-center space-x-2">
                  {tab === "active" && <FiClock />}
                  {tab === "upcoming" && <FiCalendar />}
                  {tab === "past" && <FiArchive />}
                  <span className="capitalize">{tab}</span>
                  <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {quests[tab].length}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Quest Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredQuests.length > 0 ? (
              filteredQuests.map((quest) => (
                <QuestCard key={quest._id} quest={quest} status={activeTab} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <FiBook className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No {activeTab} quests found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="lg:w-80 flex-shrink-0">
          <LeaderboardCard leaderboard={leaderboard} />
        </div>
      </div>
    </div>
  );
}
