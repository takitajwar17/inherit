"use client";

import { useEffect, useState } from 'react';
import { useUser } from "@clerk/nextjs";
import Link from 'next/link';

export default function QuestsPage() {
  const { user } = useUser();
  const [quests, setQuests] = useState({
    upcoming: [],
    active: [],
    past: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const response = await fetch('/api/quests');
        const data = await response.json();
        
        const now = new Date();
        const categorizedQuests = {
          upcoming: [],
          active: [],
          past: []
        };

        data.forEach(quest => {
          const startTime = new Date(quest.startTime);
          const endTime = new Date(quest.endTime);

          if (startTime > now) {
            categorizedQuests.upcoming.push(quest);
          } else if (endTime < now) {
            categorizedQuests.past.push(quest);
          } else {
            categorizedQuests.active.push(quest);
          }
        });

        setQuests(categorizedQuests);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quests:', error);
        setLoading(false);
      }
    };

    fetchQuests();
  }, []);

  const QuestSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <div className="h-6 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>

      <div className="mt-4 flex space-x-4">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Quests</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <QuestSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  const QuestCard = ({ quest, status }) => {
    const startTime = new Date(quest.startTime);
    const endTime = new Date(quest.endTime);
    const now = new Date();

    const canStart = status === 'active' && startTime <= now && endTime >= now;

    return (
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{quest.name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              Level: {quest.level.charAt(0).toUpperCase() + quest.level.slice(1)}
            </p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium
            ${status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 
              status === 'active' ? 'bg-green-100 text-green-800' : 
              'bg-gray-100 text-gray-800'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Start Time:</span>
            <div className="text-gray-600">{startTime.toLocaleString()}</div>
          </div>
          <div>
            <span className="font-medium">End Time:</span>
            <div className="text-gray-600">{endTime.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-4 text-sm">
          <span className="font-medium">Questions:</span> {quest.questions.length}
          <span className="ml-4 font-medium">Time Limit:</span> {quest.timeLimit} minutes
        </div>

        {canStart && (
          <div className="mt-4">
            <Link 
              href={`/quests/${quest._id}/attempt`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Quest
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Active Quests */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Quests</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quests.active.map(quest => (
            <QuestCard key={quest._id} quest={quest} status="active" />
          ))}
          {quests.active.length === 0 && (
            <p className="text-gray-500">No active quests available.</p>
          )}
        </div>
      </section>

      {/* Upcoming Quests */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Quests</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quests.upcoming.map(quest => (
            <QuestCard key={quest._id} quest={quest} status="upcoming" />
          ))}
          {quests.upcoming.length === 0 && (
            <p className="text-gray-500">No upcoming quests.</p>
          )}
        </div>
      </section>

      {/* Past Quests */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Quests</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quests.past.map(quest => (
            <QuestCard key={quest._id} quest={quest} status="past" />
          ))}
          {quests.past.length === 0 && (
            <p className="text-gray-500">No past quests.</p>
          )}
        </div>
      </section>
    </div>
  );
}
