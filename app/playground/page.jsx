"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  Code2, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Keyboard,
  Terminal,
  FileCode,
  Coffee,
  Cpu,
  Globe,
  Hash
} from "lucide-react";
import { pusherClient } from '../../lib/pusher-client';
import { PageHeader } from "@/components/shared";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const templates = [
  { id: 'javascript', name: 'JavaScript', icon: FileCode, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'python', name: 'Python', icon: Terminal, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'java', name: 'Java', icon: Coffee, color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: 'cpp', name: 'C++', icon: Cpu, color: 'text-blue-600', bg: 'bg-blue-600/10' },
  { id: 'csharp', name: 'C#', icon: Hash, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'php', name: 'PHP', icon: Globe, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
];

const Playground = () => {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [roomId, setRoomId] = useState("");
  
  const generateRoomCode = () => {
    return uuidv4().slice(0, 7).toUpperCase();
  };

  const handleCreateRoom = (languageId = null) => {
    const newRoomCode = generateRoomCode();
    const url = languageId 
      ? `/playground/${newRoomCode}?lang=${languageId}`
      : `/playground/${newRoomCode}`;
    router.push(url);
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

  // Pusher effect kept for consistency
  useEffect(() => {
    if (roomId) {
      const channel = pusherClient.subscribe(`room-${roomId}`);
      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };
    }
  }, [roomId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Playground" 
          subtitle="Real-time collaborative code editor for you and your team"
        />

        <motion.div 
          className="max-w-5xl mx-auto space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Create Room Card */}
            <motion.div variants={itemVariants} className="h-full">
              <Card className="h-full p-0 overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group ring-1 ring-black/5 dark:ring-white/10">
                <div className="h-full bg-white dark:bg-gray-800/50 relative p-8 flex flex-col">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                    <Code2 className="w-48 h-48 text-primary" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner">
                      <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Create Session</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-lg leading-relaxed">
                      Launch a new collaborative environment. Invite others with a unique code.
                    </p>

                    <motion.button
                      onClick={handleCreateRoom}
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Code2 className="w-5 h-5" />
                      Start Coding
                    </motion.button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Join Room Card */}
            <motion.div variants={itemVariants} className="h-full">
              <Card className="h-full p-0 overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group ring-1 ring-black/5 dark:ring-white/10">
                <div className="h-full bg-white dark:bg-gray-800/50 relative p-8 flex flex-col">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                    <Users className="w-48 h-48 text-secondary" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 shadow-inner">
                      <Users className="w-7 h-7 text-secondary" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Join Session</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-lg leading-relaxed">
                      Enter a room code to instantly jump into an active coding session.
                    </p>

                    <div className="mt-auto flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Keyboard className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={roomCode}
                          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                          placeholder="ENTER CODE"
                          className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/50 font-mono tracking-wider uppercase transition-all shadow-sm"
                          maxLength={7}
                        />
                      </div>
                      <motion.button
                        onClick={handleJoinRoom}
                        className="px-6 py-3.5 bg-secondary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/25 hover:shadow-secondary/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap"
                        disabled={!roomCode}
                        whileHover={{ scale: roomCode ? 1.02 : 1 }}
                        whileTap={{ scale: roomCode ? 0.98 : 1 }}
                      >
                        Join
                        <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Quick Start Templates */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-gradient-to-b from-primary to-secondary rounded-full" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Quick Start with Templates
              </h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className="p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-0 ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800"
                  onClick={() => handleCreateRoom(template.id)}
                >
                  <div className="flex flex-col items-center text-center gap-4 py-2">
                    <div className={`w-12 h-12 rounded-2xl ${template.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <template.icon className={`w-6 h-6 ${template.color}`} />
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm group-hover:text-primary transition-colors">
                      {template.name}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Playground;