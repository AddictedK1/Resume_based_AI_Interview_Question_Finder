import { PDFParse } from "pdf-parse";

import { ApiError } from "../utils/apiError.js";
import { QuestionSubmission } from "../models/QuestionSubmission.js";
import { extractSkillsFromResumeText } from "../utils/skillExtractor.js";

const normalizeTags = (tags) =>
  [...new Set((tags || []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 10);

export const createSubmission = async (req, res) => {
  const { questionText, tags, company, seenInInterview } = req.body;

  const submission = await QuestionSubmission.create({
    questionText,
    tags: normalizeTags(tags),
    company: company || "",
    seenInInterview,
    submittedBy: req.user.sub,
  });

  return res.status(201).json({
    message: "Question submitted for admin review",
    submission: {
      id: submission._id,
      status: submission.status,
      createdAt: submission.createdAt,
    },
  });
};

export const listMySubmissions = async (req, res) => {
  const submissions = await QuestionSubmission.find({ submittedBy: req.user.sub })
    .sort({ createdAt: -1 })
    .select("questionText tags company seenInInterview status adminNote createdAt reviewedAt");

  return res.status(200).json({ submissions });
};

export const uploadResumeAndExtractSkills = async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Resume PDF is required");
  }

  const parser = new PDFParse({ data: req.file.buffer });
  let parsed;

  try {
    parsed = await parser.getText();
  } finally {
    await parser.destroy();
  }

  const resumeText = (parsed?.text || "").trim();

  if (!resumeText) {
    throw new ApiError(400, "Could not read text from the uploaded PDF");
  }

  const skills = extractSkillsFromResumeText(resumeText);

  return res.status(200).json({
    message: "Resume uploaded and analyzed successfully",
    fileName: req.file.originalname,
    skills,
    totalSkills: skills.length,
  });
};
