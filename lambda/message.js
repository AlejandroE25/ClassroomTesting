const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.CONNECTIONS_TABLE;
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_ENDPOINT;

exports.handler = async (event) => {
  console.log('Message event:', JSON.stringify(event));

  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body);
  const roomCode = body.roomCode;

  if (!roomCode) {
    return {
      statusCode: 400,
      body: 'roomCode is required'
    };
  }

  // Get all connections in the same room
  try {
    const result = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'RoomCodeIndex',
      KeyConditionExpression: 'roomCode = :roomCode',
      ExpressionAttributeValues: {
        ':roomCode': roomCode
      }
    }));

    console.log(`Found ${result.Items.length} connections in room ${roomCode}`);

    // Create API Gateway Management API client
    const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const apiGateway = new ApiGatewayManagementApiClient({
      endpoint: callbackUrl
    });

    // Broadcast message to all connections in the room (except sender)
    const postCalls = result.Items
      .filter(item => item.connectionId !== connectionId)
      .map(async (item) => {
        try {
          await apiGateway.send(new PostToConnectionCommand({
            ConnectionId: item.connectionId,
            Data: JSON.stringify(body)
          }));
          console.log(`Message sent to ${item.connectionId}`);
        } catch (err) {
          console.error(`Failed to send to ${item.connectionId}:`, err);
          // If connection is stale, remove it
          if (err.statusCode === 410) {
            console.log(`Removing stale connection ${item.connectionId}`);
            await ddb.send(new DeleteCommand({
              TableName: TABLE_NAME,
              Key: { connectionId: item.connectionId }
            }));
          }
        }
      });

    await Promise.all(postCalls);

    return {
      statusCode: 200,
      body: 'Message sent'
    };
  } catch (err) {
    console.error('Error broadcasting message:', err);
    return {
      statusCode: 500,
      body: 'Failed to send message: ' + err.message
    };
  }
};
