const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.CONNECTIONS_TABLE;

exports.handler = async (event) => {
  console.log('Disconnect event:', JSON.stringify(event));

  const connectionId = event.requestContext.connectionId;

  try {
    await ddb.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        connectionId: connectionId
      }
    }));

    console.log(`Connection ${connectionId} removed`);

    return {
      statusCode: 200,
      body: 'Disconnected'
    };
  } catch (err) {
    console.error('Error removing connection:', err);
    return {
      statusCode: 500,
      body: 'Failed to disconnect: ' + err.message
    };
  }
};
