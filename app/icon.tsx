import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 4,
          background: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: '2px solid #6366f1',
        }}
      >
        <span
          style={{
            color: '#6366f1',
            fontSize: 18,
            fontWeight: 900,
            fontFamily: 'monospace',
            lineHeight: 1,
            position: 'relative',
          }}
        >
          R
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -4,
              color: '#6366f1',
              fontSize: 6,
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            AI
          </span>
        </span>
      </div>
    ),
    { ...size }
  );
}
