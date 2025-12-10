# WebRTC P2P Testing Guide

Your ClassTech Device Tester now uses **WebRTC DataChannels** for ultra-low latency peer-to-peer synchronization!

## Architecture

```
Device A                    AWS (Signaling Only)                Device B
--------                    --------------------                --------
   │                                                               │
   ├─── WebSocket ──────> Lambda ──────> WebSocket ──────────────┤
   │   (Exchange offers/answers/ICE)                              │
   │                                                               │
   └──────────────────> P2P DataChannel <─────────────────────────┘
              (Sync messages: 10-50ms latency!)
```

### How It Works

1. **WebSocket (Signaling)**: Used to find peers and exchange connection info
2. **WebRTC (Data)**: Direct peer-to-peer connection for sync messages
3. **Fallback**: If P2P fails, falls back to WebSocket relay

## Testing Your WebRTC Setup

### Step 1: Open Device A (Computer)

1. Open `device-tester.html` in Chrome/Edge (best WebRTC support)
2. Open browser console (F12 → Console tab)
3. Look for: `My Peer ID: xxxxxxxxxxxxx`
4. Status should show: **"Connected (Signaling)"**
5. Note the 4-character room code

### Step 2: Open Device B (Phone/Tablet/Another Browser)

1. Open `device-tester.html` on second device
2. Enter the room code from Device A
3. Click "Join Room"
4. Open console and watch the magic happen!

### Step 3: Watch P2P Connection Establish

In the console, you should see:

```
Device A:
---------
✅ WebSocket connected
📤 Sending: join message
👤 New peer joined: Device B's peer ID
🔄 Initiating connection to Device B
📤 Sending offer to Device B
📤 Sending ICE candidate to Device B (multiple times)
📥 Received answer from Device B
✅ DataChannel opened with Device B
📊 Status: P2P Connected (1)

Device B:
---------
✅ WebSocket connected
📤 Sending: join message
📥 Received offer from Device A
📤 Sending answer to Device A
📤 Sending ICE candidate to Device A (multiple times)
✅ DataChannel opened with Device A
📊 Status: P2P Connected (1)
```

### Step 4: Test Ultra-Low Latency Sync

1. On either device, click "Load Video"
2. Click "Sync Play"
3. In console, look for: `📡 Sent via P2P DataChannel to X peers`
4. Both devices should play **instantly** (10-50ms delay)

### Connection Status Indicators

**"Disconnected"** (Red)
- Not connected to server
- No P2P or WebSocket connection

**"Connected (Signaling)"** (Orange)
- WebSocket connected to AWS
- No P2P connections yet
- Will use WebSocket for sync (50-150ms latency)

**"P2P Connected (1)"** (Green) ✨
- Direct peer-to-peer connection established!
- Messages sent via DataChannel (10-50ms latency)
- Number shows how many peers you're connected to

**"P2P Connected (2)"** (Green) ✨✨
- Connected to 2 peers (3 devices total)
- Full mesh network established

## Console Messages Explained

### P2P Messages (Ultra-Fast!)
```
📡 Sent via P2P DataChannel to 2 peers: {syncAction: 'play', ...}
```
✅ Using WebRTC - **10-50ms latency**

### WebSocket Fallback (Still Fast)
```
📤 Sending via WebSocket (fallback): {syncAction: 'play', ...}
```
⚠️ P2P not ready yet - **50-150ms latency**

### Local Mode (Testing Only)
```
💾 Sending via localStorage (local only): {syncAction: 'play', ...}
```
❌ Not connected to AWS - only works in same browser

## Testing Latency

### Method 1: Visual Test
1. Load a video with a timer or clock
2. Click "Sync Play"
3. Watch both screens - they should be nearly identical
4. **P2P**: < 50ms difference (almost imperceptible)
5. **WebSocket**: 50-150ms difference (slightly noticeable)

### Method 2: Console Timestamps
1. Send a sync message from Device A
2. Check `timestamp` in console on Device A
3. Check received `timestamp` in console on Device B
4. Difference should be 10-50ms with P2P!

### Method 3: Audio Test
1. Load the same audio file on both devices
2. Use speakers (not headphones)
3. Click "Sync Play"
4. Listen for echo - P2P should have minimal echo

## Troubleshooting

### Status stuck on "Connected (Signaling)"

**Cause**: P2P connection failed, using WebSocket fallback

**Common reasons:**
- Strict corporate firewall blocking UDP
- Symmetric NAT (rare on home networks)
- Browser doesn't support WebRTC DataChannels

**Solution:**
- Still works! Just using WebSocket (slower but reliable)
- Try different network (home WiFi usually works)
- Use Chrome/Edge (best WebRTC support)

### "Connection state: failed"

**Cause**: Network changed or firewall blocked connection

**Solution:**
- Will auto-reconnect via WebSocket
- Refresh page to retry P2P
- Check firewall settings

### ICE candidates not exchanging

**Console shows:**
```
❌ Sending ICE candidate to peer (but no response)
```

**Solution:**
1. Both devices must be on networks that allow UDP
2. Check browser console for errors
3. Try opening both devices on same WiFi network first
4. STUN server might be blocked - try adding to ICE_SERVERS

### Messages not syncing

**Check console:**
- Look for `📡 Sent via P2P` or `📤 Sending via WebSocket`
- If nothing appears, check if you're in the same room
- Verify both devices show "Connected" status

## Performance Metrics

### Expected Latency by Method

| Method | Latency | Use Case |
|--------|---------|----------|
| **WebRTC P2P** | **10-50ms** | **Production (your setup!)** |
| WebSocket Relay | 50-150ms | Fallback if P2P fails |
| localStorage | 0ms | Local testing only |

### Network Requirements

**For WebRTC P2P:**
- ✅ Home WiFi - Works great
- ✅ Mobile 4G/5G - Works great
- ⚠️ Corporate networks - May be blocked
- ⚠️ Public WiFi - May have NAT issues
- ❌ Heavily firewalled - Falls back to WebSocket

**For WebSocket Fallback:**
- ✅ Works everywhere (HTTPS only)

## Advanced: Adding TURN Server

If you need P2P to work on ALL networks (including strict firewalls):

### Option 1: Free coturn on your server
```javascript
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    {
        urls: 'turn:your-turn-server.com:3478',
        username: 'user',
        credential: 'pass'
    }
];
```

### Option 2: Twilio (Paid)
```javascript
// Get TURN credentials from Twilio API
const ICE_SERVERS = [
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
        urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
        username: 'from-api',
        credential: 'from-api'
    }
];
```

**Cost**: ~$0.50 per GB of relayed traffic (only used if direct P2P fails)

## Testing Checklist

- [ ] Device A: Shows "P2P Connected (1)" when Device B joins
- [ ] Device B: Shows "P2P Connected (1)" when joined
- [ ] Console shows: `📡 Sent via P2P DataChannel`
- [ ] Video sync happens in < 50ms (nearly instant)
- [ ] Works when devices on same WiFi
- [ ] Works when devices on different networks (mobile data + WiFi)
- [ ] If P2P fails, falls back to WebSocket
- [ ] 3 devices: Shows "P2P Connected (2)" on each device

## Third Device Test

With 3 devices, the mesh looks like:

```
    Device A
    /      \
   /        \
Device B -- Device C
```

Each device has 2 P2P connections:
- Device A → B and A → C
- Device B → A and B → C
- Device C → A and C → B

**Status on each device**: "P2P Connected (2)"

## Bandwidth Usage

### WebRTC P2P
```
Sync message: ~100 bytes
10 events/min: 1 KB/min
1-hour session: 60 KB total
Cost: FREE (no AWS involved!)
```

### WebSocket Relay (Fallback)
```
Sync message: ~200 bytes (with routing info)
10 events/min × 3 devices: ~6 KB/min
1-hour session: 360 KB total
AWS cost: $0.00 (free tier)
```

## DataChannel Configuration

Current settings optimized for ultra-low latency:

```javascript
pc.createDataChannel('sync', {
    ordered: false,      // Don't wait for lost packets
    maxRetransmits: 0    // Don't retransmit (speed > reliability)
});
```

This means:
- ✅ **Lowest possible latency** (10-20ms)
- ⚠️ **Rare message loss** (<0.1% on good networks)
- ✅ **Perfect for play/pause** (OK if occasional message lost)

For critical messages, change to:
```javascript
{ ordered: true, maxRetransmits: 3 }  // More reliable, slightly slower
```

## Browser Compatibility

| Browser | P2P DataChannels | Notes |
|---------|------------------|-------|
| Chrome 90+ | ✅ Excellent | Best performance |
| Edge 90+ | ✅ Excellent | Same engine as Chrome |
| Firefox 90+ | ✅ Good | Works well |
| Safari 15+ | ✅ Good | Some quirks on iOS |
| Mobile Chrome | ✅ Excellent | Works great |
| Mobile Safari | ⚠️ Limited | May need user gesture |

## Monitoring Connection Quality

Add this to see connection stats:

```javascript
// Paste in browser console
setInterval(async () => {
    for (const [peerId, pc] of peerConnections) {
        const stats = await pc.getStats();
        stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                console.log(`Connection to ${peerId}:`, {
                    rtt: report.currentRoundTripTime * 1000 + 'ms',
                    bytesSent: report.bytesSent,
                    bytesReceived: report.bytesReceived
                });
            }
        });
    }
}, 5000);
```

**rtt** (Round Trip Time): Should be < 50ms for good P2P connection

---

## Success!

You now have **ultra-low latency P2P synchronization** with automatic fallback!

🎯 **Target latency**: 10-50ms
🔄 **Fallback latency**: 50-150ms
💰 **Cost**: $0 (P2P is free!)
📊 **Scalability**: Perfect for 2-3 devices

Enjoy near-instant synchronization for your A/B testing! 🚀
