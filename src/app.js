import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true, 
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(express.static("public"));

app.use(cookieParser());

// routes
import userRouter from './routes/user.routes.js'
import videoRouter from "./routes/video.routes.js"
import tweetRouter from "./routes/tweet.routes.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/tweets", tweetRouter)

// Global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
});

// 404 handler - for routes that don't exist
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    statusCode: 404,
    message: "Resource not found"
  });
});

//https://localhost:8000/api/v1/users/register

export { app };
