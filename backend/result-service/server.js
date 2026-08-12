import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { docClient, RESULTS_TABLE, initResultDb } from "./db.js";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8003;

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

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:8001";

// Memory store fallback
let inMemoryResults = [];

// Initialize DB schema on boot
initResultDb();

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.json({ service: "result-service", status: "UP", port: PORT });
});

// Helper: Performance badge assignment
function getPerformanceBadge(score, total = 5) {
  const percentage = (score / total) * 100;
  if (percentage === 100) return { title: "DevOps Master", color: "#00f2fe", icon: "🏆", tag: "Flawless Score" };
  if (percentage >= 80) return { title: "Cloud Specialist", color: "#38ef7d", icon: "⚡", tag: "Excellent Performance" };
  if (percentage >= 60) return { title: "SysAdmin Specialist", color: "#4facfe", icon: "🛠️", tag: "Solid Knowledge" };
  if (percentage >= 40) return { title: "Junior Engineer", color: "#f12711", icon: "🌱", tag: "Keep Practicing" };
  return { title: "DevOps Cadet", color: "#ff8c00", icon: "📚", tag: "Needs Review" };
}

// Helper: Sort leaderboard (Score DESC, TimeTaken ASC)
function sortLeaderboard(list) {
  return [...list].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return (a.timeTaken || 0) - (b.timeTaken || 0);
  });
}

// Handler: Leaderboard
const handleGetLeaderboard = async (req, res) => {
  try {
    let results = [];
    try {
      const scanRes = await docClient.send(new ScanCommand({ TableName: RESULTS_TABLE }));
      if (scanRes.Items && scanRes.Items.length > 0) {
        results = scanRes.Items;
      }
    } catch (err) {
      console.warn("DynamoDB Scan failed, using memory store:", err.message);
    }

    if (results.length === 0) {
      results = inMemoryResults;
    }

    const sorted = sortLeaderboard(results);
    res.json({
      total: sorted.length,
      leaderboard: sorted
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

// Handler: Save Quiz Result
const handleSaveResult = async (req, res) => {
  try {
    const { username, avatar, score, total, timeTaken } = req.body;

    const resultId = `res_${uuidv4()}`;
    const isoDate = new Date().toISOString();
    const formattedDate = isoDate.split("T")[0];

    const resultEntry = {
      id: resultId,
      result_id: resultId,
      username: username || "Anonymous Engineer",
      avatar: avatar || "⚡",
      score: score !== undefined ? score : 0,
      total: total || 5,
      timeTaken: timeTaken || 0,
      percentage: Math.round(((score || 0) / (total || 5)) * 100),
      date: formattedDate,
      created_at: isoDate,
      status: "COMPLETED"
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: RESULTS_TABLE,
          Item: resultEntry
        })
      );
    } catch (err) {
      console.warn("DynamoDB Put failed, using memory store:", err.message);
    }

    inMemoryResults.push(resultEntry);

    // Notify user-service to update highest_score, total_quizzes, and last_active_at in DynamoDB UsersTable
    if (resultEntry.username && resultEntry.username !== "Anonymous Engineer") {
      try {
        const notifyUrl = `${USER_SERVICE_URL}/users/${encodeURIComponent(resultEntry.username)}/stats`;
        console.log(`[RESULT SERVICE] Notifying user-service at ${notifyUrl} with score=${resultEntry.score}...`);
        const notifyRes = await fetch(notifyUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: resultEntry.score })
        });
        if (notifyRes.ok) {
          console.log(`[RESULT SERVICE] Successfully updated user stats for ${resultEntry.username}`);
        } else {
          console.warn(`[RESULT SERVICE WARNING] user-service returned ${notifyRes.status} on stats update`);
        }
      } catch (err) {
        console.warn("Failed to notify user-service of quiz completion:", err.message);
      }
    }

    let allResults = [];
    try {
      const scanRes = await docClient.send(new ScanCommand({ TableName: RESULTS_TABLE }));
      if (scanRes.Items && scanRes.Items.length > 0) {
        allResults = scanRes.Items;
      }
    } catch (err) {
      console.warn("DynamoDB fetch failed for rank calculation:", err.message);
    }

    if (allResults.length === 0) {
      allResults = inMemoryResults;
    }

    const sortedLeaderboard = sortLeaderboard(allResults);
    const rankIndex = sortedLeaderboard.findIndex(r => r.result_id === resultId || r.id === resultId);
    const rank = rankIndex !== -1 ? rankIndex + 1 : 1;
    const badge = getPerformanceBadge(resultEntry.score, resultEntry.total);

    res.status(201).json({
      message: "Result saved successfully",
      entry: resultEntry,
      rank,
      totalEntries: sortedLeaderboard.length,
      leaderboard: sortedLeaderboard,
      badge
    });
  } catch (error) {
    console.error("Error saving quiz result:", error);
    res.status(500).json({ error: "Failed to save quiz result" });
  }
};

// Handler: Get User Attempt History
const handleGetUserHistory = async (req, res) => {
  try {
    const { username } = req.params;
    let userResults = [];

    // 1. Try GSI Query first
    try {
      const queryRes = await docClient.send(
        new QueryCommand({
          TableName: RESULTS_TABLE,
          IndexName: "UsernameResultsIndex",
          KeyConditionExpression: "username = :u",
          ExpressionAttributeValues: { ":u": username }
        })
      );
      if (queryRes.Items && queryRes.Items.length > 0) {
        userResults = queryRes.Items;
      }
    } catch (err) {
      console.warn("DynamoDB GSI Query failed for user results, falling back to ScanCommand:", err.message);
    }

    // 2. Fallback ScanCommand if GSI query returned 0 items or failed
    if (userResults.length === 0) {
      try {
        const scanRes = await docClient.send(
          new ScanCommand({
            TableName: RESULTS_TABLE,
            FilterExpression: "username = :u",
            ExpressionAttributeValues: { ":u": username }
          })
        );
        if (scanRes.Items && scanRes.Items.length > 0) {
          userResults = scanRes.Items;
        }
      } catch (scanErr) {
        console.warn("DynamoDB Scan failed for user results:", scanErr.message);
      }
    }

    // 3. Fallback memory store if DynamoDB returned 0 items
    if (userResults.length === 0) {
      userResults = inMemoryResults.filter(r => r.username === username);
    }

    // Sort user results by date/created_at DESC
    userResults.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

    res.json({
      username,
      totalAttempts: userResults.length,
      history: userResults
    });
  } catch (error) {
    console.error("Error fetching user results:", error);
    res.status(500).json({ error: "Failed to fetch user result history" });
  }
};

// Route aliases
app.get(["/api/leaderboard", "/leaderboard"], handleGetLeaderboard);
app.post(["/api/results", "/results", "/"], handleSaveResult);
app.get(["/api/results/user/:username", "/results/user/:username"], handleGetUserHistory);

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
  console.error("[RESULT SERVICE ERROR]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Result Service Error",
    status: err.status || 500
  });
});

app.listen(PORT, () => {
  console.log(`🏆 Result Service running on port ${PORT}`);
});
