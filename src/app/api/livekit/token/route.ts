import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(req: NextRequest) {
  try {
    const { roomName, participantName, identity } = await req.json();

    if (!roomName || !identity) {
      return NextResponse.json(
        { error: 'roomName and identity are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    // Check if LiveKit credentials are real and not placeholder
    const isLiveKitConfigured = Boolean(
      apiKey &&
      apiSecret &&
      livekitUrl &&
      !apiKey.includes('placeholder') &&
      !apiSecret.includes('placeholder')
    );

    if (!isLiveKitConfigured) {
      // In development / demo mode before user configures LiveKit keys,
      // return simulated session indicator so frontend can activate WebRTC simulation
      return NextResponse.json({
        token: 'simulated_webrtc_token_' + identity,
        serverUrl: 'wss://simulated.livekit.cloud',
        isSimulated: true,
        participantName: participantName || identity,
      });
    }

    // Generate real LiveKit JWT
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: participantName || identity,
      ttl: '2h',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      serverUrl: livekitUrl,
      isSimulated: false,
    });
  } catch (error: any) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate token' },
      { status: 500 }
    );
  }
}
