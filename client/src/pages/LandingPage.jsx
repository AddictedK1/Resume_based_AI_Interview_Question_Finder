import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, Sparkles, FileText, Target, BrainCircuit } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fdfcfb] text-foreground font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-white/70 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-secondary-foreground">
          <BrainCircuit className="w-6 h-6 text-primary" />
          Oracle AI
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link to="/signup">
            <Button className="rounded-full shadow-lg shadow-primary/20 transition-transform active:scale-95">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium tracking-wide">
            <Sparkles className="w-4 h-4" />
            Introducing the Digital Oracle
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-secondary-foreground">
            Ace Your Interviews with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">
              AI-Powered Questions
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your resume and let our sentient analysis engine generate the most challenging, 
            tailored interview questions for your dream role.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/signup">
              <Button size="lg" className="rounded-full text-base h-14 px-8 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                Start Generating <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full text-base h-14 px-8 bg-white/50 backdrop-blur-sm">
              View Demo
            </Button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-8 relative">
          {/* Decorative background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          
          <Card className="bg-white/60 backdrop-blur-xl border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4 text-orange-600">
                <FileText className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Resume Parsing</CardTitle>
              <CardDescription className="text-base mt-2">
                Deep analysis of your experience, identifying gaps and highlighting key achievements.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/60 backdrop-blur-xl border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 md:translate-y-4">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-4 text-amber-600">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Sentient AI</CardTitle>
              <CardDescription className="text-base mt-2">
                Questions are generated contextually, adapting to the level of seniority and industry standard.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/60 backdrop-blur-xl border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 md:translate-y-8">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-4 text-rose-600">
                <Target className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Targeted Archetypes</CardTitle>
              <CardDescription className="text-base mt-2">
                Practice structured behavioral and specific technical rounds designed for your target company.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
