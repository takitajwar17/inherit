'use client';

/**
 * Global Error Boundary
 * 
 * Catches errors in the root layout.
 * Must include its own <html> and <body> tags.
 * This is a last-resort error boundary for critical failures.
 * 
 * @param {Object} props
 * @param {Error} props.error - The error that was thrown
 * @param {Function} props.reset - Function to attempt recovery
 */

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log critical error
    console.error('Critical application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div 
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#111827',
            padding: '1rem',
          }}
        >
          <div 
            style={{
              textAlign: 'center',
              maxWidth: '28rem',
              padding: '2rem',
              backgroundColor: '#1f2937',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Error Icon */}
            <div 
              style={{
                width: '5rem',
                height: '5rem',
                margin: '0 auto 1.5rem',
                backgroundColor: '#7f1d1d',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg 
                style={{ width: '2.5rem', height: '2.5rem', color: '#fca5a5' }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            
            {/* Error Message */}
            <h1 
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '0.75rem',
              }}
            >
              Critical Error
            </h1>
            
            <p 
              style={{
                color: '#9ca3af',
                marginBottom: '1.5rem',
                lineHeight: '1.5',
              }}
            >
              A critical error has occurred. Please try refreshing the page.
            </p>
            
            {/* Retry Button */}
            <button
              onClick={() => reset()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
            >
              Refresh Page
            </button>
            
            {/* Fallback link */}
            <p 
              style={{
                marginTop: '1.5rem',
                fontSize: '0.875rem',
                color: '#6b7280',
              }}
            >
              Or go to{' '}
              <a 
                href="/"
                style={{
                  color: '#818cf8',
                  textDecoration: 'underline',
                }}
              >
                homepage
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

