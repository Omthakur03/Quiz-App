import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { docClient, QUESTIONS_TABLE, initQuizDb, seedQuestions } from "./db.js";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { INITIAL_QUESTION_POOL } from "./seedData.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

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

// Initialize DB schema on boot
initQuizDb();

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.json({ service: "quiz-service", status: "UP", port: PORT });
});

// Helper function to shuffle an array
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Handler: Get random quiz
const handleGetRandomQuiz = async (req, res) => {
  try {
    const count = parseInt(req.query.count, 10) || 5;
    let allQuestions = [];

    try {
      const scanRes = await docClient.send(new ScanCommand({ TableName: QUESTIONS_TABLE }));
      if (scanRes.Items && scanRes.Items.length > 0) {
        allQuestions = scanRes.Items;
      }
    } catch (err) {
      console.warn("DynamoDB Scan failed, using initial memory pool:", err.message);
    }

    if (allQuestions.length === 0) {
      allQuestions = INITIAL_QUESTION_POOL;
    }

    const shuffled = shuffleArray(allQuestions).slice(0, count);

    // Sanitize: strip out correct_option and explanation for client-side security
    const sanitizedQuestions = shuffled.map(q => ({
      id: q.question_id,
      question_id: q.question_id,
      category: q.category,
      question: q.question,
      options: q.options
    }));

    res.json({
      count: sanitizedQuestions.length,
      questions: sanitizedQuestions
    });
  } catch (error) {
    console.error("Error fetching random quiz:", error);
    res.status(500).json({ error: "Failed to generate quiz assessment" });
  }
};

// Handler: Submit quiz answers
const handleSubmitQuiz = async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: "Answers payload must be an array" });
    }

    let allQuestions = [];
    try {
      const scanRes = await docClient.send(new ScanCommand({ TableName: QUESTIONS_TABLE }));
      if (scanRes.Items && scanRes.Items.length > 0) {
        allQuestions = scanRes.Items;
      }
    } catch (err) {
      console.warn("DynamoDB fetch for grading failed, using initial memory pool:", err.message);
    }

    if (allQuestions.length === 0) {
      allQuestions = INITIAL_QUESTION_POOL;
    }

    const questionMap = new Map();
    allQuestions.forEach(q => {
      questionMap.set(q.question_id || String(q.id), q);
    });

    let score = 0;
    const answerBreakdown = [];

    answers.forEach((ans, idx) => {
      const qId = ans.question_id || ans.id;
      const questionItem = questionMap.get(qId) || allQuestions[idx] || {};

      const correctOpt = questionItem.correct_option !== undefined ? questionItem.correct_option : questionItem.correct;
      const isCorrect = ans.selectedOption === correctOpt;

      if (isCorrect) score += 1;

      answerBreakdown.push({
        question_id: qId,
        question: questionItem.question || ans.question,
        category: questionItem.category || ans.category || "DevOps",
        options: questionItem.options || ans.options || [],
        selectedOption: ans.selectedOption !== undefined ? ans.selectedOption : null,
        correctOption: correctOpt,
        isCorrect,
        explanation: questionItem.explanation || "No explanation available."
      });
    });

    const total = answers.length || 5;
    const percentage = Math.round((score / total) * 100);

    res.json({
      score,
      total,
      percentage,
      timeTaken: timeTaken || 0,
      answers: answerBreakdown
    });
  } catch (error) {
    console.error("Error evaluating quiz submission:", error);
    res.status(500).json({ error: "Failed to evaluate quiz submission" });
  }
};

// Handler: Seed questions
const handleSeedQuestions = async (req, res) => {
  try {
    await seedQuestions();
    res.json({ message: "Quiz questions seeded successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Route aliases
app.get(["/api/quizzes/random", "/quizzes/random", "/random"], handleGetRandomQuiz);
app.post(["/api/quizzes/submit", "/quizzes/submit", "/submit"], handleSubmitQuiz);
app.post(["/api/quizzes/seed", "/quizzes/seed", "/seed"], handleSeedQuestions);

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
  console.error("[QUIZ SERVICE ERROR]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Quiz Service Error",
    status: err.status || 500
  });
});

app.listen(PORT, () => {
  console.log(`🧩 Quiz Service running on port ${PORT}`);
});
