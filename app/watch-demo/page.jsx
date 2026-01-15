"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Terminal } from "lucide-react";
import { useUser } from "@clerk/nextjs";

const WatchDemoPage = () => {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <Terminal className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">Inherit</span>
          </Link>
          <Link
            href="/"
            className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors font-medium"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Inherit Platform Demo
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how Inherit is revolutionizing coding education and empowering 
              the next generation of tech leaders in Bangladesh.
            </p>
          </div>

          {/* Video Container */}
          <div className="relative pt-[56.25%] w-full bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/9qrIMDgykHU?autoplay=1"
              title="Inherit Platform Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            {isLoaded && (
              <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                <button className="bg-indigo-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 transform hover:-translate-y-1">
                  {isSignedIn ? "Go to Dashboard" : "Start Your Journey Now"}
                </button>
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Footer (Simplified) */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-100">
        &copy; {new Date().getFullYear()} Inherit. All rights reserved.
      </footer>
    </div>
  );
};

export default WatchDemoPage;
