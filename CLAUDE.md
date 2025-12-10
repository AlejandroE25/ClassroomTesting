# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a standalone HTML application for testing audio/video devices in classroom/presentation environments. It provides synchronized media playback across multiple devices for A/B testing scenarios.

## Architecture

**Frontend**: Self-contained HTML file (`device-tester.html`) with embedded CSS and JavaScript - no build process required.

**Backend (AWS)**: Real-time WebSocket infrastructure for cross-device synchronization:
- **API Gateway WebSocket API**: Manages persistent bidirectional connections
- **Lambda Functions**:
  - `connect.js`: Stores connection ID and room code in DynamoDB when client connects
  - `disconnect.js`: Removes connection record when client disconnects
  - `message.js`: Queries DynamoDB for all connections in a room, broadcasts sync messages via API Gateway Management API
- **DynamoDB Table**: Stores `connectionId` (primary key), `roomCode` (GSI), and `ttl` (24-hour auto-cleanup)

**Cross-Device Synchronization (WebRTC P2P + WebSocket Signaling)**:
- **Primary**: WebRTC DataChannels for peer-to-peer sync (10-50ms latency)
- **Signaling**: WebSocket to AWS API Gateway for WebRTC connection setup (exchange offers/answers/ICE)
- **Fallback 1**: WebSocket relay if P2P fails (50-150ms latency)
- **Fallback 2**: `localStorage` with `storage` events (same-browser cross-tab only)
- Room-based architecture: devices join rooms via 4-character codes
- Mesh topology: Each device connects directly to all other devices (optimized for 2-3 devices)
- Message format: `{syncAction, mediaType, timestamp, ...data}`
- Supports synchronized load, play, and pause operations for audio/video elements
- DataChannel config: `{ordered: false, maxRetransmits: 0}` for ultra-low latency

**Media Device Testing**:
- Camera: Uses `getUserMedia()` with video constraints, displays live preview
- Microphone: Captures audio stream with Web Audio API, visualizes via `AnalyserNode` with canvas frequency bars
- Speakers: Generates test tones (440Hz sine wave) with `OscillatorNode`, supports stereo panning (left/right/both)

**Key JavaScript Components**:
- `enumerateDevices()`: Populates device selectors for cameras, microphones, speakers
- `broadcastSync(action, mediaType, data)`: Sends sync commands via P2P (preferred) or WebSocket (fallback)
- `handleSyncMessage(message)`: Receives and processes sync commands from any source
- `visualizeAudio()`: Real-time audio visualization using canvas and AnalyserNode
- `createPeerConnection(peerId, isInitiator)`: Establishes WebRTC peer connection with ICE handling
- `setupDataChannel(peerId, channel)`: Configures DataChannel for ultra-low latency messaging
- `handleWebRTCSignaling(message)`: Processes WebRTC offers/answers/ICE candidates via WebSocket
- `updateConnectionStatus()`: Updates UI to show P2P connection count or fallback status

## Branding & Styling

- University of Illinois themed (navy blue `#13294b`, orange accent `#ff5f05`)
- Uses Montserrat font family from Google Fonts
- University logo loaded from `cdn.brand.illinois.edu`
- Chicago timezone display updates every second

## Development Commands

**Install Lambda dependencies:**
```bash
cd lambda && npm install && cd ..
```

**Build AWS infrastructure:**
```bash
sam build
```

**Deploy to AWS (first time):**
```bash
sam deploy --guided
```

**Deploy updates:**
```bash
sam build && sam deploy
```

**View Lambda logs:**
```bash
sam logs -n MessageFunction --stack-name device-tester-websocket --tail
```

**Delete AWS resources:**
```bash
sam delete --stack-name device-tester-websocket
```

## Testing the Application

**Local mode (no AWS):** Open `device-tester.html` directly in a browser. Works cross-tab only (uses localStorage).

**Cross-device mode (with AWS):**
1. Deploy backend to AWS (see DEPLOYMENT.md)
2. Update `WEBSOCKET_URL` constant in `device-tester.html` with deployed WebSocket URL
3. Open on multiple devices/browsers
4. Use 4-character room codes to sync devices
5. Test "Load Audio/Video" then "Sync Play/Pause"

## Media Requirements

- Audio/video URLs must be publicly accessible and CORS-enabled
- Supported formats: MP3, WAV for audio; MP4, WebM for video
- Default video URL points to University of Illinois Box storage

## Browser Permissions

On first load, the app requests camera and microphone permissions to enumerate and label devices. Users must grant these permissions for full functionality.
