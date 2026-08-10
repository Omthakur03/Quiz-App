import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { docClient, USERS_TABLE, initUserDb } from "./db.js";
import { QueryCommand, PutCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

// Handle malformed JSON body errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Invalid JSON format in request body. Please check quotation marks and syntax.",
      status: 400
    });
  }
  next(err);
});

// In-memory fallback map if DynamoDB is unreachable locally
const inMemoryUsers = new Map();

// Initialize DB schema on boot
initUserDb();

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.json({ service: "user-service", status: "UP", port: PORT });
});

// Helper: Case-insensitive search across DynamoDB (Query/Scan) and in-memory store
const findUserByUsername = async (username) => {
  if (!username) return null;
  const trimmed = username.trim().toLowerCase();

  // 1. Try GSI Query first
  try {
    const queryResult = await docClient.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: "UsernameIndex",
        KeyConditionExpression: "username = :u",
        ExpressionAttributeValues: { ":u": username.trim() }
      })
    );
    if (queryResult.Items && queryResult.Items.length > 0) {
      return queryResult.Items[0];
    }
  } catch (err) {
    // If UsernameIndex GSI is missing, fall through to ScanCommand
  }

  // 2. Fallback ScanCommand for tables without GSI
  try {
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: USERS_TABLE
      })
    );
    if (scanResult.Items && scanResult.Items.length > 0) {
      const match = scanResult.Items.find(
        item => item.username && item.username.trim().toLowerCase() === trimmed
      );
      if (match) return match;
    }
  } catch (scanErr) {
    console.warn("DynamoDB Scan failed:", scanErr.message);
  }

  // 3. Fallback memory store
  for (const [key, user] of inMemoryUsers.entries()) {
    if (key.toLowerCase() === trimmed) {
      return user;
    }
  }

  return null;
};

// User handler logic
const handleUserRegistration = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    if (!username || typeof username !== "string" || !username.trim()) {
      return res.status(400).json({ error: "Username is required" });
    }

    const trimmedUsername = username.trim();
    const userAvatar = avatar || "⚡";

    const existingUser = await findUserByUsername(trimmedUsername);

    if (existingUser) {
      return res.status(409).json({
        error: "Username is already taken. Please choose a different username."
      });
    }

    // Create new user item
    const newUser = {
      user_id: `usr_${uuidv4()}`,
      username: trimmedUsername,
      avatar: userAvatar,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      total_quizzes: 0,
      highest_score: 0
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: USERS_TABLE,
          Item: newUser
        })
      );
    } catch (err) {
      console.warn("DynamoDB Put failed, using memory store:", err.message);
    }
    inMemoryUsers.set(trimmedUsername, newUser);

    return res.status(201).json({
      message: "User registered successfully",
      user: newUser
    });
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const handleGetUser = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await findUserByUsername(username);

    if (user) {
      return res.json({ user });
    }

    res.status(404).json({ error: "User not found" });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Handler: Update user stats (total_quizzes and highest_score)
const handleUpdateUserStats = async (req, res) => {
  try {
    const { username } = req.params;
    const { score } = req.body;
    const numScore = Number(score) || 0;

    const existingUser = await findUserByUsername(username);

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentTotal = existingUser.total_quizzes || 0;
    const currentHighest = existingUser.highest_score || 0;
    const newTotalQuizzes = currentTotal + 1;
    const newHighestScore = Math.max(currentHighest, numScore);
    const lastActiveAt = new Date().toISOString();

    const updatedUser = {
      ...existingUser,
      total_quizzes: newTotalQuizzes,
      highest_score: newHighestScore,
      last_active_at: lastActiveAt
    };

    try {
      await docClient.send(
        new UpdateCommand({
          TableName: USERS_TABLE,
          Key: { user_id: existingUser.user_id },
          UpdateExpression: "SET total_quizzes = :tq, highest_score = :hs, last_active_at = :la",
          ExpressionAttributeValues: {
            ":tq": newTotalQuizzes,
            ":hs": newHighestScore,
            ":la": lastActiveAt
          }
        })
      );
    } catch (err) {
      console.warn("DynamoDB Update failed, updating memory store:", err.message);
    }

    inMemoryUsers.set(existingUser.username, updatedUser);

    return res.json({
      message: "User stats updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mount handlers on multiple route aliases for robust proxy compatibility
app.post(["/api/users", "/users", "/"], handleUserRegistration);
app.get(["/api/users/:username", "/users/:username"], handleGetUser);
app.put(["/api/users/:username/stats", "/users/:username/stats"], handleUpdateUserStats);

// 404 Handler in JSON format
app.use((req, res) => {
  res.status(404).json({
    error: "Route Not Found",
    status: 404,
    method: req.method,
    path: req.originalUrl || req.url
  });
});

// Global Error Handler in JSON format
app.use((err, req, res, next) => {
  console.error("[USER SERVICE ERROR]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal User Service Error",
    status: err.status || 500
  });
});

app.listen(PORT, () => {
  console.log(`👤 User Service running on port ${PORT}`);
});
