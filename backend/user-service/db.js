import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_REGION || "us-east-1";
const rawEndpoint = process.env.DYNAMODB_ENDPOINT ? process.env.DYNAMODB_ENDPOINT.trim() : "";
const endpoint = rawEndpoint !== "" ? rawEndpoint : undefined;

const clientConfig = { region };

if (endpoint) {
  clientConfig.endpoint = endpoint;
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fakeAccessKeyId",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "fakeSecretAccessKey"
  };
} else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== "fakeAccessKeyId") {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {})
  };
}

const rawClient = new DynamoDBClient(clientConfig);
export const docClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true }
});

export const USERS_TABLE = process.env.USERS_TABLE || "UsersTable";

export async function initUserDb() {
  console.log(`[USER SERVICE DB] Connecting to DynamoDB (Region: ${region}, Mode: ${endpoint ? 'Local @ ' + endpoint : 'AWS Cloud'})...`);
  try {
    const { TableNames = [] } = await rawClient.send(new ListTablesCommand({}));
    if (!TableNames.includes(USERS_TABLE)) {
      console.log(`[USER SERVICE DB] Creating DynamoDB table: ${USERS_TABLE}...`);
      await rawClient.send(
        new CreateTableCommand({
          TableName: USERS_TABLE,
          KeySchema: [{ AttributeName: "user_id", KeyType: "HASH" }],
          AttributeDefinitions: [
            { AttributeName: "user_id", AttributeType: "S" },
            { AttributeName: "username", AttributeType: "S" }
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "UsernameIndex",
              KeySchema: [{ AttributeName: "username", KeyType: "HASH" }],
              Projection: { ProjectionType: "ALL" },
              ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
            }
          ],
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        })
      );
      console.log(`[USER SERVICE DB] Table ${USERS_TABLE} created successfully in DynamoDB!`);
    } else {
      console.log(`[USER SERVICE DB] DynamoDB table ${USERS_TABLE} is ready.`);
    }
  } catch (err) {
    console.warn(`[USER SERVICE DB WARNING] Could not verify/create ${USERS_TABLE}:`, err.message || err);
    console.warn(`[USER SERVICE DB] Will attempt operations on ${USERS_TABLE} or fallback to memory if unreachable.`);
  }
}
