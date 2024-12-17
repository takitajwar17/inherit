"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Card } from "@/components/ui/card";
import { FaCode, FaUsers } from "react-icons/fa";
import { pusherClient } from '../../lib/pusher-client';

const Playground = () => {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [code, setCode] = useState("");
  const [currentUserId, setCurrentUserId] = useState(uuidv4());
  const [roomId, setRoomId] = useState("");

  const generateRoomCode = () => {
    return uuidv4().slice(0, 7).toUpperCase();
  };

  const handleCreateRoom = () => {
    const newRoomCode = generateRoomCode();
    router.push(`/playground/${newRoomCode}`);
    setRoomId(newRoomCode);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim().length === 7) {
      router.push(`/playground/${roomCode}`);
      setRoomId(roomCode);
    } else {
      alert("Please enter a valid 7-character room code.");
    }
  };

  useEffect(() => {
    if (roomId) {
      const channel = pusherClient.subscribe(`room-${roomId}`);
      
      channel.bind('codeUpdate', ({ userId, data }) => {
        if (userId !== currentUserId) {
          setCode(data);
        }
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };
    }
  }, [roomId]);

  const sendCodeUpdate = async (newCode) => {
    await fetch('/api/socket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        userId: currentUserId,
        event: 'codeUpdate',
        data: newCode,
      }),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900">Code Playground</h1>
          <p className="text-slate-600 mt-2">Real-time collaborative coding environment</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <Card className="bg-white p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col h-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-50 p-2 rounded">
                  <FaCode className="text-xl text-blue-600" />
                </div>
                <h2 className="text-xl font-medium text-slate-900">Create Room</h2>
              </div>
              <p className="text-slate-600 text-sm mb-6">
                Start a new collaborative coding session with a unique room code
              </p>
              <div className="mt-auto">
                <button
                  onClick={handleCreateRoom}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Create New Room
                </button>
              </div>
            </div>
          </Card>

          {/* Join Room Card */}
          <Card className="bg-white p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col h-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-emerald-50 p-2 rounded">
                  <FaUsers className="text-xl text-emerald-600" />
                </div>
                <h2 className="text-xl font-medium text-slate-900">Join Room</h2>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                Enter a room code to join an existing session
              </p>
              <div className="space-y-3 mt-auto">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code"
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  maxLength={7}
                />
                <button
                  onClick={handleJoinRoom}
                  className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors duration-200 font-medium"
                >
                  Join Room
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Playground;
