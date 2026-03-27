import { QuestionSubmission } from "../models/QuestionSubmission.js";

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
