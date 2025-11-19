import express from "express";
import routes from "./routes.js";

// Load dotenv so we can read environment variables from .env
import dotenv from "dotenv";
dotenv.config();

// Import the CORS middleware
import cors from "cors";

const app = express();

// Get allowed frontend URL from environment (fallback to dev URL)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Apply CORS middleware, restricting access ONLY to your frontend.
app.use(cors({
    origin: FRONTEND_URL,
}));

// Allow backend to parse JSON request bodies
app.use(express.json());

// Mount all routes (login, register, profile)
app.use('', routes);

export default app;