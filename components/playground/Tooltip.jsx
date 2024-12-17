"use client";

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

const Tooltip = ({ children, show }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !show) return null;

  return createPortal(
    <div className="fixed z-[99999] bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg transform -translate-y-1 transition-all duration-150 ease-out">
      {children}
    </div>,
    document.body
  );
};

export default Tooltip;
