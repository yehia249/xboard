import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await context.params;

    // Fetch community data
    const communityRes = await fetch(`https://xboardz.com/api/community/${communityId}`);
    
    if (!communityRes.ok) {
      throw new Error('Community not found');
    }

    const community = await communityRes.json();

    // Fetch the base OG image
    const baseImageRes = await fetch('https://xboardz.com/og.png');
    const baseImageBuffer = await baseImageRes.arrayBuffer();
    const baseImageBase64 = Buffer.from(baseImageBuffer).toString('base64');

    // Fetch community image
    let communityImageBase64 = '';
    if (community.image_url) {
      try {
        const communityImageRes = await fetch(community.image_url);
        const communityImageBuffer = await communityImageRes.arrayBuffer();
        communityImageBase64 = Buffer.from(communityImageBuffer).toString('base64');
      } catch (e) {
        console.error('Failed to fetch community image:', e);
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Base XBoard background */}
          <img
            src={`data:image/png;base64,${baseImageBase64}`}
            style={{
              position: 'absolute',
              width: '1200px',
              height: '630px',
              objectFit: 'cover',
            }}
          />

          {/* Community image with gradient blend */}
          {communityImageBase64 && (
            <div
              style={{
                position: 'absolute',
                width: '1200px',
                height: '630px',
                display: 'flex',
              }}
            >
              <img
                src={`data:image/jpeg;base64,${communityImageBase64}`}
                style={{
                  width: '1200px',
                  height: '630px',
                  objectFit: 'cover',
                  opacity: 0.7,
                }}
              />
              {/* Dark gradient overlay for blending */}
              <div
                style={{
                  position: 'absolute',
                  width: '1200px',
                  height: '630px',
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
                  display: 'flex',
                }}
              />
            </div>
          )}

          {/* Content overlay */}
          <div
            style={{
              position: 'absolute',
              width: '1200px',
              height: '630px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '60px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)',
            }}
          >
            <div
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '20px',
                textShadow: '0 4px 12px rgba(0,0,0,0.8)',
                display: 'flex',
              }}
            >
              {community.name || 'Community'}
            </div>
            {community.description && (
              <div
                style={{
                  fontSize: '32px',
                  color: 'rgba(255,255,255,0.9)',
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                  display: 'flex',
                  maxWidth: '900px',
                }}
              >
                {community.description.slice(0, 100)}
                {community.description.length > 100 ? '...' : ''}
              </div>
            )}
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
    
    // Fallback to base image if something goes wrong
    const baseImageRes = await fetch('https://xboardz.com/og.png');
    const baseImageBuffer = await baseImageRes.arrayBuffer();
    
    return new Response(baseImageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
}