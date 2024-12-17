"use client";

import React, { useState, useRef, useEffect } from 'react';
import Tooltip from './Tooltip';

const CollaboratorAvatars = ({ collaborators }) => {
  if (!collaborators || collaborators.length === 0) return null;

  const [tooltips, setTooltips] = useState({});
  const [tooltipPositions, setTooltipPositions] = useState({});
  const avatarRefs = useRef({});

  const updateTooltipPosition = (userId) => {
    const avatarEl = avatarRefs.current[userId];
    if (avatarEl) {
      const rect = avatarEl.getBoundingClientRect();
      setTooltipPositions(prev => ({
        ...prev,
        [userId]: {
          left: rect.left + rect.width / 2,
          top: rect.top - 8  // Position above the avatar
        }
      }));
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      Object.keys(tooltips).forEach(userId => {
        if (tooltips[userId]) {
          updateTooltipPosition(userId);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [tooltips]);

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2 relative">
        {collaborators.slice(0, 3).map((collaborator, index) => (
          <div
            key={collaborator.userId}
            ref={el => avatarRefs.current[collaborator.userId] = el}
            className="relative"
            style={{ zIndex: 30 - index }}
            onMouseEnter={() => {
              setTooltips(prev => ({ ...prev, [collaborator.userId]: true }));
              updateTooltipPosition(collaborator.userId);
            }}
            onMouseLeave={() => {
              setTooltips(prev => ({ ...prev, [collaborator.userId]: false }));
            }}
          >
            <img
              className="w-8 h-8 rounded-full border-2 border-white bg-white"
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${collaborator.userId}`}
              alt={collaborator.username || 'Anonymous'}
            />
            <Tooltip show={tooltips[collaborator.userId]}>
              <div 
                style={{
                  position: 'fixed',
                  left: `${tooltipPositions[collaborator.userId]?.left}px`,
                  top: `${tooltipPositions[collaborator.userId]?.top}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                {collaborator.username || 'Anonymous'}
              </div>
            </Tooltip>
          </div>
        ))}
        {collaborators.length > 3 && (
          <div 
            ref={el => avatarRefs.current['overflow'] = el}
            className="relative"
            style={{ zIndex: 27 }}
            onMouseEnter={() => {
              setTooltips(prev => ({ ...prev, overflow: true }));
              updateTooltipPosition('overflow');
            }}
            onMouseLeave={() => {
              setTooltips(prev => ({ ...prev, overflow: false }));
            }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-sm text-gray-600">
              +{collaborators.length - 3}
            </div>
            <Tooltip show={tooltips['overflow']}>
              <div 
                style={{
                  position: 'fixed',
                  left: `${tooltipPositions['overflow']?.left}px`,
                  top: `${tooltipPositions['overflow']?.top}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                {collaborators.slice(3).map(c => c.username || 'Anonymous').join(', ')}
              </div>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorAvatars;
