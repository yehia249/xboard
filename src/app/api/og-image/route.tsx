import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityImage = searchParams.get('image');
    const communityName = searchParams.get('name') || 'Community';

    if (!communityImage) {
      return new Response('Missing image parameter', { status: 400 });
    }

    // Fetch both images
    // For public folder files, construct the full URL
    const baseUrl = new URL(request.url).origin;
    const [baseImageRes, communityImageRes] = await Promise.all([
      fetch(`${baseUrl}/og.png`),
      fetch(communityImage),
    ]);

    const baseImageBuffer = await baseImageRes.arrayBuffer();
    const communityImageBuffer = await communityImageRes.arrayBuffer();

    // Convert to base64
    const baseImageBase64 = Buffer.from(baseImageBuffer).toString('base64');
    const communityImageBase64 = Buffer.from(communityImageBuffer).toString('base64');

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
            background: '#000',
          }}
        >
          {/* Base OG Image (left side) */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '600px',
              height: '630px',
              display: 'flex',
            }}
          >
            <img
              src={`data:image/png;base64,${baseImageBase64}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Gradient Overlay (center) */}
          <div
            style={{
              position: 'absolute',
              left: '500px',
              top: 0,
              width: '200px',
              height: '630px',
              background: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)',
              zIndex: 1,
            }}
          />

          {/* Community Image (right side) */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '600px',
              height: '630px',
              display: 'flex',
            }}
          >
            <img
              src={`data:image/png;base64,${communityImageBase64}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Optional: Community name overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '40px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <h1
              style={{
                color: 'white',
                fontSize: '72px',
                fontWeight: 'bold',
                textAlign: 'center',
                textShadow: '0 4px 12px rgba(0,0,0,0.8)',
                margin: 0,
              }}
            >
              {communityName}
            </h1>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}