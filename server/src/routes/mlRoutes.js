import express from "express";
import axios from "axios";
import mongoose from "mongoose";
import { authenticate } from "../middleware/authenticate.js";
import { QuestionGenerationSession } from "../models/QuestionGenerationSession.js";

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

        const response = await axios.post(
            `${ML_API_URL}/get-questions-by-skills`,
            {
                skills,
                max_per_skill: maxPerSkill || 5,
            },
        );

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

// POST /api/ml/save-questions-to-session — save ML questions to a session
router.post("/save-questions-to-session", authenticate, async (req, res) => {
    try {
        const { sessionId, questions } = req.body;
        const userId = req.user.id;

        if (!sessionId) {
            return res.status(400).json({ error: "sessionId is required" });
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return res
                .status(400)
                .json({ error: "questions array is required" });
        }

        // Validate sessionId is a valid MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            return res.status(400).json({ error: "Invalid sessionId" });
        }

        // Find the session and ensure it belongs to the user
        const session = await QuestionGenerationSession.findOne({
            _id: sessionId,
            user: userId,
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // Extract unique questions to avoid duplicates within the new batch
        const existingQuestionTexts = new Set(
            session.mlDatasetQuestions.map((q) => q.question),
        );

        const newQuestions = questions.filter(
            (q) => !existingQuestionTexts.has(q.question),
        );

        // Add new questions to the session
        session.mlDatasetQuestions.push(...newQuestions);
        await session.save();

        res.json({
            message: "Questions saved to session",
            addedCount: newQuestions.length,
            totalCount: session.mlDatasetQuestions.length,
        });
    } catch (error) {
        console.error("Error saving questions to session:", error.message);
        res.status(500).json({
            error: "Could not save questions to session",
            details: error.message,
        });
    }
});

// POST /api/ml/create-session — create a new QuestionGenerationSession and attach ML dataset questions
router.post("/create-session", authenticate, async (req, res) => {
    try {
        const {
            targetRole,
            targetCompany,
            targetLevel,
            targetDomain,
            sourceFileName,
            resumeSkills,
            mlQuestions,
            displayName,
        } = req.body;

        if (!Array.isArray(mlQuestions) || mlQuestions.length === 0) {
            return res
                .status(400)
                .json({ error: "mlQuestions array is required" });
        }

        const userId = req.user.id || req.user.sub;

        const session = await QuestionGenerationSession.create({
            user: userId,
            targetRole: targetRole || "",
            targetCompany: targetCompany || "",
            targetLevel: targetLevel || "mid",
            targetDomain: targetDomain || "",
            sourceFileName: sourceFileName || "",
            resumeSkills: Array.isArray(resumeSkills) ? resumeSkills : [],
            mlDatasetQuestions: mlQuestions.map((q) => ({
                question: q.question,
                topic: q.topic || q.topic || "Unknown",
                difficulty: q.difficulty || "Unknown",
            })),
            displayName: displayName || null,
        });

        return res.status(201).json({ message: "Session created", session });
    } catch (error) {
        console.error("Could not create ML session:", error.message);
        return res
            .status(500)
            .json({
                error: "Could not create session",
                details: error.message,
            });
    }
});

export default router;
