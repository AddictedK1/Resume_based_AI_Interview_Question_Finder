import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage({ type = "login" }) {
  const isLogin = type === "login";
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Dummy redirection for UI demonstration
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#fdfcfb] flex">
      {/* Visual Asymmetric Left Side */}
      <div className="hidden lg:flex w-[60%] relative flex-col justify-between p-12 overflow-hidden items-start bg-secondary">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-purple-500/10 pointer-events-none" />
        <div className="absolute -left-[20%] -top-[20%] w-[140%] h-[140%] bg-primary/5 blur-[120px] rounded-full mix-blend-multiply" />
        
        <Link to="/" className="relative z-10 flex items-center gap-2 text-2xl font-bold tracking-tight text-secondary-foreground">
          <BrainCircuit className="w-8 h-8 text-primary" />
          Oracle AI
        </Link>

        <div className="relative z-10 max-w-lg mb-12">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Uncover your technical blind spots before the recruiter does.
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of candidates who turned their rejections into offers. 
            The Digital Oracle prepares you for exactly what your dream company will ask.
          </p>
        </div>
      </div>

      {/* Auth Form Right Side */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-white relative">
        <Card className="w-full max-w-md border-transparent shadow-none">
          <CardHeader className="text-center px-0">
            <CardTitle className="text-3xl font-extrabold tracking-tight">
              {isLogin ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isLogin ? "Enter your credentials to access your dashboard." : "Enter your details to generate your first set of questions."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <Input type="text" placeholder="John Doe" required className="h-12 bg-[#f9fafb]" />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input type="email" placeholder="john@example.com" required className="h-12 bg-[#f9fafb]" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  {isLogin && <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>}
                </div>
                <Input type="password" placeholder="••••••••" required className="h-12 bg-[#f9fafb]" />
              </div>
              <Button type="submit" className="w-full h-12 mt-6 text-base tracking-wide rounded-lg">
                {isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link to={isLogin ? "/signup" : "/login"} className="text-primary font-medium hover:underline">
                {isLogin ? "Sign up" : "Sign in"}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
