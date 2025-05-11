
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, KeyRound } from "lucide-react";
import { Logo } from "@/components/common/logo";

import { getAuth, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from "firebase/auth";
import { getFirestore, doc, setDoc }  from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
// import { app as firebaseApp } from '@/lib/firebase'; // Not strictly needed if using getAuth() without args and firebase is initialized

// Google Icon SVG as a component
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);


export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Implement Firebase email/password sign in
    toast({
        variant: "default", // Or another appropriate variant
        title: "Sign In (Email/Password)",
        description: "Email/Password sign-in functionality is not yet implemented.",
    });
  };

  const handleGoogleSignIn = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const db = getFirestore();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalUserInfo = getAdditionalUserInfo(result);
      
      // Prepare user data, conditionally adding fields for new users
      const userDataToSet: any = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastLoginAt: new Date().toISOString(),
      };

      if (additionalUserInfo?.isNewUser) {
        userDataToSet.isCulturalUser = false;
        userDataToSet.culturalInterest = "";
        userDataToSet.createdAt = new Date().toISOString();
      }
      
      // Store or update user info in Firestore
      await setDoc(doc(db, "users", user.uid), userDataToSet, { merge: true });

      toast({
        title: "Signed In Successfully!",
        description: `Welcome back, ${user.displayName || 'User'}!`,
      });
      router.push('/discover');
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let errorMessage = "An unexpected error occurred during Google Sign-In.";
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with this email using a different sign-in method. Try the original method.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed. Please try again.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      else {
        errorMessage = error.message || errorMessage;
      }
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/50 p-6 text-center space-y-2">
          <div className="inline-block">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Welcome Back!</CardTitle>
          <CardDescription className="text-muted-foreground">Sign in to continue your cultural journey.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" required className="pl-10 py-3"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
               <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" required className="pl-10 py-3"/>
              </div>
            </div>
            <div className="flex items-center justify-between">
              {/* <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" />
                <Label htmlFor="remember-me" className="text-sm">Remember me</Label>
              </div> */}
              <Link href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3 flex items-center gap-2">
              <LogIn className="h-5 w-5" /> Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full text-base py-3 flex items-center gap-3 border-border hover:bg-accent/10" onClick={handleGoogleSignIn}>
            <GoogleIcon />
            Sign in with Google
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
