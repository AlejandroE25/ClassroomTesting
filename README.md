# ClassTech Device Tester

A web application for testing audio/video devices with synchronized playback across multiple devices. Perfect for classroom A/B testing scenarios and presentation equipment validation.

## Technologies

### Frontend
- **HTML5**: Self-contained single-page application (no build process required)
- **CSS3**: Modern styling with CSS Grid, Flexbox, and custom properties
- **JavaScript (ES6+)**: Native browser APIs, no frameworks or dependencies
- **WebRTC**: Peer-to-peer DataChannels for ultra-low latency device synchronization (10-50ms)
- **Web Audio API**: Real-time microphone visualization with AnalyserNode and canvas frequency bars
- **MediaDevices API**: Camera/microphone enumeration and stream capture via getUserMedia()
- **WebSockets**: Real-time bidirectional communication for WebRTC signaling and fallback sync
- **localStorage**: Cross-tab synchronization fallback for same-browser testing

**Hosting**: Frontend is hosted via **University of Illinois cPanel** for easy deployment and maintenance.

### Backend (AWS Serverless)
- **AWS API Gateway WebSocket API**: Manages persistent bidirectional connections for real-time sync
- **AWS Lambda (Node.js 20.x)**: Serverless functions for connection lifecycle and message routing
  - `connect.js`: Stores connection metadata when clients join
  - `disconnect.js`: Cleans up connection records on disconnect
  - `message.js`: Broadcasts sync commands to all devices in a room
- **Amazon DynamoDB**: NoSQL database for connection state with Global Secondary Index on room codes
  - Auto-cleanup via TTL (24-hour expiration)
  - Pay-per-request billing model
- **AWS SAM (Serverless Application Model)**: Infrastructure-as-code deployment and local testing

### Branding & Design
- **University of Illinois Theme**: Navy blue (#13294b) and orange (#ff5f05) color scheme
- **Google Fonts**: Montserrat font family for modern typography
- **Illinois CDN**: University logo and favicon from cdn.brand.illinois.edu

## Architecture

### Cross-Device Synchronization

The application uses a **multi-tier sync strategy** for optimal performance:

1. **Primary: WebRTC Peer-to-Peer (P2P)**
   - Direct DataChannel connections between devices in same room
   - Ultra-low latency (10-50ms typical)
   - Mesh topology: each device connects to all others (optimized for 2-3 devices)
   - DataChannel config: `{ordered: false, maxRetransmits: 0}` for minimum delay
   - WebSocket-based signaling for connection establishment (ICE/SDP exchange)

2. **Fallback: WebSocket Relay**
   - AWS API Gateway broadcasts messages when P2P unavailable
   - Moderate latency (50-150ms typical)
   - Reliable for networks with restrictive NAT/firewalls

3. **Local Fallback: localStorage**
   - Cross-tab sync within same browser using storage events
   - Zero-latency for local testing
   - No AWS infrastructure required

### Media Device Testing

- **Camera**: Live video preview with device selection and stream management
- **Microphone**: Real-time audio waveform visualization using Web Audio API
  - `AnalyserNode` extracts frequency data
  - Canvas renders 64-bar frequency spectrum at 60fps
- **Speaker & Video Playback**: Tested via synchronized media playback
  - HTML5 `<audio>` and `<video>` elements for media rendering
  - Tests both audio output and video playback capabilities

### Room-Based Architecture

- Devices join rooms using 4-character alphanumeric codes (e.g., "AB12")
- DynamoDB stores connection-to-room mappings with GSI for efficient queries
- Sync messages include: `{syncAction, mediaType, timestamp, ...data}`
- Supported actions: Load media, Play, Pause

## Features

- **Camera Testing**: Live preview with device selection
- **Microphone Testing**: Real-time audio visualization with frequency spectrum
- **Speaker & Video Testing**: Audio output and video playback via synchronized media
- **Synchronized Media Playback**: Play audio/video in sync across multiple devices
- **Cross-Device Sync**: WebRTC P2P with WebSocket fallback
- **Device Information**: Display browser, OS, and system details
- **Room Management**: Create/join rooms with 4-character codes
- **Connection Status**: Real-time display of P2P connection count or fallback mode

## Quick Start

### Local Testing (No AWS Required)

1. Open `device-tester.html` in a web browser
2. The app will work in "Local Mode" using localStorage
3. Open multiple tabs in the same browser to test cross-tab sync

### Cross-Device Sync (AWS Required)

**Deploy Backend:**

```bash
# Install Lambda dependencies
cd lambda && npm install && cd ..

# Build and deploy to AWS
sam build
sam deploy --guided
```

**Update Frontend:**

After deployment, update the `WEBSOCKET_URL` constant in `device-tester.html` with the WebSocket URL from the deployment output (found in AWS CloudFormation outputs or terminal).

**Deploy Frontend:**

Upload `device-tester.html` to UIUC cPanel hosting.

## Usage

1. **Create or Join a Room**: Click "Create New Room" or enter a 4-character code
2. **Test Devices**:
   - Select camera/microphone from dropdowns
   - Click "Start Camera" or "Start Mic" to test
3. **Test Speakers & Video Playback**:
   - Enter a public audio/video URL (must be CORS-enabled)
   - Click "Load Audio/Video" to load the media
   - Click "Sync Play" to play on all devices in the room
   - Monitor connection status (shows P2P peer count or fallback mode)

## Development Commands

**Build AWS infrastructure:**
```bash
sam build
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

## Requirements

### Browser
- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Camera/microphone permissions required for device testing
- JavaScript enabled

### Media Files
- Audio/video URLs must be publicly accessible and CORS-enabled
- Supported formats: MP3, WAV (audio); MP4, WebM (video)
- Default video URL points to University of Illinois Box storage

### AWS (Optional for Cross-Device Sync)
- AWS account with permissions for API Gateway, Lambda, DynamoDB
- AWS SAM CLI installed for deployment
- Node.js 20.x or later for Lambda runtime

## Files

- `device-tester.html` - Main application (self-contained frontend)
- `template.yaml` - AWS SAM template for serverless infrastructure
- `lambda/` - Lambda function code for WebSocket handling
  - `connect.js` - Connection handler
  - `disconnect.js` - Disconnection handler
  - `message.js` - Message broadcast handler
  - `package.json` - Node.js dependencies (aws-sdk)

## Browser Support

- **Chrome/Edge**: Full support for all features
- **Firefox**: Full support for all features
- **Safari**: Full support (iOS requires user interaction for autoplay)

WebRTC support required for P2P synchronization. All modern browsers support the necessary APIs.

## Cost

With **AWS Free Tier**, typical usage is free:
- API Gateway: 1 million messages/month free
- Lambda: 1 million requests + 400,000 GB-seconds/month free
- DynamoDB: 25 GB storage + 25 read/write capacity units free

Beyond free tier, costs are minimal (typically < $1/month for moderate usage).

## License

University of Illinois - ClassTech Project
