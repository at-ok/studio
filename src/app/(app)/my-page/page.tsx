
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ListChecks, Route, MessageSquare, Star, Award, Edit3, Gift, Settings, Loader2, Trash2, Eye, Compass } from "lucide-react";
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
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase"; 
import { useRouter } from 'next/navigation';


// Consistent Route structure
interface MySharedRoute {
  id: string;
  title: string;
  description?: string; 
  imageUrl: string;
  imageHint: string;
  status?: "Published" | "Draft" | "Shared (Local)";
  views?: number;
  rating?: number | null;
  googleMapsLink?: string; 
}

const SHARED_ROUTES_LS_KEY = 'userSharedRoutes';

const mockTraveledRoutes = [
  { id: "tr1", title: "Ancient Temple Trail", completedDate: "2024-05-10", myRating: 5, imageUrl: "https://picsum.photos/seed/temple_traveled/300/200", imageHint: "temple detail" },
  { id: "tr2", title: "Urban Art Walk", completedDate: "2024-04-22", myRating: 4, imageUrl: "https://picsum.photos/seed/art_traveled/300/200", imageHint: "graffiti wall" },
];

const mockRewards = [
  { id: "rw1", title: "10% Off at 'Clay Stories' Pottery", description: "Redeem for a discount on your next pottery purchase.", culturalProvider: "Clay Stories Studio", expiry: "2024-12-31", isCulturalReward: true, imageUrl: "https://picsum.photos/seed/pottery_reward/300/200", imageHint: "pottery items" },
];


export default function MyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null); 
  const [userSharedRoutes, setUserSharedRoutes] = useState<MySharedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [routeToDelete, setRouteToDelete] = useState<MySharedRoute | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setFirebaseUser({
            name: currentUser.displayName || "User",
            email: currentUser.email || "No email",
            avatarUrl: currentUser.photoURL || `https://picsum.photos/seed/${currentUser.uid}/200/200`,
            avatarHint: "user avatar",
            joinDate: `Joined ${currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'recently'}`,
        });
        // fetchSharedRoutes will be called by the useEffect below that depends on `user`
      } else {
        setUser(null);
        setFirebaseUser(null);
        router.push('/auth/signin'); 
      }
    });
    return () => unsubscribe();
  }, [router]);


  const fetchSharedRoutes = () => {
    setIsLoading(true); 
    if (typeof window !== 'undefined') {
      const storedRoutesRaw = localStorage.getItem(SHARED_ROUTES_LS_KEY);
      const storedRoutes: Partial<MySharedRoute>[] = storedRoutesRaw ? JSON.parse(storedRoutesRaw) : [];
      
      const mappedRoutes = storedRoutes.map(route => ({
        id: route.id || `fallback_id_${Math.random()}`,
        title: route.title || "Untitled Route",
        imageUrl: route.imageUrl || "https://picsum.photos/seed/default/100/66",
        imageHint: route.imageHint || "route image",
        googleMapsLink: route.googleMapsLink,
        status: "Shared (Local)" as "Shared (Local)", 
        views: route.views || 0,
        rating: route.rating === undefined ? null : route.rating,
        description: route.description || "",
      }));

      mappedRoutes.sort((a, b) => {
        const timestampA = parseInt(a.id.split('_').pop() || '0', 10);
        const timestampB = parseInt(b.id.split('_').pop() || '0', 10);
        return timestampB - timestampA;
      });
      
      setUserSharedRoutes(mappedRoutes);
    }
    setIsLoading(false); 
  };

  useEffect(() => {
    if (user && firebaseUser) { // Ensure firebaseUser is also set before fetching
        fetchSharedRoutes();
    } else if (!user) { 
        setUserSharedRoutes([]);
        setIsLoading(false); 
    }
  }, [user, firebaseUser]);


  const handleDeleteSharedRoute = () => {
    if (!routeToDelete || typeof window === 'undefined') return;

    try {
      const existingRoutesRaw = localStorage.getItem(SHARED_ROUTES_LS_KEY);
      let existingRoutes: MySharedRoute[] = existingRoutesRaw ? JSON.parse(existingRoutesRaw) : [];
      existingRoutes = existingRoutes.filter(route => route.id !== routeToDelete.id);
      localStorage.setItem(SHARED_ROUTES_LS_KEY, JSON.stringify(existingRoutes));
      
      setUserSharedRoutes(prevRoutes => prevRoutes.filter(route => route.id !== routeToDelete.id));
      
      toast({
        title: "Route Deleted",
        description: `The route "${routeToDelete.title}" has been successfully deleted.`,
      });
    } catch (error) {
      console.error("Error deleting route from localStorage:", error);
      toast({
        variant: "destructive",
        title: "Deletion Error",
        description: "Could not delete the route. Please try again.",
      });
    } finally {
      setRouteToDelete(null); 
    }
  };


  const RouteItemContent = ({ route }: { route: MySharedRoute }) => (
    <>
      <Image src={route.imageUrl} alt={route.title} width={100} height={66} className="rounded-md object-cover" data-ai-hint={route.imageHint || "route image"} />
      <div className="flex-grow">
        <h3 className="font-semibold text-foreground">{route.title}</h3>
        <p className={`text-xs ${route.status === 'Published' ? 'text-green-600' : route.status === 'Shared (Local)' ? 'text-blue-600' : 'text-amber-600'}`}>{route.status || "Status N/A"}</p>
        <p className="text-xs text-muted-foreground">
          {route.views !== undefined ? `${route.views} views` : ""} 
          {route.rating !== undefined && route.rating !== null ? ` • ${route.rating} ★` : (route.views !== undefined ? "" : "No stats yet")}
        </p>
      </div>
    </>
  );

  if (isLoading || !user || !firebaseUser) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading your page...</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <Card className="overflow-hidden rounded-xl shadow-lg">
        <CardHeader className="bg-muted/30 p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-primary shadow-md">
            <AvatarImage src={firebaseUser.avatarUrl} alt={firebaseUser.name} data-ai-hint={firebaseUser.avatarHint} />
            <AvatarFallback className="text-3xl">{firebaseUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <CardTitle className="text-3xl font-bold text-foreground">{firebaseUser.name}</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">{firebaseUser.email}</CardDescription>
            <p className="text-sm text-muted-foreground mt-0.5">{firebaseUser.joinDate}</p>
            {firebaseUser.isCulturalUser && (
              <p className="text-sm text-primary font-medium mt-1 flex items-center gap-1.5">
                <Award className="h-4 w-4" /> Cultural Contributor: {firebaseUser.culturalInterest}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary/10">
            <Link href="/my-page/settings"> 
                <Settings className="h-4 w-4 mr-2"/>Edit Profile
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Route className="h-6 w-6 text-primary" />My Shared Routes</CardTitle>
            <CardDescription>Manage routes you've created and shared.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userSharedRoutes.length > 0 ? userSharedRoutes.map(route => (
              <div key={route.id} className="flex items-center justify-between gap-4 p-3 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-4 flex-grow">
                   <RouteItemContent route={route} />
                </div>
                <div className="flex items-center gap-1">
                  {route.googleMapsLink ? (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={route.googleMapsLink} target="_blank" rel="noopener noreferrer" aria-label={`View map for ${route.title}`}>
                        <Eye className="h-5 w-5 text-muted-foreground hover:text-primary" />
                      </a>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/route/${route.id}`} aria-label={`View details for ${route.title}`}>
                        <Eye className="h-5 w-5 text-muted-foreground hover:text-primary" />
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/create?edit=${route.id}`} aria-label={`Edit details for ${route.title}`}> 
                        <Edit3 className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    </Link>
                  </Button>
                  <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="icon" onClick={() => setRouteToDelete(route)} aria-label={`Delete ${route.title}`}>
                        <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                </div>
              </div>
            )) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-4">Ready to share your cultural discoveries or favorite local paths? Create your first route and inspire others!</p>
              </div>
            )}
             <Button variant="outline" asChild className="mt-4 border-primary text-primary hover:bg-primary/10 w-full sm:w-auto">
                <Link href="/create"><Route className="h-4 w-4 mr-2"/>Share or Create a New Route</Link>
             </Button>
          </CardContent>
        </Card>

        {firebaseUser.isCulturalUser && mockRewards.length > 0 && (
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

      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><ListChecks className="h-6 w-6 text-primary" />My Activity</CardTitle>
          <CardDescription>A log of routes you've traveled and your contributions.</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold text-foreground mb-3">Traveled Routes</h3>
          <div className="space-y-4 mb-6">
            {mockTraveledRoutes.length > 0 ? mockTraveledRoutes.map(route => (
               <div key={route.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                <Image src={route.imageUrl} alt={route.title} width={120} height={80} className="rounded-md object-cover" data-ai-hint={route.imageHint} />
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
                <Button variant="outline" size="sm" asChild className="mt-2 sm:mt-0">
                  <Link href={`/route/${route.id}#feedback`}>
                    <MessageSquare className="h-4 w-4 mr-2" /> View/Edit Feedback
                  </Link>
                </Button>
              </div>
            )) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-4">No adventures logged yet! Explore captivating routes, mark them as 'traveled', and build your personal journey log.</p>
                <Button asChild variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/discover">
                        <Compass className="h-4 w-4 mr-2" />
                        Discover Routes
                    </Link>
                </Button>
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-3 mt-6 border-t pt-6">My Comments & Ratings</h3>
          <p className="text-muted-foreground text-sm">
            This section will show your specific comments and ratings across various routes.
          </p>
          <div className="mt-4 p-3 border border-border rounded-lg bg-background">
            <p className="text-sm text-foreground">On <Link href="/route/mock-1" className="font-medium text-primary hover:underline">Ancient Temple Trail</Link>:</p>
            <div className="flex items-center my-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < 5 ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`} />
                ))}
            </div>
            <p className="text-sm italic text-muted-foreground">"Absolutely breathtaking views and so much history. A must-do!" - 2 weeks ago</p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!routeToDelete} onOpenChange={(isOpen) => { if (!isOpen) setRouteToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this route?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the route titled "{routeToDelete?.title}" from your shared routes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRouteToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSharedRoute}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


    
