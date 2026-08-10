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

export const RESULTS_TABLE = process.env.RESULTS_TABLE || "QuizResultsTable";

export async function initResultDb() {
  console.log(`[RESULT SERVICE DB] Connecting to DynamoDB (Region: ${region}, Mode: ${endpoint ? 'Local @ ' + endpoint : 'AWS Cloud'})...`);
  try {
    const { TableNames = [] } = await rawClient.send(new ListTablesCommand({}));
    if (!TableNames.includes(RESULTS_TABLE)) {
      console.log(`[RESULT SERVICE DB] Creating DynamoDB table: ${RESULTS_TABLE}...`);
      await rawClient.send(
        new CreateTableCommand({
          TableName: RESULTS_TABLE,
          KeySchema: [
            { AttributeName: "result_id", KeyType: "HASH" },
            { AttributeName: "created_at", KeyType: "RANGE" }
          ],
          AttributeDefinitions: [
            { AttributeName: "result_id", AttributeType: "S" },
            { AttributeName: "created_at", AttributeType: "S" },
            { AttributeName: "username", AttributeType: "S" }
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "UsernameResultsIndex",
              KeySchema: [
                { AttributeName: "username", KeyType: "HASH" },
                { AttributeName: "created_at", KeyType: "RANGE" }
              ],
              Projection: { ProjectionType: "ALL" },
              ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
            }
          ],
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        })
      );
      console.log(`[RESULT SERVICE DB] Table ${RESULTS_TABLE} created successfully.`);
    } else {
      console.log(`[RESULT SERVICE DB] DynamoDB table ${RESULTS_TABLE} is ready.`);
    }
  } catch (err) {
    console.warn(`[RESULT SERVICE DB WARNING] Could not verify/create ${RESULTS_TABLE}:`, err.message || err);
  }
}
