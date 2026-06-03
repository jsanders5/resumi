import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: '8px solid #6366f1',
        }}
      >
        <span
          style={{
            color: '#6366f1',
            fontSize: 110,
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
              top: -8,
              right: -20,
              color: '#6366f1',
              fontSize: 30,
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
