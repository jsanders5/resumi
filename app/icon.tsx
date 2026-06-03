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
          borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Bold R */}
        <span
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: 900,
            fontFamily: 'sans-serif',
            lineHeight: 1,
            marginBottom: 1,
          }}
        >
          R
        </span>
        {/* Sparkle dot top-right */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 5,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
