import express from "express";
import axios from "axios";

import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

// GET /api/ml/question — fetch a single random question
router.get("/question", async (req, res) => {
  try {
    const response = await axios.get(`${ML_API_URL}/get-question`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "ML API error" });
  }
});

// POST /api/ml/questions-by-skills — fetch questions filtered by resume skills
router.post("/questions-by-skills", authenticate, async (req, res) => {
  try {
    const { skills, maxPerSkill } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: "skills array is required" });
    }

    const response = await axios.post(`${ML_API_URL}/get-questions-by-skills`, {
      skills,
      max_per_skill: maxPerSkill || 5,
    });

    res.json(response.data);
  } catch (error) {
    const isConnectionError =
      error.code === "ECONNREFUSED" ||
      error.code === "ECONNRESET" ||
      error.code === "ENOTFOUND";

    console.error(
      "ML API /get-questions-by-skills error:",
      isConnectionError
        ? `Connection refused at ${ML_API_URL} — is the ML API server running?`
        : error?.response?.data || error.message,
    );

    res.status(502).json({
      error: isConnectionError
        ? `ML API server is not reachable at ${ML_API_URL}. Please start it with: cd ML_Preprocessor_scripts && uvicorn ml_api:app --reload --port 8000`
        : "Could not fetch questions from ML API",
      details: error?.response?.data || error.message,
    });
  }
});

export default router;