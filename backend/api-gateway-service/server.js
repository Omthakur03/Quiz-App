import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:8001";
const QUIZ_SERVICE_URL = process.env.QUIZ_SERVICE_URL || "http://localhost:8002";
const RESULT_SERVICE_URL = process.env.RESULT_SERVICE_URL || "http://localhost:8003";

// Enable CORS for all routes
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[API GATEWAY] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    gateway: "UP"
  });
});


app.get("/health/dependencies", async (req, res) => {
  const checkService = async (url) => {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return await response.json();
      return { status: "DOWN", code: response.status };
    } catch (err) {
      return { status: "DOWN", error: err.message };
    }
  };

  const [userService, quizService, resultService] = await Promise.all([
    checkService(USER_SERVICE_URL),
    checkService(QUIZ_SERVICE_URL),
    checkService(RESULT_SERVICE_URL)
  ]);

  res.json({
    gateway: "UP",
    services: {
      userService,
      quizService,
      resultService
    }
  });
});

// Proxy routes using pathFilter at root level so Express does not strip the URL prefix
app.use(
  createProxyMiddleware({
    pathFilter: "/api/users",
    target: USER_SERVICE_URL,
    changeOrigin: true
  })
);

app.use(
  createProxyMiddleware({
    pathFilter: "/api/quizzes",
    target: QUIZ_SERVICE_URL,
    changeOrigin: true
  })
);

app.use(
  createProxyMiddleware({
    pathFilter: ["/api/results", "/api/leaderboard"],
    target: RESULT_SERVICE_URL,
    changeOrigin: true
  })
);

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
  console.error("[API GATEWAY ERROR]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Gateway Error",
    status: err.status || 500
  });
});

app.listen(PORT, () => {
  console.log(`🛡️  API Gateway Service running on port ${PORT}`);
  console.log(` ├── User Service:   ${USER_SERVICE_URL}`);
  console.log(` ├── Quiz Service:   ${QUIZ_SERVICE_URL}`);
  console.log(` └── Result Service: ${RESULT_SERVICE_URL}`);
});
