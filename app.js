import express from "express";
import { corsMiddleware } from "./config/cors.js";
import cookieParser from "cookie-parser";
import UploadVideoRouter from "./api/upload/video/route.js";

const app = express();

/* =========================================================
   GLOBAL MIDDLEWARES
========================================================= */
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

/* =========================================================
   API ROUTES
========================================================= */

// Upload Video API
app.use('/api/upload/video', UploadVideoRouter)

// Health Check
app.get('/', function(req, res) {
  res.json({ message: 'Hello World, Video Streaming is Playing!' });
});

export default app;
