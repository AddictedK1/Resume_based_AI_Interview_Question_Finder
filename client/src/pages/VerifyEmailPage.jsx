import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const hasRequested = useRef(false);

  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  useEffect(() => {
    if (hasRequested.current) {
      return;
    }

    hasRequested.current = true;

    const verify = async () => {
      if (!email || !token) {
        setStatus("error");
        setMessage("Invalid verification link. Please request a new verification email.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Verification failed");
        }

        setStatus("success");
        setMessage(data.message || "Email verified successfully. You can now log in.");
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Verification failed");
      }
    };

    verify();
  }, [email, token]);

  return (
    <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            {status === "loading" ? "Verifying Email" : status === "success" ? "Email Verified" : "Verification Failed"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Link to="/login" className="w-full sm:w-auto">
            <Button className="w-full">Go to Login</Button>
          </Link>
          {status === "error" && (
            <Link to="/signup" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                Create New Account
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}