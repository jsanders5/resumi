'use client';

import { useCallback } from 'react';

export default function SentryExamplePage() {
  const handleError = useCallback(() => {
    throw new Error('Sentry Frontend Error');
  }, []);

  const handleAsync = useCallback(async () => {
    throw new Error('Sentry Async Error');
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Sentry Test Page</h1>
      <p>Use the buttons below to test Sentry error reporting.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={handleError}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Trigger Frontend Error
        </button>

        <button
          onClick={handleAsync}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Trigger Async Error
        </button>

        <a href="/api/sentry-example-api">
          <button
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Trigger Server Error
          </button>
        </a>
      </div>

      <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#666' }}>
        Delete this page after verifying Sentry is working in production.
      </p>
    </div>
  );
}
