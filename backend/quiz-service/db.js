import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
import { INITIAL_QUESTION_POOL } from "./seedData.js";

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

export const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE || "QuestionsTable";

export async function initQuizDb() {
  console.log(`[QUIZ SERVICE DB] Connecting to DynamoDB (Region: ${region}, Mode: ${endpoint ? 'Local @ ' + endpoint : 'AWS Cloud'})...`);
  try {
    const { TableNames = [] } = await rawClient.send(new ListTablesCommand({}));
    if (!TableNames.includes(QUESTIONS_TABLE)) {
      console.log(`[QUIZ SERVICE DB] Creating DynamoDB table: ${QUESTIONS_TABLE}...`);
      await rawClient.send(
        new CreateTableCommand({
          TableName: QUESTIONS_TABLE,
          KeySchema: [
            { AttributeName: "question_id", KeyType: "HASH" },
            { AttributeName: "category", KeyType: "RANGE" }
          ],
          AttributeDefinitions: [
            { AttributeName: "question_id", AttributeType: "S" },
            { AttributeName: "category", AttributeType: "S" }
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "CategoryIndex",
              KeySchema: [{ AttributeName: "category", KeyType: "HASH" }],
              Projection: { ProjectionType: "ALL" },
              ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
            }
          ],
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        })
      );
      console.log(`[QUIZ SERVICE DB] Table ${QUESTIONS_TABLE} created successfully. Seeding initial questions...`);
      await seedQuestions();
    } else {
      console.log(`[QUIZ SERVICE DB] DynamoDB table ${QUESTIONS_TABLE} is ready.`);
      try {
        const scanRes = await docClient.send(new ScanCommand({ TableName: QUESTIONS_TABLE, Limit: 1 }));
        if (!scanRes.Items || scanRes.Items.length === 0) {
          await seedQuestions();
        }
      } catch (err) {
        console.warn(`[QUIZ SERVICE DB WARNING] Could not scan ${QUESTIONS_TABLE}:`, err.message || err);
      }
    }
  } catch (err) {
    console.warn(`[QUIZ SERVICE DB WARNING] Could not verify/create ${QUESTIONS_TABLE}:`, err.message || err);
  }
}

export async function seedQuestions() {
  for (const q of INITIAL_QUESTION_POOL) {
    try {
      await docClient.send(
        new PutCommand({
          TableName: QUESTIONS_TABLE,
          Item: q
        })
      );
    } catch (err) {
      console.warn(`[QUIZ SERVICE DB WARNING] Failed to seed question ${q.question_id}:`, err.message || err);
    }
  }
  console.log(`[QUIZ SERVICE DB] Seeded ${INITIAL_QUESTION_POOL.length} DevOps questions into ${QUESTIONS_TABLE}.`);
}
