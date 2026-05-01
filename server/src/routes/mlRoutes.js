import express from "express";

import { authenticate } from "../middleware/authenticate.js";
import { handleUploadResume } from "../middleware/uploadResume.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import MLPipelineService from "../utils/mlPipelineService.js";
import UserSession from "../models/UserSession.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/ml/process-resume
// Full ML pipeline: PDF → extract text → build profile → FAISS search
// Returns extracted skills + matched interview questions
// Also saves results to MongoDB and exports to JSON
// ─────────────────────────────────────────────────────────────────
router.post(
  "/process-resume",
  authenticate,
  handleUploadResume,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Resume PDF is required" });
    }

    const userId = req.user.sub;
    const startTime = Date.now();

    // Step 1: Save resume to disk for the ML pipeline
    const resumePath = await MLPipelineService.saveResumeFile(
      req.file.buffer,
      userId,
    );

    // Step 2: Run the full ML pipeline (extract + profile + FAISS search)
    const result = await MLPipelineService.processResumeEndToEnd(
      resumePath,
      30,   // top_k
      0.15, // min_score (lower threshold to get more results)
    );

    const processingTime = Date.now() - startTime;

    // Step 3: Save to MongoDB (UserSession)
    const userSession = await UserSession.create({
      userId,
      resumePath,
      profileString: result.profileString || "",
      extractedSkills: result.rawSkills || [],
      expandedSkills: result.expandedSkills || [],
      generatedQuestions: (result.questions || []).map((q, idx) => ({
        sr_no: q["sr no"] || q.sr_no || idx + 1,
        topic: q.topic || q.Topic || "General",
        question: q.question || q.Question || "",
        difficulty: q.difficulty || q.Difficulty || "Unknown",
        tags: q.tags || [],
        score: q.similarity_score || q.original_score || 0,
        tag_score: q.tag_overlap || 0,
        final_score: q.combined_score || q.similarity_score || 0,
      })),
      totalQuestions: (result.questions || []).length,
      processingTime,
      status: "completed",
      metadata: {
        userAgent: req.get("user-agent"),
        ipAddress: req.ip,
      },
    });

    // Step 4: Export questions to JSON file for quick access
    const exportData = {
      sessionId: userSession._id,
      userId,
      createdAt: new Date().toISOString(),
      processingTimeMs: processingTime,
      profile: {
        rawSkills: result.rawSkills || [],
        expandedSkills: result.expandedSkills || [],
        sectionsFound: result.sectionsFound || [],
      },
      questions: userSession.generatedQuestions,
      summary: {
        totalQuestions: userSession.totalQuestions,
        byTopic: {},
        byDifficulty: { Easy: 0, Medium: 0, Hard: 0, Unknown: 0 },
      },
    };

    // Calculate summary stats
    userSession.generatedQuestions.forEach((q) => {
      const topic = q.topic || "General";
      exportData.summary.byTopic[topic] =
        (exportData.summary.byTopic[topic] || 0) + 1;

      const diff = q.difficulty || "Unknown";
      const key =
        diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
      if (exportData.summary.byDifficulty[key] !== undefined) {
        exportData.summary.byDifficulty[key]++;
      } else {
        exportData.summary.byDifficulty["Unknown"]++;
      }
    });

    // Save the JSON export to disk
    try {
      const { default: fs } = await import("fs/promises");
      const { default: path } = await import("path");
      const { fileURLToPath } = await import("url");

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const outputDir = path.join(
        __dirname,
        "../../../ML_Preprocessor_scripts/data",
      );
      const outputPath = path.join(
        outputDir,
        `faiss_results_${userId}.json`,
      );

      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
      console.log(`[ML] FAISS results exported to: ${outputPath}`);
    } catch (exportErr) {
      console.warn("[ML] Could not export JSON file:", exportErr.message);
    }

    // Step 5: Return response
    return res.status(200).json({
      success: true,
      message: `ML pipeline completed in ${processingTime}ms`,
      sessionId: userSession._id,
      processingTimeMs: processingTime,
      skills: {
        raw: result.rawSkills || [],
        expanded: result.expandedSkills || [],
      },
      questions: userSession.generatedQuestions,
      totalQuestions: userSession.totalQuestions,
      sectionsFound: result.sectionsFound || [],
    });
  }),
);

// ─────────────────────────────────────────────────────────────────
// GET /api/ml/session/:sessionId
// Retrieve a previously saved ML session with questions
// ─────────────────────────────────────────────────────────────────
router.get(
  "/session/:sessionId",
  authenticate,
  asyncHandler(async (req, res) => {
    const session = await UserSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.sub,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.status(200).json({
      success: true,
      sessionId: session._id,
      status: session.status,
      skills: {
        raw: session.extractedSkills,
        expanded: session.expandedSkills,
      },
      questions: session.generatedQuestions,
      totalQuestions: session.totalQuestions,
      processingTimeMs: session.processingTime,
      createdAt: session.createdAt,
    });
  }),
);

// ─────────────────────────────────────────────────────────────────
// GET /api/ml/health
// Check if the ML API server is reachable
// ─────────────────────────────────────────────────────────────────
router.get(
  "/health",
  asyncHandler(async (_req, res) => {
    const healthy = await MLPipelineService.healthCheck();
    return res.status(healthy ? 200 : 503).json({
      success: healthy,
      message: healthy
        ? "ML API is healthy"
        : "ML API is not reachable. Start it with: cd ML_Preprocessor_scripts && python ml_api_server.py",
    });
  }),
);

export default router;