
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, KeyRound, AlertTriangle } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, FirestoreError }  from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { auth as firebaseAuth, db as firestoreDb } from "@/lib/firebase"; // Import auth and db from firebase config

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
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignInError(null);
    setIsLoading(true);
    setIsGoogleLoading(false); // Ensure only one loader is active
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setSignInError("Please enter both email and password.");
      setIsLoading(false); // Reset loading state
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;

      // Attempt Firestore update but don't block sign-in if it fails
      try {
        await setDoc(doc(firestoreDb, "users", user.uid), {
          lastLoginAt: new Date().toISOString(),
        }, { merge: true });
      } catch (firestoreError: any) {
          console.warn("Firestore update failed after email sign-in:", firestoreError);
          // Non-critical error, proceed with login but maybe log it or show a non-blocking toast
          if (firestoreError.code === 'permission-denied') {
              toast({
                  variant: "default",
                  title: "Signed In (with warning)",
                  description: "Could not update your last login time. Check Firestore rules if this persists.",
              });
          } else if (firestoreError.message?.includes('offline') || firestoreError.code === 'unavailable') {
              toast({
                  variant: "default",
                  title: "Signed In (network issue)",
                  description: "Could not update last login time due to network issues.",
              });
          }
      }

      toast({
        title: "Signed In Successfully!",
        description: `Welcome back, ${user.displayName || 'User'}!`,
      });
      router.push('/my-page'); // Redirect after successful sign-in

      // Important: Don't reset isLoading here if redirecting, let the page transition handle it.
      // If we weren't redirecting, we would set isLoading to false here.

    } catch (error: any) {
      console.error("Email/Password Sign-In Error:", error);
      let errorMessage = "An unexpected error occurred during sign-in.";
      // Check for specific Firebase Auth error codes
      switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/invalid-credential': // Covers wrong password, invalid email format sometimes
          case 'auth/wrong-password': // More specific, but invalid-credential is common
            errorMessage = "Invalid email or password. Please try again.";
            break;
          case 'auth/invalid-email':
            errorMessage = "The email address format is not valid.";
            break;
          case 'auth/user-disabled':
            errorMessage = "This account has been disabled.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
            break;
          case 'auth/network-request-failed':
             errorMessage = "Network error during sign-in. Please check your connection.";
             break;
          default:
            // Use the message from the error object if available, otherwise the generic message
            errorMessage = error.message || errorMessage;
            // Handle potential Firestore offline errors that might bubble up if not caught inside
            if (error instanceof FirestoreError && (error.message?.includes('offline') || error.code === 'unavailable')) {
              errorMessage = "Sign-in attempt failed due to network issues. Please check your connection.";
            }
        }
      setSignInError(errorMessage);
       toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: errorMessage,
      });
      setIsLoading(false); // Ensure loading state is reset on error
    }
    // Removed the finally block as loading state is handled in success (redirect) and error cases
  };


  const handleGoogleSignIn = async () => {
    setSignInError(null);
    setIsGoogleLoading(true);
    setIsLoading(false); // Ensure only one loader is active
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(firebaseAuth, provider);
      const user = result.user;
      const additionalUserInfo = getAdditionalUserInfo(result);

      const userRef = doc(firestoreDb, "users", user.uid);
      let userSnap;
      let userDataToSet: any = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          lastLoginAt: new Date().toISOString(),
        };

      try {
          userSnap = await getDoc(userRef);

          // Set default fields only if it's a new user or the document doesn't exist
          if (additionalUserInfo?.isNewUser || !userSnap.exists()) {
            userDataToSet.isCulturalUser = false;
            userDataToSet.culturalInterest = "";
            userDataToSet.createdAt = new Date().toISOString();
          } else {
            // Preserve existing fields if user doc exists
             userDataToSet = {
                ...userSnap.data(), // Keep existing data
                ...userDataToSet, // Overwrite with latest login info, displayName, etc.
            }
          }

        // Create or update user document in Firestore
        await setDoc(userRef, userDataToSet, { merge: true });

      } catch (firestoreError: any) {
        console.warn("Firestore operation failed after Google sign-in:", firestoreError);
         // Handle specific Firestore errors (offline, permissions) non-destructively
        if (firestoreError.code === 'permission-denied') {
             toast({
                variant: "default",
                title: "Signed In (with warning)",
                description: "Could not read/update your profile data. Check Firestore rules.",
            });
        } else if (firestoreError.message?.includes('offline') || firestoreError.code === 'unavailable') {
             toast({
                variant: "default",
                title: "Signed In (network issue)",
                description: "Could not update profile data due to network issues.",
            });
            // Even with Firestore error, proceed to redirect as auth succeeded
            // Redirect will happen outside this catch block anyway
        } else {
            // Log other Firestore errors but don't block login
            console.error("Non-critical Firestore error after Google sign-in:", firestoreError);
        }
      }


      toast({
        title: "Signed In Successfully!",
        description: `Welcome back, ${user.displayName || 'User'}!`,
      });
      router.push('/my-page'); // Redirect after successful Google sign-in and Firestore update/check

    } catch (error: any) {
      console.error("Google Sign-In Process Error:", error);
      let errorMessage = "An unexpected error occurred during Google Sign-In.";
       // Map common error codes to user-friendly messages
      if (error instanceof FirestoreError && (error.message?.includes('offline') || error.code === 'unavailable')) {
         errorMessage = "Sign-in attempt failed due to network issues. Please check your connection.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with this email using a different sign-in method. Try the original method.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed. Please try again.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.code === 'auth/cancelled-popup-request') {
         errorMessage = "Sign-in cancelled. Please try again.";
      } else if (error.code === 'auth/api-key-not-valid' || error.message?.includes('api-key-not-valid')) {
          errorMessage = "Invalid API Key configuration. Please contact support."; // More user-friendly
      } else {
        errorMessage = error.message || errorMessage;
      }
      setSignInError(errorMessage);
      toast({ // Show error in toast
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: errorMessage,
      });
      setIsGoogleLoading(false); // Reset loading state on error
    }
    // No finally block needed here if redirecting on success and setting state on error
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
          {signInError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sign In Error</AlertTitle>
              <AlertDescription>{signInError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="you@example.com" required className="pl-10 py-3" disabled={isLoading || isGoogleLoading}/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
               <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="password" name="password" type="password" placeholder="••••••••" required className="pl-10 py-3" disabled={isLoading || isGoogleLoading}/>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3 flex items-center gap-2" disabled={isLoading || isGoogleLoading}>
              {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>}
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

          <Button variant="outline" className="w-full text-base py-3 flex items-center gap-3 border-border hover:bg-accent/10" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
           {isGoogleLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>}
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
