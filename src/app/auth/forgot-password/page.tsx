
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, AlertTriangle, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!email) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      setSuccessMessage("Password reset email sent! Please check your inbox (and spam folder).");
      toast({
        title: "Password Reset Email Sent",
        description: "Follow the instructions in the email to reset your password.",
      });
      setEmail(""); 
    } catch (err: any) {
      console.error("Password Reset Error:", err);
      let friendlyMessage = "Failed to send password reset email. Please try again.";
      if (err.code === 'auth/invalid-email') {
        friendlyMessage = "The email address is not valid.";
      } else if (err.code === 'auth/user-not-found') {
        friendlyMessage = "No user found with this email address.";
      }
      setError(friendlyMessage);
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: friendlyMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/50 p-6 text-center space-y-2">
          <div className="inline-block">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Forgot Your Password?</CardTitle>
          <CardDescription className="text-muted-foreground">
            No worries! Enter your email below and we&apos;ll send you a link to reset it.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert variant="default" className="mb-4 border-green-500 bg-green-50 text-green-700 [&>svg]:text-green-500">
                <Send className="h-4 w-4" />
              <AlertTitle>Email Sent</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          {!successMessage && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 py-3"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3 flex items-center gap-2" disabled={isLoading}>
                {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>}
                <Send className="h-5 w-5" /> Send Reset Link
              </Button>
            </form>
          )}

          <div className="mt-4 text-center">
            <Button variant="link" asChild className="text-sm text-primary hover:underline p-0">
              <Link href="/auth/signin">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sign In
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
