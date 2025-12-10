const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.CONNECTIONS_TABLE;

exports.handler = async (event) => {
  console.log('Connect event:', JSON.stringify(event));

  const connectionId = event.requestContext.connectionId;
  const roomCode = event.queryStringParameters?.roomCode || 'DEFAULT';

  // Store connection in DynamoDB
  const ttl = Math.floor(Date.now() / 1000) + 86400; // 24 hours TTL

  try {
    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        connectionId: connectionId,
        roomCode: roomCode,
        connectedAt: new Date().toISOString(),
        ttl: ttl
      }
    }));

    console.log(`Connection ${connectionId} added to room ${roomCode}`);

    return {
      statusCode: 200,
      body: 'Connected'
    };
  } catch (err) {
    console.error('Error storing connection:', err);
    return {
      statusCode: 500,
      body: 'Failed to connect: ' + err.message
    };
  }
};
