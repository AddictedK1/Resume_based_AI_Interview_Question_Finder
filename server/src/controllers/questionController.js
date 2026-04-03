import { PDFParse } from "pdf-parse";

import { ApiError } from "../utils/apiError.js";
import { QuestionGenerationSession } from "../models/QuestionGenerationSession.js";
import { QuestionPracticeAttempt } from "../models/QuestionPracticeAttempt.js";
import { QuestionSubmission } from "../models/QuestionSubmission.js";
import { evaluateAnswerWithGemini } from "../services/geminiService.js";
import { extractSkillsFromResumeText } from "../utils/skillExtractor.js";

const normalizeTags = (tags) =>
  [...new Set((tags || []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 10);

const normalizeTextList = (items) =>
  [...new Set((items || []).map((item) => item.trim().toLowerCase()).filter(Boolean))];

const roleSkillMap = {
  frontend: ["react", "javascript", "typescript", "css", "testing", "performance", "accessibility"],
  backend: ["node.js", "api design", "databases", "authentication", "scalability", "testing"],
  fullstack: ["react", "node.js", "api design", "databases", "system design", "testing"],
  data: ["python", "sql", "statistics", "machine learning", "data visualization"],
  devops: ["ci/cd", "docker", "kubernetes", "cloud", "monitoring", "security"],
};

const domainSkillMap = {
  fintech: ["security", "compliance", "distributed systems", "risk handling"],
  healthcare: ["privacy", "compliance", "reliability", "data governance"],
  ecommerce: ["performance", "scalability", "experimentation", "analytics"],
  ai: ["machine learning", "prompt engineering", "model evaluation", "data pipelines"],
  saas: ["multi-tenant architecture", "billing", "observability", "customer analytics"],
};

const levelSkillMap = {
  intern: ["fundamentals", "debugging", "communication"],
  junior: ["feature ownership", "testing", "code quality"],
  mid: ["system design", "cross-team collaboration", "performance"],
  senior: ["architecture", "mentoring", "trade-off analysis", "scalability"],
  lead: ["technical leadership", "roadmapping", "stakeholder communication", "hiring"],
};

const inferRoleSkills = (targetRole = "") => {
  const role = targetRole.toLowerCase();
  if (role.includes("front")) return roleSkillMap.frontend;
  if (role.includes("back")) return roleSkillMap.backend;
  if (role.includes("full")) return roleSkillMap.fullstack;
  if (role.includes("data") || role.includes("ml")) return roleSkillMap.data;
  if (role.includes("devops") || role.includes("platform")) return roleSkillMap.devops;
  return ["problem solving", "system design", "communication", "ownership", "testing"];
};

const buildSkillGapInsights = ({ resumeSkills, targetRole, targetCompany, targetLevel, targetDomain }) => {
  const normalizedResumeSkills = normalizeTextList(resumeSkills);
  const targetSkills = normalizeTextList([
    ...inferRoleSkills(targetRole),
    ...(domainSkillMap[targetDomain?.toLowerCase()] || []),
    ...(levelSkillMap[targetLevel] || []),
    targetCompany ? `${targetCompany.toLowerCase()} interview prep` : "",
  ]);

  const matchedSkills = targetSkills.filter((skill) =>
    normalizedResumeSkills.some((resumeSkill) => resumeSkill.includes(skill) || skill.includes(resumeSkill)),
  );
  const missingSkills = targetSkills.filter((skill) => !matchedSkills.includes(skill));

  const prioritizedLearningPlan = missingSkills.slice(0, 5).map((skill, index) => {
    const priority = index < 2 ? "High" : index < 4 ? "Medium" : "Low";
    return `${priority}: Build one interview-ready project story for ${skill}.`;
  });

  return {
    matchedSkills,
    missingSkills,
    prioritizedLearningPlan,
  };
};

const defaultQuestionTemplates = [
  ({ skill, targetRole }) =>
    `Describe a project where you applied ${skill}. What did you do, and what was the measurable outcome${targetRole ? ` for the ${targetRole} role` : ""}?`,
  ({ skill }) =>
    `How would you explain your approach to ${skill} to a teammate who had never worked on that area before?`,
  ({ skill }) =>
    `Tell me about a time you had to make a trade-off while working with ${skill}. What did you choose and why?`,
  ({ skill }) =>
    `What is one difficult problem you solved using ${skill}, and how did you validate that your solution was correct?`,
  ({ skill, targetRole }) =>
    `If you joined a team as a ${targetRole || "new hire"}, how would you use ${skill} in your first 30 days?`,
];

const fallbackSkills = ["problem solving", "communication", "ownership", "system design", "collaboration"];

const buildGeneratedQuestions = ({ resumeSkills, targetRole, targetCompany, targetLevel, targetDomain, questionCount }) => {
  const skills = [...new Set((resumeSkills || []).filter(Boolean))].slice(0, questionCount);
  const selectedSkills = skills.length > 0 ? skills : fallbackSkills.slice(0, questionCount);
  const contextParts = [targetRole, targetCompany, targetLevel, targetDomain].filter(Boolean);
  const contextLabel = contextParts.length > 0 ? ` (${contextParts.join(" • ")})` : "";

  return Array.from({ length: questionCount }, (_value, index) => {
    const skill = selectedSkills[index % selectedSkills.length];
    const template = defaultQuestionTemplates[index % defaultQuestionTemplates.length];
    const tags = [skill, targetRole, targetCompany, targetLevel, targetDomain]
      .filter(Boolean)
      .map((item) => item.toLowerCase());

    return {
      questionText: `${template({ skill, targetRole })}${contextLabel}`,
      tags: normalizeTags(tags),
      focusSkill: skill,
    };
  });
};

const scoreAnswerRubric = (answerText, questionText) => {
  const words = answerText.trim().split(/\s+/).filter(Boolean);
  const sentenceCount = Math.max(answerText.split(/[.!?]+/).filter(Boolean).length, 1);
  const hasStructureMarkers = /\b(first|second|third|finally|star|situation|task|action|result)\b/i.test(answerText);
  const hasOutcome = /\b(result|impact|improved|reduced|increased|delivered|shipped|saved)\b/i.test(answerText);
  const hasQuestionKeywords = questionText
    .split(/\s+/)
    .slice(0, 6)
    .some((word) => answerText.toLowerCase().includes(word.toLowerCase()));

  const clarity = Math.min(10, Math.round(words.length / 30) + (sentenceCount >= 3 ? 3 : 1) + (hasStructureMarkers ? 2 : 0));
  const structure = Math.min(10, (hasStructureMarkers ? 5 : 2) + (sentenceCount >= 3 ? 3 : 1));
  const depth = Math.min(10, Math.round(words.length / 45) + (hasOutcome ? 3 : 1) + (answerText.length > 400 ? 2 : 0));
  const relevance = Math.min(10, (hasQuestionKeywords ? 5 : 2) + (answerText.length > 120 ? 3 : 1));

  const overallScore = Math.round((clarity + structure + depth + relevance) / 4);
  const isMatch = relevance >= 6;
  const shouldImprove = overallScore < 8;

  return {
    rubricScore: {
      clarity,
      structure,
      depth,
      relevance,
    },
    overallScore,
    isMatch,
    shouldImprove,
    strengths: [
      hasStructureMarkers ? "Clear structure with guided flow." : "Answer is concise and easy to follow.",
      hasOutcome ? "You mentioned impact or outcomes." : "Consider including measurable results.",
    ],
    improvements: [
      words.length < 80 ? "Expand with more specific details and examples." : "Trim repetition and keep the answer focused.",
      hasQuestionKeywords ? "Good relevance to the question." : "Tie your answer more directly to the asked question.",
    ],
    feedbackSummary:
      overallScore >= 8
        ? "Strong answer. It is structured, relevant, and shows clear impact."
        : overallScore >= 5
          ? "Good foundation. Add more structure, evidence, and measurable outcomes."
          : "Answer needs more structure and deeper examples to be interview-ready.",
  };
};

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

export const generateQuestions = async (req, res) => {
  const { targetRole, targetCompany, targetLevel, targetDomain, sourceFileName, resumeSkills, questionCount } = req.body;
  const skillGap = buildSkillGapInsights({
    resumeSkills,
    targetRole,
    targetCompany,
    targetLevel,
    targetDomain,
  });

  const generationSkills =
    resumeSkills && resumeSkills.length > 0
      ? resumeSkills
      : skillGap.missingSkills.slice(0, questionCount);

  const generatedQuestions = buildGeneratedQuestions({
    resumeSkills: generationSkills,
    targetRole,
    targetCompany,
    targetLevel,
    targetDomain,
    questionCount,
  });

  const session = await QuestionGenerationSession.create({
    user: req.user.sub,
    targetRole,
    targetCompany,
    targetLevel,
    targetDomain,
    sourceFileName,
    resumeSkills: normalizeTags(resumeSkills),
    skillGap,
    generatedQuestions,
  });

  return res.status(201).json({
    message: "Questions generated successfully",
    session,
  });
};

export const listQuestionHistory = async (req, res) => {
  const sessions = await QuestionGenerationSession.find({ user: req.user.sub })
    .sort({ createdAt: -1 })
    .limit(20);

  return res.status(200).json({ sessions });
};

export const practiceAnswerFeedback = async (req, res) => {
  const { questionText, answerText, generationSessionId } = req.body;
  let analysis = null;
  let feedbackProvider = "heuristic";

  try {
    const geminiAnalysis = await evaluateAnswerWithGemini({
      questionText,
      answerText,
    });

    if (geminiAnalysis) {
      analysis = {
        rubricScore: geminiAnalysis.rubricScore,
        overallScore: geminiAnalysis.overallScore,
        isMatch: geminiAnalysis.isMatch,
        shouldImprove: geminiAnalysis.shouldImprove,
        feedbackSummary: geminiAnalysis.feedbackSummary,
        strengths: geminiAnalysis.strengths,
        improvements: geminiAnalysis.improvements,
      };
      feedbackProvider = "gemini";
    }
  } catch (error) {
    console.warn("Gemini feedback failed. Falling back to heuristic scoring:", error.message);
  }

  if (!analysis) {
    analysis = scoreAnswerRubric(answerText, questionText);
  }

  const attempt = await QuestionPracticeAttempt.create({
    user: req.user.sub,
    generationSession: generationSessionId || null,
    questionText,
    answerText,
    rubricScore: analysis.rubricScore,
    overallScore: analysis.overallScore,
    isMatch: analysis.isMatch,
    shouldImprove: analysis.shouldImprove,
    feedbackSummary: analysis.feedbackSummary,
    strengths: analysis.strengths,
    improvements: analysis.improvements,
  });

  return res.status(201).json({
    message: "Practice feedback generated",
    attempt,
    feedbackProvider,
  });
};
