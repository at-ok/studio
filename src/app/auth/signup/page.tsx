
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Mail, KeyRound, ShieldQuestion } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
// Ensure you have firebase initialized in a file e.g. src/lib/firebase.ts and import app from it
// For this example, we'll assume firebaseApp is available or getAuth() initializes if not already.
// import { app as firebaseApp } from '@/lib/firebase'; // Example: if you have a firebase.ts

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
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const auth = getAuth(); // Assumes firebaseApp is initialized
    const db = getFirestore(); // Assumes firebaseApp is initialized

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });

      // Store additional user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: fullName,
        email: user.email,
        isCulturalUser: isCulturalUser,
        culturalInterest: isCulturalUser ? culturalInterest : "",
        createdAt: new Date().toISOString(),
      });
      
      toast({
        title: "Account Created!",
        description: "Welcome to Culture Compass!",
      });
      router.push('/discover'); // Or a profile completion page if needed for cultural info specifically
    } catch (error: any) {
      console.error("Sign Up Error:", error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const handleGoogleSignUp = async () => {
    const auth = getAuth(); // Assumes firebaseApp is initialized
    const provider = new GoogleAuthProvider();
    const db = getFirestore(); // Assumes firebaseApp is initialized

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user data already exists in Firestore (e.g. for existing users)
      // For a new user via Google, you might want to collect cultural info here or redirect
      // For simplicity, we'll just create/update their user doc.
      // A more robust solution would check if the document exists before setting.
      // `getAdditionalUserInfo(result).isNewUser` can be used.
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        // Cultural info is not collected in this flow, user can add it in profile settings
        isCulturalUser: false, // Default or fetch existing if not a new user
        culturalInterest: "", // Default
        createdAt: new Date().toISOString(), // Or check if user is new before setting
      }, { merge: true }); // Merge true to avoid overwriting existing data if user signs in

      toast({
        title: "Signed in with Google!",
        description: `Welcome, ${user.displayName || 'User'}!`,
      });
      router.push('/discover');
    } catch (error: any)      {
      console.error("Google Sign-Up Error:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with the same email address but different sign-in credentials. Try signing in with the original method.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup closed by user. Please try again.";
      } else {
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

