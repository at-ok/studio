
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ListChecks, Route, MessageSquare, Star, Award, Edit3, Gift, Settings, Loader2, Trash2, Compass, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { auth, db } from "@/lib/firebase"; // Import auth and db
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, type Timestamp } from "firebase/firestore";
import { getRoutesByCreator, deleteRoute, type RouteData } from '@/lib/firestoreService'; // Import Firestore service functions
import { useRouter } from 'next/navigation';

// Interface matching Firestore data structure, potentially with client-side adjustments
interface MySharedRouteClient extends Omit<RouteData, 'createdAt' | 'updatedAt' | 'creatorId' | 'creatorName' | 'creatorAvatarUrl' | 'rating'> {
  id: string; // ID is mandatory on client
  status?: "Published" | "Draft" | "Shared (Local)"; // Status might be derived or added later
  views?: number; // Example additional field
  rating?: number | null; // Ensure rating is nullable number
  createdAt?: string; // Timestamps as strings
  updatedAt?: string;
  creatorName?: string; // Add optional creator fields if needed
  creatorAvatarUrl?: string;
  creatorId?: string; // Keep creatorId
}


// Mock data - keep for now as examples or fallbacks if needed
const mockTraveledRoutes = [
  { id: "tr1", title: "Ancient Temple Trail", completedDate: "2024-05-10", myRating: 5, imageUrl: "https://picsum.photos/seed/temple_traveled/300/200", imageHint: "temple detail" },
  { id: "tr2", title: "Urban Art Walk", completedDate: "2024-04-22", myRating: 4, imageUrl: "https://picsum.photos/seed/art_traveled/300/200", imageHint: "graffiti wall" },
];

const mockRewards = [
  { id: "rw1", title: "10% Off at 'Clay Stories' Pottery", description: "Redeem for a discount on your next pottery purchase.", culturalProvider: "Clay Stories Studio", expiry: "2024-12-31", isCulturalReward: true, imageUrl: "https://picsum.photos/seed/pottery_reward/300/200", imageHint: "pottery items" },
];

// Helper to determine if user is 'new' based on creation/sign-in time difference
const isNewUserAccount = (user: any): boolean => {
    if (!user?.metadata?.creationTime || !user?.metadata?.lastSignInTime) return false;
    const creationTime = new Date(user.metadata.creationTime).getTime();
    const lastSignInTime = new Date(user.metadata.lastSignInTime).getTime();
    // Consider "new" if account created within the last 5 minutes of the first sign-in
    return Math.abs(creationTime - lastSignInTime) < 5 * 60 * 1000;
};

export default function MyPage() {
  const [user, authLoading, authError] = useAuthState(auth);
  const [userData, setUserData] = useState<any | null>(null); // Store Firestore user data
  const [userSharedRoutes, setUserSharedRoutes] = useState<MySharedRouteClient[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [routeToDelete, setRouteToDelete] = useState<MySharedRouteClient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for deletion

  const { toast } = useToast();
  const router = useRouter();

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData({
              ...userDocSnap.data(),
              isNewUser: isNewUserAccount(user), // Add derived property
              avatarUrl: user.photoURL || userDocSnap.data()?.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`, // Prioritize Firebase Auth photoURL
              avatarHint: "user avatar",
              joinDate: `Joined ${user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'recently'}`,
            });
          } else {
             console.warn("User document not found in Firestore, using auth data only.");
              setUserData({ // Fallback using only auth data
                name: user.displayName || "User",
                email: user.email || "No email",
                avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
                avatarHint: "user avatar",
                joinDate: `Joined ${user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'recently'}`,
                isNewUser: isNewUserAccount(user),
              });
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
           toast({ variant: "destructive", title: "Error", description: "Could not load user profile details." });
           // Fallback using only auth data
            setUserData({
                name: user.displayName || "User",
                email: user.email || "No email",
                avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
                avatarHint: "user avatar",
                joinDate: `Joined ${user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'recently'}`,
                isNewUser: isNewUserAccount(user),
             });
        }
      } else if (!authLoading) {
         // If auth is done loading and there's no user, redirect
         router.push('/auth/signin');
      }
    };

    fetchUserData();
  }, [user, authLoading, router, toast]);


  // Fetch user's shared routes from Firestore
  useEffect(() => {
    const fetchRoutes = async () => {
      if (user) {
        setIsLoadingRoutes(true);
        try {
          const routes = await getRoutesByCreator(user.uid);
           // Map Firestore data (which might have Timestamps) to Client data (with string timestamps)
           const clientRoutes = routes.map(route => ({
               ...route,
               status: "Published" as const, // Assuming all DB routes are "Published" for now
               views: 0, // Placeholder
               rating: route.rating, // Keep rating as number | null
               // Convert timestamps if they are strings (already done in service) or Date objects
               createdAt: typeof route.createdAt === 'string' ? route.createdAt : (route.createdAt as Date)?.toISOString(), 
               updatedAt: typeof route.updatedAt === 'string' ? route.updatedAt : (route.updatedAt as Date)?.toISOString(),
           }));
          setUserSharedRoutes(clientRoutes);
        } catch (error: any) {
          console.error("Error fetching user routes:", error);
          toast({ variant: "destructive", title: "Loading Error", description: error.message || "Could not load your shared routes." });
          setUserSharedRoutes([]); // Set empty on error
        } finally {
          setIsLoadingRoutes(false);
        }
      } else {
          // Clear routes if user logs out
          setUserSharedRoutes([]);
          setIsLoadingRoutes(false); // Ensure loading stops if no user
      }
    };

    if (!authLoading) { // Fetch only after auth state is determined
        fetchRoutes();
    }

  }, [user, authLoading, toast]);


  const handleDeleteSharedRoute = async () => {
    if (!routeToDelete || !user) return;
    setIsDeleting(true);

    try {
      await deleteRoute(routeToDelete.id, user.uid); // Use Firestore service
      setUserSharedRoutes(prevRoutes => prevRoutes.filter(route => route.id !== routeToDelete.id));
      toast({
        title: "Route Deleted",
        description: `The route "${routeToDelete.title}" has been successfully deleted.`,
      });
    } catch (error: any) {
      console.error("Error deleting route from Firestore:", error);
      toast({
        variant: "destructive",
        title: "Deletion Error",
        description: error.message || "Could not delete the route. Please try again.",
      });
    } finally {
      setRouteToDelete(null);
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
      try {
          await auth.signOut();
          // No need to setUserData(null) here, effect hook handles it
          toast({ title: "Signed Out", description: "You have been successfully signed out." });
          router.push('/discover'); // Redirect after sign out
      } catch (error) {
          console.error("Sign Out Error:", error);
          toast({ variant: "destructive", title: "Sign Out Failed", description: "Could not sign out. Please try again." });
      }
  };


  const RouteItemContent = ({ route }: { route: MySharedRouteClient }) => (
    <>
      <Image src={route.imageUrl || 'https://picsum.photos/seed/default/100/66'} alt={route.title} width={100} height={66} className="rounded-md object-cover flex-shrink-0" data-ai-hint={route.imageHint || "route image"} />
      <div className="flex-grow min-w-0"> {/* Ensure text doesn't overflow */}
        <h3 className="font-semibold text-foreground truncate">{route.title}</h3>
        <p className={`text-xs font-medium ${route.status === 'Published' ? 'text-green-600' : route.status === 'Shared (Local)' ? 'text-blue-600' : 'text-amber-600'}`}>
            {route.status || "Published"} {/* Default to Published if status missing */}
        </p>
        <p className="text-xs text-muted-foreground">
          {route.views !== undefined ? `${route.views} views` : ""}
          {route.rating !== undefined && route.rating !== null ? ` • ${route.rating} ★` : (route.views !== undefined ? "" : "No rating")}
        </p>
         <p className="text-xs text-muted-foreground mt-1">
            Created: {route.createdAt ? new Date(route.createdAt).toLocaleDateString() : 'N/A'}
         </p>
      </div>
    </>
  );

  // Loading States
  if (authLoading || (user && !userData)) { // Show loading if auth check is running OR user exists but Firestore data hasn't loaded yet
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading your page...</p>
      </div>
    );
  }

   // Auth Error State
   if (authError) {
       return (
           <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center text-destructive">
               <Award className="h-12 w-12 mb-4"/>
               <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
               <p className="mb-4">{authError.message}</p>
               <Button onClick={() => router.push('/auth/signin')}>Go to Sign In</Button>
           </div>
       );
   }

  // Not Logged In State (Should be handled by redirect in effect, but as a fallback)
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
         <p className="ml-2 text-muted-foreground">Redirecting to sign in...</p>
         <Loader2 className="h-8 w-8 animate-spin text-primary ml-2" />
      </div>
    );
  }

  // --- Render actual page content when user and userData are loaded ---
  const isNewUser = userData?.isNewUser; // Use isNewUser from fetched userData
  const currentCommentsCount = 1; // Placeholder - replace with actual logic if comments are implemented


  return (
    <div className="space-y-8">
      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={!!routeToDelete} onOpenChange={(isOpen) => { if (!isOpen) setRouteToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this route?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the route titled "{routeToDelete?.title}" from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRouteToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSharedRoute}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Profile Card */}
      <Card className="overflow-hidden rounded-xl shadow-lg">
        <CardHeader className="bg-muted/30 p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-primary shadow-md">
             <AvatarImage src={userData?.avatarUrl} alt={userData?.name || 'User'} data-ai-hint={userData?.avatarHint || 'user avatar'} />
             <AvatarFallback className="text-3xl">{userData?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <CardTitle className="text-3xl font-bold text-foreground">{userData?.name || 'User Name'}</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">{userData?.email || 'user@example.com'}</CardDescription>
            <p className="text-sm text-muted-foreground mt-0.5">{userData?.joinDate || 'Joined recently'}</p>
            {userData?.isCulturalUser && (
              <p className="text-sm text-primary font-medium mt-1 flex items-center gap-1.5">
                <Award className="h-4 w-4" /> Cultural Contributor: {userData.culturalInterest || 'Not specified'}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 self-start md:self-center">
             {/* <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary/10">
                <Link href="/my-page/settings">
                    <Settings className="h-4 w-4 mr-2"/>Edit Profile
                </Link>
             </Button> */}
             <Button onClick={handleSignOut} variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4 mr-2"/>Sign Out
             </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Grid for Routes and Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Shared Routes Card */}
        <Card className="lg:col-span-2 rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Route className="h-6 w-6 text-primary" />My Shared Routes</CardTitle>
            <CardDescription>Manage routes you've created and shared.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingRoutes ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading your routes...</p>
              </div>
            ) : (
              <>
                {userSharedRoutes.length > 0 && userSharedRoutes.map(route => (
                  <div key={route.id} className="flex items-center justify-between gap-4 p-3 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                     <div className="flex items-center gap-4 flex-grow min-w-0"> {/* Allow content to shrink */}
                         <RouteItemContent route={route} />
                     </div>
                     <div className="flex items-center gap-2 flex-shrink-0"> {/* Prevent buttons from wrapping */}
                        <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                          {/* Link to the dynamic route page */}
                           <Link href={`/route/${route.id}`} aria-label={`View details for ${route.title}`}>
                              View Route
                           </Link>
                        </Button>
                        {/* Edit Button - Links to create page with edit query param */}
                        <Button variant="ghost" size="icon" asChild>
                           <Link href={`/create?edit=${route.id}`} aria-label={`Edit details for ${route.title}`}>
                              <Edit3 className="h-5 w-5 text-muted-foreground hover:text-primary" />
                           </Link>
                        </Button>
                        {/* Delete Button Trigger */}
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setRouteToDelete(route)} aria-label={`Delete ${route.title}`}>
                              <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                     </div>
                  </div>
                ))}

                {/* Welcome message for new users */}
                {isNewUser && userSharedRoutes.length === 0 && (
                  <div className="text-center py-6 px-4 border-2 border-dashed border-border rounded-lg bg-muted/20">
                    <Compass className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">Share Your First Route!</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Welcome to Culture Compass! Ready to share your cultural discoveries or favorite local paths? Create your first route and inspire others.
                    </p>
                    <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Link href="/create">
                        <Route className="h-4 w-4 mr-2" /> Create New Route
                      </Link>
                    </Button>
                  </div>
                )}

                 {/* Message for existing users with no routes */}
                {!isNewUser && userSharedRoutes.length === 0 && !isLoadingRoutes && (
                    <div className="text-center py-6 px-4 border-2 border-dashed border-border rounded-lg bg-muted/20">
                        <Compass className="h-12 w-12 text-primary mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-foreground mb-1">No Routes Shared Yet</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                        Share your cultural discoveries or favorite local paths to inspire others!
                        </p>
                        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Link href="/create">
                            <Route className="h-4 w-4 mr-2" /> Create New Route
                        </Link>
                        </Button>
                    </div>
                )}

                {/* Button to create more routes if some already exist */}
                {userSharedRoutes.length > 0 && (
                    <Button variant="outline" asChild className="mt-4 border-primary text-primary hover:bg-primary/10 w-full sm:w-auto">
                        <Link href="/create"><Route className="h-4 w-4 mr-2"/>Share or Create More Routes</Link>
                    </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Cultural Rewards Card (Placeholder/Mock) */}
        {userData?.isCulturalUser && mockRewards.length > 0 && (
          <Card className="rounded-xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><Gift className="h-6 w-6 text-accent" />My Cultural Rewards</CardTitle>
              <CardDescription>Coupons and services you can offer for your cultural routes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockRewards.map(reward => (
                <div key={reward.id} className="p-3 border border-border rounded-lg bg-background hover:shadow-sm transition-shadow">
                  <Image src={reward.imageUrl} alt={reward.title} width={300} height={150} className="rounded-md object-cover w-full h-24 mb-2" data-ai-hint={reward.imageHint} />
                  <h3 className="font-semibold text-foreground text-sm">{reward.title}</h3>
                  <p className="text-xs text-muted-foreground">Provider: {reward.culturalProvider}</p>
                  <p className="text-xs text-muted-foreground">Expires: {reward.expiry}</p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-accent hover:text-accent/80 mt-1">Manage Reward</Button>
                </div>
              ))}
              <Button variant="outline" className="mt-2 w-full border-accent text-accent hover:bg-accent/10">
                <Gift className="h-4 w-4 mr-2"/>Add New Reward
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* My Activity Card */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><ListChecks className="h-6 w-6 text-primary" />My Activity</CardTitle>
          <CardDescription>A log of routes you've traveled and your contributions.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Traveled Routes Section */}
          <h3 className="text-lg font-semibold text-foreground mb-3">Traveled Routes</h3>
          {(isNewUser || mockTraveledRoutes.length === 0) ? (
              <div className="text-center py-6 px-4 border-2 border-dashed border-border rounded-lg bg-muted/20">
                <ListChecks className="h-12 w-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">Start Your Adventures!</h3>
                <p className="text-muted-foreground text-sm mb-4">Explore captivating routes, mark them as 'traveled', and build your personal journey log.</p>
                <Button asChild variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/discover">
                        <Compass className="h-4 w-4 mr-2" />
                        Discover Routes
                    </Link>
                </Button>
              </div>
            ) : (
                <div className="space-y-4 mb-6">
                {mockTraveledRoutes.map(route => (
                 <div key={route.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <Image src={route.imageUrl} alt={route.title} width={120} height={80} className="rounded-md object-cover flex-shrink-0" data-ai-hint={route.imageHint} />
                    <div className="flex-grow">
                    <Link href={`/route/${route.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">{route.title}</Link>
                    <p className="text-xs text-muted-foreground">Completed: {route.completedDate}</p>
                    <div className="flex items-center mt-1">
                        <span className="text-xs text-muted-foreground mr-1">Your rating:</span>
                        {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < (route.myRating || 0) ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`} />
                        ))}
                    </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="mt-2 sm:mt-0 flex-shrink-0">
                    <Link href={`/route/${route.id}#feedback`}>
                        <MessageSquare className="h-4 w-4 mr-2" /> View/Edit Feedback
                    </Link>
                    </Button>
                 </div>
                ))}
            </div>
          )}

          {/* Comments & Ratings Section */}
          <h3 className="text-lg font-semibold text-foreground mb-3 mt-6 border-t pt-6">My Comments & Ratings</h3>
          { (isNewUser || (!isNewUser && currentCommentsCount === 0 )) ? (
            <div className="text-center py-6 px-4 border-2 border-dashed border-border rounded-lg bg-muted/20 mt-4">
                <MessageSquare className="h-12 w-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">Share Your Thoughts!</h3>
                <p className="text-muted-foreground text-sm mb-4">
                    After you travel a route, come back to its page to leave comments and ratings. Your feedback helps the community!
                </p>
                <Button asChild variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/discover">
                        <Compass className="h-4 w-4 mr-2" />
                        Find a Route to Review
                    </Link>
                </Button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                This section will show your specific comments and ratings across various routes. (Functionality not yet implemented)
              </p>
              {/* Example of a comment - replace with actual data mapping when available */}
              <div className="mt-4 p-3 border border-border rounded-lg bg-background">
                <p className="text-sm text-foreground">On <Link href="/route/mock-1" className="font-medium text-primary hover:underline">Ancient Temple Trail</Link>:</p>
                <div className="flex items-center my-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < 5 ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`} />
                    ))}
                </div>
                <p className="text-sm italic text-muted-foreground">"Absolutely breathtaking views and so much history. A must-do!" - 2 weeks ago</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
