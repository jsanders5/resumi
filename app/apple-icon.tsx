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
          borderRadius: 40,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 110,
            fontWeight: 900,
            fontFamily: 'sans-serif',
            lineHeight: 1,
          }}
        >
          R
        </span>
        {/* Sparkle dots */}
        <div style={{ position: 'absolute', top: 22, right: 28, width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
        <div style={{ position: 'absolute', top: 38, right: 22, width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
      </div>
    ),
    { ...size }
  );
}
