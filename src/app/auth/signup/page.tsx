
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Mail, KeyRound, ShieldQuestion } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Textarea } from "@/components/ui/textarea";

// Google Icon SVG as a component
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

export default function SignUpPage() {
  const [isCulturalUser, setIsCulturalUser] = useState(false);
  const [culturalInterest, setCulturalInterest] = useState("");

  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Implement Firebase email/password sign up
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const fullData = { ...data, isCulturalUser, culturalInterest: isCulturalUser ? culturalInterest : "" };
    console.log("Sign Up Data:", fullData);
    // In a real app, this data would be sent to Firebase Authentication and Firestore
    alert("Sign up functionality to be implemented. Check console for data.");
  };

  const handleGoogleSignUp = () => {
    // TODO: Implement Firebase Google Sign Up
    alert("Google Sign up functionality to be implemented.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-lg shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/50 p-6 text-center space-y-2">
          <div className="inline-block">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Create an Account</CardTitle>
          <CardDescription className="text-muted-foreground">Join Culture Compass and start exploring or sharing routes.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                 <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="fullName" name="fullName" type="text" placeholder="Your Name" required className="pl-10 py-3"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="you@example.com" required className="pl-10 py-3"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="password" name="password" type="password" placeholder="•••••••• (min. 6 characters)" required className="pl-10 py-3"/>
              </div>
            </div>
            
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-start space-x-3 mt-3 p-3 rounded-md border border-input bg-card">
                <ShieldQuestion className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-grow space-y-2">
                    <div className="flex items-start space-x-3">
                         <Checkbox 
                            id="isCulturalUser" 
                            checked={isCulturalUser}
                            onCheckedChange={(checked) => setIsCulturalUser(Boolean(checked))}
                            className="mt-1"
                            aria-labelledby="culturalUserLabel"
                        />
                        <div className="grid gap-1.5 leading-none">
                        <Label
                            htmlFor="isCulturalUser"
                            id="culturalUserLabel"
                            className="text-sm font-medium text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            I am a "Cultural Sphere User"
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Select this if you represent or wish to promote specific traditional/cultural aspects through routes.
                        </p>
                        </div>
                    </div>

                    {isCulturalUser && (
                        <div className="space-y-2 pt-2">
                        <Label htmlFor="culturalInterest" className="text-sm font-medium">Describe your Cultural Focus</Label>
                        <Textarea
                            id="culturalInterest"
                            name="culturalInterest"
                            value={culturalInterest}
                            onChange={(e) => setCulturalInterest(e.target.value)}
                            placeholder="e.g., Local folk music, traditional textile arts, historical landmarks of the Edo period, etc."
                            rows={2}
                            className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            This helps us understand your area of expertise or interest. This information may be displayed with routes you create.
                        </p>
                        </div>
                    )}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3 flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Sign Up
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or sign up with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full text-base py-3 flex items-center gap-3 border-border hover:bg-accent/10" onClick={handleGoogleSignUp}>
            <GoogleIcon />
            Sign up with Google
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

