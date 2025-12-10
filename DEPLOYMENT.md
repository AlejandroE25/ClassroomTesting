# Deployment Instructions for ClassTech Device Tester

This guide will help you deploy the WebSocket backend to AWS for real cross-device synchronization.

## Prerequisites

1. **AWS Account** - You need an active AWS account
2. **AWS CLI** - Install from: https://aws.amazon.com/cli/
3. **AWS SAM CLI** - Install from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
4. **Node.js** - Version 18 or later

## Step 1: Configure AWS Credentials

```bash
aws configure
```

Enter your AWS Access Key ID, Secret Access Key, region (e.g., `us-east-1`), and output format (`json`).

## Step 2: Install Lambda Dependencies

```bash
cd lambda
npm install
cd ..
```

## Step 3: Build and Deploy with SAM

```bash
# Build the application
sam build

# Deploy the application (guided deployment for first time)
sam deploy --guided
```

During the guided deployment, you'll be asked:
- **Stack Name**: Enter a name like `device-tester-websocket`
- **AWS Region**: Choose your preferred region (e.g., `us-east-1`)
- **Confirm changes**: Y
- **Allow SAM CLI IAM role creation**: Y
- **Disable rollback**: N
- **Save arguments to samconfig.toml**: Y

The deployment will take 2-5 minutes.

## Step 4: Get the WebSocket URL

After deployment completes, you'll see output like:

```
CloudFormation outputs from deployed stack
------------------------------------------------------------------------
Outputs
------------------------------------------------------------------------
Key                 WebSocketURI
Description         WebSocket URI for the Device Tester
Value               wss://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
------------------------------------------------------------------------
```

**Copy the WebSocket URL** (starts with `wss://`).

## Step 5: Update the HTML File

Open `device-tester.html` and find this line near the top of the `<script>` section:

```javascript
const WEBSOCKET_URL = 'YOUR_WEBSOCKET_URL_HERE';
```

Replace `YOUR_WEBSOCKET_URL_HERE` with your WebSocket URL:

```javascript
const WEBSOCKET_URL = 'wss://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod';
```

Save the file.

## Step 6: Test the Application

1. Open `device-tester.html` in a browser on your computer
2. Open the same file in a browser on your phone (or another device)
3. Note the room code on the first device
4. On the second device, enter that room code and click "Join Room"
5. Try loading a video and clicking "Sync Play" - both devices should play simultaneously!

## Hosting the HTML File

### Option A: AWS S3 + CloudFront (Recommended)

1. Create an S3 bucket:
```bash
aws s3 mb s3://your-bucket-name
```

2. Enable static website hosting:
```bash
aws s3 website s3://your-bucket-name --index-document device-tester.html
```

3. Upload the HTML file:
```bash
aws s3 cp device-tester.html s3://your-bucket-name/ --acl public-read
```

4. Create a CloudFront distribution for HTTPS access (recommended for WebSocket)

### Option B: GitHub Pages

1. Create a GitHub repository
2. Push `device-tester.html` to the repository
3. Enable GitHub Pages in repository settings
4. Access via `https://yourusername.github.io/repo-name/device-tester.html`

### Option C: Any Web Server

Upload `device-tester.html` to any web server. The file is completely self-contained.

## Monitoring and Debugging

### View Lambda Logs

```bash
sam logs -n ConnectFunction --stack-name device-tester-websocket --tail
sam logs -n MessageFunction --stack-name device-tester-websocket --tail
```

### Check DynamoDB Connections

```bash
aws dynamodb scan --table-name DeviceTesterConnections
```

### Browser Console

Open browser developer tools (F12) and check the Console tab for WebSocket connection logs.

## Cost Estimates

With AWS Free Tier:
- **API Gateway**: 1M messages/month free, then $1.00/million
- **Lambda**: 1M requests/month free, then $0.20/million
- **DynamoDB**: 25GB storage free, 25 WCU/RCU free

For a small classroom (20 devices, 10 sync events/minute, 1-hour session):
- Messages: ~12,000/session
- **Estimated cost**: $0.00 (well within free tier)

## Troubleshooting

### WebSocket won't connect
- Verify the WebSocket URL starts with `wss://` (not `ws://`)
- Check AWS CloudWatch Logs for Lambda errors
- Ensure IAM permissions are correct (SAM should handle this)

### Messages not syncing
- Open browser console on both devices to see WebSocket messages
- Check that both devices joined the same room code
- Verify Lambda function logs show messages being received

### "Local Mode" showing instead of "Connected"
- You haven't updated the `WEBSOCKET_URL` in the HTML file yet
- The app falls back to localStorage (same-browser only)

## Cleanup

To remove all AWS resources:

```bash
sam delete --stack-name device-tester-websocket
```

This will delete:
- API Gateway WebSocket API
- Lambda functions
- DynamoDB table
- All associated IAM roles and permissions

## Security Notes

- The current implementation has no authentication (anyone with room code can join)
- For production use, consider adding:
  - API key authentication
  - Rate limiting
  - Room expiration
  - Encryption for sensitive data

## Support

For AWS SAM issues: https://github.com/aws/aws-sam-cli/issues
For application issues: Check browser console and Lambda CloudWatch logs
