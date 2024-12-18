'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from "@clerk/nextjs";
import { STATUS } from 'react-joyride';

// Dynamically import Joyride with ssr disabled
const Joyride = dynamic(() => import('react-joyride'), { ssr: false });

const TourGuide = () => {
  const [run, setRun] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    setMounted(true);
    
    // Function to check if tour should run
    const checkTourStatus = async () => {
      try {
        // Create a unique key for each user or session
        const tourKey = isSignedIn 
          ? `hasSeenTour_${user?.id}` 
          : 'hasSeenTour_guest';

        // Check if this user/guest has seen the tour
        const hasSeenTour = localStorage.getItem(tourKey);
        
        if (!hasSeenTour) {
          setRun(true);
          // Store the tour status for this user/guest
          localStorage.setItem(tourKey, 'true');
        }
      } catch (error) {
        // If localStorage is not available (e.g., in incognito mode)
        // Always show the tour
        setRun(true);
      }
    };

    // Only check tour status after mounting and user state is available
    if (mounted) {
      checkTourStatus();
    }
  }, [mounted, isSignedIn, user]);

  // Don't render anything until mounted
  if (!mounted) return null;

  const guestSteps = [
    {
      target: 'body',
      content: (
        <div className="space-y-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Inherit! 🚀
          </h2>
          <p className="text-gray-600">
            Your journey to becoming a better developer starts here. Click on Get Started to get started.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
  
  ];

  const userSteps = [
    {
      target: 'body',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent animate-gradient">
            Welcome Back! 🎉
          </h2>
          <p className="text-gray-600 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Let's explore all the amazing features waiting for you.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
   
   
    {
      target: '[href="/dashboard"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
            Your Dashboard
          </h3>
          <p className="bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
            Track your progress, view achievements, and manage your learning path.
          </p>
        </div>
      ),
      placement: 'right',
      spotlightPadding: 8,
    },
    {
      target: '[href="/roadmaps"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 bg-clip-text text-transparent">
            Learning Roadmaps
          </h3>
          <p className="bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent">
            Follow structured learning paths designed to take you from beginner to pro.
          </p>
        </div>
      ),
      placement: 'right',
      spotlightPadding: 8,
    },
    {
      target: '[href="/learn"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-yellow-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
            Interactive Learning
          </h3>
          <p className="bg-gradient-to-r from-yellow-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            Access comprehensive tutorials, courses, and hands-on exercises.
          </p>
        </div>
      ),
      placement: 'right',
      spotlightPadding: 8,
    },
    {
      target: '[href="/playground"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Code Playground
          </h3>
          <p className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Practice your skills in our interactive coding environment.
          </p>
        </div>
      ),
      placement: 'right',
      spotlightPadding: 8,
    },
    {
      target: '[href="/dev-discuss"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 bg-clip-text text-transparent">
            Developer Community
          </h3>
          <p className="bg-gradient-to-r from-pink-400 via-rose-400 to-red-400 bg-clip-text text-transparent">
            Connect with fellow developers, share knowledge, and get help.
          </p>
        </div>
      ),
      placement: 'right',
      spotlightPadding: 8,
    },
    {
      target: '[href="/quests"]',
      content: (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
            Coding Quests
          </h3>
          <p className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Challenge yourself with coding tasks and earn rewards.
          </p>
        </div>
      ),
      placement: 'right',
      spotlightPadding: 8,
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
    } else if (type === 'step:after') {
      setStepIndex(index + 1);
    }
  };

  return (
    <Joyride
      steps={isSignedIn ? userSteps : guestSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      scrollToFirstStep
      spotlightPadding={0}
      hideBackButton={false}
      disableScrolling={false}
      styles={{
        options: {
          primaryColor: '#4F46E5',
          zIndex: 10000,
          arrowColor: '#ffffff',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.75)',
          textColor: '#333',
        },
        tooltip: {
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(8px)',
          maxWidth: '320px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipContent: {
          fontSize: '1rem',
          lineHeight: '1.6',
        },
        buttonNext: {
          backgroundColor: '#4F46E5',
          borderRadius: '8px',
          color: '#ffffff',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          border: 'none',
          boxShadow: '0 2px 4px rgba(79, 70, 229, 0.1)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: '#4338CA',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(79, 70, 229, 0.2)',
          },
        },
        buttonBack: {
          marginRight: '0.5rem',
          color: '#4F46E5',
          fontSize: '0.875rem',
          fontWeight: '600',
          padding: '0.5rem 1rem',
          border: '1px solid rgba(79, 70, 229, 0.2)',
          borderRadius: '8px',
          backgroundColor: 'rgba(79, 70, 229, 0.05)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderColor: '#4F46E5',
            transform: 'translateY(-1px)',
          },
        },
        buttonSkip: {
          color: '#6B7280',
          fontSize: '0.875rem',
          fontWeight: '600',
          padding: '0.5rem 1rem',
          border: '1px solid rgba(107, 114, 128, 0.2)',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: '#F9FAFB',
            color: '#4B5563',
            transform: 'translateY(-1px)',
          },
        },
        buttonClose: {
          display: 'none', // Hide the close button
        },
        spotlight: {
          borderRadius: '12px',
        },
        overlay: {
          mixBlendMode: 'multiply',
        },
        floater: {
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))',
        },
      }}
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: {
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))',
          },
        },
      }}
      locale={{
        last: 'OK',
        next: 'Next',
        skip: 'Skip',
        back: 'Back',
      }}
      callback={handleJoyrideCallback}
    />
  );
};

export default TourGuide;
