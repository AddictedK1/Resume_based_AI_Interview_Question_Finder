import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  BrainCircuit,
  UploadCloud,
  File,
  PlayCircle,
  Loader2,
  LogOut,
  ShieldCheck,
  Send,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";
import { fadeUp, getFadeUpWithDelay } from "@/lib/motion";
import { authFetch, clearAuthSession, ensureSession, logoutSession } from "@/lib/auth";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const resumeInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [resumeError, setResumeError] = useState("");
  const [resumeSuccess, setResumeSuccess] = useState("");
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [generatedSession, setGeneratedSession] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [targetLevel, setTargetLevel] = useState("mid");
  const [targetDomain, setTargetDomain] = useState("");
  const [selectedPracticeQuestion, setSelectedPracticeQuestion] = useState(null);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState("");
  const [contributionForm, setContributionForm] = useState({
    questionText: "",
    tags: "",
    company: "",
    seenInInterview: "no",
  });

  const handleAuthFailure = (error) => {
    if (error?.message !== "AUTH_REQUIRED") return false;
    clearAuthSession();
    navigate("/login", { replace: true });
    return true;
  };

  useEffect(() => {
    const bootstrapSession = async () => {
      const valid = await ensureSession();
      const authUser = localStorage.getItem("authUser");
      const accessToken = localStorage.getItem("accessToken");

      if (!valid || !authUser || !accessToken) {
        clearAuthSession();
        navigate("/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(authUser);
        if (parsedUser.role === "admin") {
          navigate("/admin", { replace: true });
          return;
        }
        setUser(parsedUser);
        setToken(accessToken);
      } catch (error) {
        console.error("Failed to parse user data", error);
        clearAuthSession();
        navigate("/login");
      }
    };

    bootstrapSession();
  }, [navigate]);

  const fetchMySubmissions = async () => {
    const response = await authFetch("/questions/submissions/me");

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Could not fetch your submissions");
    }

    setSubmissions(data.submissions || []);
  };

  const loadQuestionHistory = async () => {
    setHistoryLoading(true);

    try {
      const response = await authFetch("/questions/history");
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not load question history");
      }

      setQuestionHistory(data.sessions || []);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchMySubmissions().catch((error) => {
      if (handleAuthFailure(error)) return;
      setSubmissionError(error.message || "Could not load your submissions");
    });

    loadQuestionHistory().catch((error) => {
      if (handleAuthFailure(error)) return;
      setSubmissionError(error.message || "Could not load question history");
    });
  }, [token]);

  const handleLogout = async () => {
    await logoutSession();
    navigate("/login");
  };

  const handleContributionField = (field) => (event) => {
    setContributionForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleContributionSubmit = async (event) => {
    event.preventDefault();
    setSubmissionError("");
    setSubmissionSuccess("");
    setSubmissionLoading(true);

    try {
      const payload = {
        questionText: contributionForm.questionText.trim(),
        tags: contributionForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        company: contributionForm.company.trim(),
        seenInInterview: contributionForm.seenInInterview === "yes",
      };

      const response = await authFetch("/questions/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not submit question");
      }

      setSubmissionSuccess(data.message || "Question submitted for admin review.");
      setContributionForm({
        questionText: "",
        tags: "",
        company: "",
        seenInInterview: "no",
      });
      await fetchMySubmissions();
    } catch (error) {
      if (handleAuthFailure(error)) return;
      setSubmissionError(error.message || "Could not submit question");
    } finally {
      setSubmissionLoading(false);
    }
  };

  const getUserInitials = (fullName) => {
    if (!fullName) return "U";
    return fullName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUploadClick = () => {
    resumeInputRef.current?.click();
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!token) {
      setResumeError("You must be logged in to upload resume files.");
      event.target.value = "";
      return;
    }

    if (file.type !== "application/pdf") {
      setResumeError("Please upload a PDF file only.");
      event.target.value = "";
      return;
    }

    setResumeError("");
    setResumeSuccess("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await authFetch("/questions/resume/skills", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not analyze resume");
      }

      setResumeFileName(data.fileName || file.name);
      setExtractedSkills(data.skills || []);
      setResumeSuccess(data.message || "Resume analyzed successfully.");
      setIsUploading(false);
      setResumeLoaded(true);
    } catch (error) {
      if (handleAuthFailure(error)) return;
      setIsUploading(false);
      setResumeLoaded(false);
      setResumeError(error.message || "Could not analyze resume");
    } finally {
      event.target.value = "";
    }
  };

  const handleSelectHistorySession = (session) => {
    setGeneratedSession(session);
    setSelectedPracticeQuestion(session.generatedQuestions?.[0] || null);
    setPracticeAnswer("");
    setPracticeFeedback(null);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSubmissionError("");

    try {
      const response = await authFetch("/questions/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetRole: targetRole.trim(),
          targetCompany: targetCompany.trim(),
          targetLevel,
          targetDomain: targetDomain.trim(),
          sourceFileName: resumeFileName,
          resumeSkills: extractedSkills,
          questionCount: 5,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not generate questions");
      }

      const session = data.session;
      setGeneratedSession(session);
      setSelectedPracticeQuestion(session?.generatedQuestions?.[0] || null);
      setPracticeAnswer("");
      setPracticeFeedback(null);
      await loadQuestionHistory();
    } catch (error) {
      if (handleAuthFailure(error)) return;
      setSubmissionError(error.message || "Could not generate questions");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePracticeSubmit = async (event) => {
    event.preventDefault();

    if (!selectedPracticeQuestion) {
      setSubmissionError("Select a question before asking for feedback.");
      return;
    }

    setPracticeLoading(true);
    setSubmissionError("");

    try {
      const response = await authFetch("/questions/practice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionText: selectedPracticeQuestion.questionText,
          answerText: practiceAnswer.trim(),
          generationSessionId: generatedSession?._id || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not analyze your answer");
      }

      setPracticeFeedback(data.attempt);
    } catch (error) {
      if (handleAuthFailure(error)) return;
      setSubmissionError(error.message || "Could not analyze your answer");
    } finally {
      setPracticeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-foreground font-sans">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-border/40 dark:border-slate-700/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-bold text-secondary-foreground tracking-tight">
          <BrainCircuit className="w-6 h-6 text-primary" />
          Interview Buddy Workspace
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user?.role === "admin" && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="gap-2">
                <ShieldCheck className="w-4 h-4" /> Admin Panel
              </Button>
            </Link>
          )}
          <span className="text-sm font-medium text-muted-foreground mr-4">Welcome, {user?.fullName || "User"}</span>
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-xs">
            {user ? getUserInitials(user.fullName) : "U"}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-2">
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 relative mt-4">
        {location.state?.adminAccessDenied && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6">
            {location.state.message || "You do not have access to the admin dashboard."}
          </div>
        )}
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

        <motion.div
          className="space-y-6 relative z-10"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50 dark:border-slate-700/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Add Resume</CardTitle>
              <CardDescription className="text-center">Upload your latest resume (PDF) for analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={resumeInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleUpload}
              />
              {!resumeLoaded ? (
                <div 
                  className="border-2 border-dashed border-border dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-4 bg-muted/30 dark:bg-slate-700/30 hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={handleUploadClick}
                >
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  ) : (
                    <UploadCloud className="w-10 h-10 text-muted-foreground" />
                  )}
                  <div className="text-center">
                    <p className="text-sm font-medium">{isUploading ? "Uploading & Analyzing..." : "Click to upload your resume"}</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF max 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="border border-border dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 bg-white/80 dark:bg-slate-800/80">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <File className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{resumeFileName || "uploaded_resume.pdf"}</p>
                    <p className="text-xs text-green-600 font-medium">Analysis Complete ✓</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setResumeLoaded(false);
                      setResumeFileName("");
                      setExtractedSkills([]);
                      setResumeSuccess("");
                      setResumeError("");
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}

              {resumeError && <p className="mt-3 text-sm text-red-600">{resumeError}</p>}
              {resumeSuccess && <p className="mt-3 text-sm text-green-700">{resumeSuccess}</p>}

              {resumeLoaded && extractedSkills.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Extracted Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {extractedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <motion.div initial="hidden" animate="visible" variants={getFadeUpWithDelay(0.1)}>
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-border/50 dark:border-slate-700/50 shadow-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Predicted Questions</CardTitle>
                <CardDescription>Generate a saved question set from your resume skills, then practice your answer below.</CardDescription>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    value={targetRole}
                    onChange={(event) => setTargetRole(event.target.value)}
                    placeholder="Target role, e.g. Senior Frontend Engineer"
                  />
                  <Input
                    value={targetCompany}
                    onChange={(event) => setTargetCompany(event.target.value)}
                    placeholder="Target company, e.g. Google"
                  />
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={targetLevel}
                    onChange={(event) => setTargetLevel(event.target.value)}
                  >
                    <option value="intern">Intern</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                  <Input
                    value={targetDomain}
                    onChange={(event) => setTargetDomain(event.target.value)}
                    placeholder="Domain, e.g. fintech"
                  />
                </div>
                <div className="mt-3 flex justify-center">
                  <Button className="h-11 rounded-lg sm:w-72" disabled={!resumeLoaded || isGenerating} onClick={handleGenerate}>
                    {isGenerating ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><PlayCircle className="w-5 h-5 mr-2" /> Generate Questions</>
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <Card className="border-border/60 bg-background/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Skill-Gap Insights</CardTitle>
                    <CardDescription>Missing skills are inferred from your role filters vs resume skills.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {generatedSession?.skillGap ? (
                      <>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Matched skills</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(generatedSession.skillGap.matchedSkills || []).length === 0 ? (
                              <p className="text-sm text-muted-foreground">No direct matches yet.</p>
                            ) : (
                              generatedSession.skillGap.matchedSkills.map((skill) => (
                                <span key={skill} className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-200">
                                  {skill}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Missing skills</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(generatedSession.skillGap.missingSkills || []).length === 0 ? (
                              <p className="text-sm text-muted-foreground">Great coverage for this target profile.</p>
                            ) : (
                              generatedSession.skillGap.missingSkills.map((skill) => (
                                <span key={skill} className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                                  {skill}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prioritized learning plan</p>
                          <ul className="mt-2 space-y-1 text-sm text-foreground">
                            {(generatedSession.skillGap.prioritizedLearningPlan || []).map((step) => (
                              <li key={step}>• {step}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Generate questions to see skill-gap insights and learning priorities.</p>
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
                  <div className="space-y-4">
                    {generatedSession?.generatedQuestions?.length ? (
                      generatedSession.generatedQuestions.map((question, index) => (
                        <button
                          key={`${question.questionText}-${index}`}
                          type="button"
                          onClick={() => setSelectedPracticeQuestion(question)}
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            selectedPracticeQuestion?.questionText === question.questionText
                              ? "border-primary bg-primary/5"
                              : "border-border/60 bg-background hover:bg-muted/30"
                          }`}
                        >
                          <div className="mb-2 flex flex-wrap gap-2">
                            {question.tags?.map((tag) => (
                              <span key={tag} className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm font-medium leading-relaxed text-foreground">{question.questionText}</p>
                          {question.focusSkill && (
                            <p className="mt-2 text-xs text-muted-foreground">Focus skill: {question.focusSkill}</p>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                        Upload your resume and generate a set of questions to save a session here.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Card className="border-border/60 bg-background/70">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Answer Practice</CardTitle>
                        <CardDescription>
                          {selectedPracticeQuestion ? "Type your answer and get rubric-based feedback." : "Select a question to practice."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-xl bg-muted/40 p-3 text-sm text-foreground">
                          {selectedPracticeQuestion?.questionText || "No question selected yet."}
                        </div>
                        <form onSubmit={handlePracticeSubmit} className="space-y-3">
                          <textarea
                            className="min-h-[160px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Write your answer here..."
                            value={practiceAnswer}
                            onChange={(event) => setPracticeAnswer(event.target.value)}
                            disabled={!selectedPracticeQuestion || practiceLoading}
                          />
                          <Button type="submit" className="w-full" disabled={!selectedPracticeQuestion || practiceLoading}>
                            {practiceLoading ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reviewing...</>
                            ) : (
                              "Get Feedback"
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {practiceFeedback && (
                      <Card className="border-border/60 bg-background/70">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Feedback</CardTitle>
                          <CardDescription>{practiceFeedback.feedbackSummary}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {Object.entries(practiceFeedback.rubricScore || {}).map(([label, score]) => (
                              <div key={label} className="rounded-xl border border-border/60 p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                                <p className="mt-1 text-lg font-semibold text-foreground">{score}/10</p>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Strengths</p>
                            <ul className="mt-2 space-y-1 text-sm text-foreground">
                              {(practiceFeedback.strengths || []).map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Improve next</p>
                            <ul className="mt-2 space-y-1 text-sm text-foreground">
                              {(practiceFeedback.improvements || []).map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                          <p className="text-sm font-medium text-primary">Overall score: {practiceFeedback.overallScore}/10</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                <Card className="border-border/60 bg-background/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Saved Practice Sets</CardTitle>
                    <CardDescription>Revisit your past generated question sessions by timestamp.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? (
                      <p className="text-sm text-muted-foreground">Loading history...</p>
                    ) : questionHistory.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No saved sessions yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {questionHistory.map((session) => (
                          <button
                            key={session._id}
                            type="button"
                            onClick={() => handleSelectHistorySession(session)}
                            className="w-full rounded-xl border border-border/60 p-3 text-left hover:bg-muted/40"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {session.targetRole || "General practice set"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(session.createdAt).toLocaleString()} • {session.generatedQuestions?.length || 0} questions
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {[session.targetCompany, session.targetLevel, session.targetDomain].filter(Boolean).join(" • ") || "No target filters"}
                                </p>
                              </div>
                              <span className="text-xs font-medium text-primary">Open</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </motion.div>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50 dark:border-slate-700/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Contribute Question</CardTitle>
              <CardDescription>
                Submit a question for admin review. Approved questions are added to the main dataset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleContributionSubmit} className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Question</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-secondary dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter a real interview question you faced"
                    value={contributionForm.questionText}
                    onChange={handleContributionField("questionText")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags (comma separated)</label>
                  <Input
                    placeholder="react, system-design, backend"
                    value={contributionForm.tags}
                    onChange={handleContributionField("tags")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company (optional)</label>
                  <Input
                    placeholder="Example: Google"
                    value={contributionForm.company}
                    onChange={handleContributionField("company")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Have you seen this question in a real interview?</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={contributionForm.seenInInterview === "yes" ? "default" : "outline"}
                      onClick={() =>
                        setContributionForm((prev) => ({ ...prev, seenInInterview: "yes" }))
                      }
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={contributionForm.seenInInterview === "no" ? "default" : "outline"}
                      onClick={() =>
                        setContributionForm((prev) => ({ ...prev, seenInInterview: "no" }))
                      }
                    >
                      No
                    </Button>
                  </div>
                </div>
                {submissionError && <p className="text-sm text-red-600">{submissionError}</p>}
                {submissionSuccess && <p className="text-sm text-green-700">{submissionSuccess}</p>}
                <Button type="submit" className="w-full" disabled={submissionLoading}>
                  {submissionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Submit for Review
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50 dark:border-slate-700/50 shadow-sm">
            <CardHeader>
              <CardTitle>Your Submitted Questions</CardTitle>
              <CardDescription>Track whether admin has reviewed your contributions.</CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
              ) : (
                <div className="space-y-3">
                  {submissions.slice(0, 5).map((item) => (
                    <div key={item._id} className="rounded-md border border-border/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-700/80 p-3">
                      <p className="text-sm font-medium text-foreground">{item.questionText}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-primary uppercase">
                          {item.status}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {item.adminNote && (
                        <p className="mt-2 text-xs text-muted-foreground">Admin note: {item.adminNote}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </main>
    </div>
  );
}
