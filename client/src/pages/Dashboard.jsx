import React, { useEffect, useState } from "react";
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [submissionError, setSubmissionError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState("");
  const [contributionForm, setContributionForm] = useState({
    questionText: "",
    tags: "",
    company: "",
    seenInInterview: "no",
  });

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const authUser = localStorage.getItem("authUser");
    if (!authUser || !accessToken) {
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
      navigate("/login");
    }
  }, [navigate]);

  const fetchMySubmissions = async (currentToken) => {
    const response = await fetch(`${API_BASE_URL}/questions/submissions/me`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Could not fetch your submissions");
    }

    setSubmissions(data.submissions || []);
  };

  useEffect(() => {
    if (!token) return;

    fetchMySubmissions(token).catch((error) => {
      setSubmissionError(error.message || "Could not load your submissions");
    });
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
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

      const response = await fetch(`${API_BASE_URL}/questions/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
      await fetchMySubmissions(token);
    } catch (error) {
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

  const handleUpload = (e) => {
    e.preventDefault();
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setResumeLoaded(true);
    }, 1500);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-foreground font-sans">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-md border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-bold text-secondary-foreground tracking-tight">
          <BrainCircuit className="w-6 h-6 text-primary" />
          Interview Buddy Workspace
        </div>
        <div className="flex items-center gap-4">
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
      <main className="max-w-7xl mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative mt-4">
        {location.state?.adminAccessDenied && (
          <div className="lg:col-span-12 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {location.state.message || "You do not have access to the admin dashboard."}
          </div>
        )}
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Left Side: Upload & Input Zone */}
        <div className="lg:col-span-5 space-y-6 relative z-10">
          <Card className="bg-white/60 backdrop-blur-xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Resume Parsing</CardTitle>
              <CardDescription>Upload your latest resume (PDF) for sentient analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              {!resumeLoaded ? (
                <div 
                  className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-4 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={handleUpload}
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
                <div className="border border-border rounded-xl p-4 flex items-center gap-4 bg-white/80">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <File className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">john_doe_resume_2024.pdf</p>
                    <p className="text-xs text-green-600 font-medium">Analysis Complete ✓</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setResumeLoaded(false)}>Remove</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-xl border-border/50 shadow-sm disabled:opacity-50">
            <CardHeader>
              <CardTitle>Target Archetype</CardTitle>
              <CardDescription>Configure the AI persona for your mock questions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Interview Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="bg-primary/5 border-primary text-primary">Technical</Button>
                  <Button variant="outline">Behavioral</Button>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">Target Role / Seniority</label>
                <input type="text" placeholder="e.g. Senior Frontend Engineer" className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <Button 
                className="w-full mt-4 h-12 rounded-lg text-base shadow-lg shadow-primary/20" 
                disabled={!resumeLoaded || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Insight...</>
                ) : (
                  <><PlayCircle className="w-5 h-5 mr-2" /> Generate Questions</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Contribute Interview Question</CardTitle>
              <CardDescription>
                Submit a question for admin review. Approved questions are added to the main dataset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleContributionSubmit} className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Question</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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

          <Card className="bg-white/60 backdrop-blur-xl border-border/50 shadow-sm">
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
                    <div key={item._id} className="rounded-md border border-border/60 bg-white/80 p-3">
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
        </div>

        {/* Right Side: Generated Questions Feed */}
        <div className="lg:col-span-7 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">The Oracle's Insights</h2>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Intelligent Feed Active
            </div>
          </div>

          <div className="space-y-6">
            {/* Example Question List (Static for UI Demo) */}
            <Card className="bg-white/80 backdrop-blur-xl border-border/50 shadow-md hover:-translate-y-1 transition-transform duration-300">
              <CardHeader className="pb-4">
                <div className="flex gap-2 mb-3">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full tracking-wider uppercase">System Design</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full tracking-wider uppercase">Deep Dive</span>
                </div>
                <CardTitle className="text-lg leading-relaxed">
                  "I see you implemented a micro-frontend architecture at your last role. How did you handle shared state management and cross-app routing without causing significant latency?"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/40 p-4 rounded-lg border border-border/40">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Why the Oracle asks:</strong> Highlighting your experience from "TechCorp" block in your resume. Evaluates your understanding of complex architecture integration strategies.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border-border/50 shadow-md hover:-translate-y-1 transition-transform duration-300">
              <CardHeader className="pb-4">
                <div className="flex gap-2 mb-3">
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full tracking-wider uppercase">Behavioral</span>
                </div>
                <CardTitle className="text-lg leading-relaxed">
                  "Tell me about a time when a critical bug slipped into production due to a flaw in your team's CI/CD pipeline. How did you diagnose the root cause, address it, and prevent recurrence?"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/40 p-4 rounded-lg border border-border/40">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Why the Oracle asks:</strong> Addresses the transition mentioned in your resume from manual QA to automated deployment. Evaluates problem-solving under pressure.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Empty State / Bottom Indicator */}
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Generate more questions based on your targeted role to expand the feed.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
