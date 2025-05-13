
"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { suggestComments, type SuggestCommentsInput, type SuggestCommentsOutput } from '@/ai/flows/suggest-comments';
import { MapPin, Star, Clock, User, Camera, MessageSquare, Send, ThumbsUp, Lightbulb, Loader2, AlertTriangle, CheckCircle, ImagePlus, Info, ExternalLink, Edit3 } from 'lucide-react'; // Added Edit3
import { useToast } from '@/hooks/use-toast';
import { getRouteById, type RouteData } from '@/lib/firestoreService'; // Import Firestore service
import type { Timestamp, FieldValue } from 'firebase/firestore'; // Import FieldValue
import { auth } from "@/lib/firebase"; // Import auth if needed for user-specific actions
import { useAuthState } from 'react-firebase-hooks/auth';

// Client-side representation, extending RouteData potentially
interface RouteSpotPhoto {
  id: string;
  url: string;
  user: string; // User name or ID
  hint?: string;
}
interface RouteSpot {
  id: string;
  name: string;
  description: string;
  photos?: RouteSpotPhoto[]; // Optional photos array
}
interface Comment {
  id: string;
  user: string; // User name
  userId?: string; // User ID
  avatarUrl: string;
  avatarHint?: string;
  text: string;
  rating: number;
  date: string; // Store as ISO string or display-friendly string
  // Consider adding Timestamp here if storing/fetching from Firestore subcollection
}

// Combine Firestore data with potential client-side additions
interface RouteDetailClient extends Omit<RouteData, 'createdAt' | 'updatedAt' | 'creatorId'> {
  id: string; // Ensure ID is always present
  creatorId?: string; // Keep creator ID
  creator: { // Structure for display
    name: string;
    avatarUrl?: string;
    avatarHint?: string;
  };
  spots?: RouteSpot[]; // Define spots structure if used
  comments: Comment[]; // Comments array
  communityFeedbackSummary?: string; // Example field
  createdAt?: string; // Use string for easier state management
  updatedAt?: string;
  reviewsCount: number; // Ensure reviewsCount is always present
}

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;


export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const routeId = params.id as string; // Get route ID from URL

  const [route, setRoute] = useState<RouteDetailClient | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [errorLoadingRoute, setErrorLoadingRoute] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState<number>(0);
  const [suggestedComments, setSuggestedComments] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState<string | null>(null); // Spot ID
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, File[]>>({});

  const [user, authLoading] = useAuthState(auth); // Get current user


  // Fetch route details from Firestore
  useEffect(() => {
    if (!routeId) {
        setErrorLoadingRoute("No route ID provided.");
        setIsLoadingRoute(false);
        return;
    }

    const fetchRoute = async () => {
      setIsLoadingRoute(true);
      setErrorLoadingRoute(null);
      try {
        const routeData = await getRouteById(routeId);

        if (routeData) {
           // Adapt Firestore data to client structure
            const routeDetail: RouteDetailClient = {
                ...routeData,
                id: routeData.id, // Already included in service response
                creatorId: routeData.creatorId,
                creator: {
                    name: routeData.creatorName || 'Unknown Creator',
                    avatarUrl: routeData.creatorAvatarUrl,
                    // avatarHint: // Add hint if available
                },
                comments: [], // TODO: Fetch comments separately if stored in subcollection
                spots: [], // TODO: Fetch spots separately if stored in subcollection
                 // Ensure reviewsCount is a number, default to 0
                reviewsCount: typeof routeData.reviewsCount === 'number' ? routeData.reviewsCount : 0,
                 // Convert Timestamps if needed (already handled in service)
                createdAt: routeData.createdAt as string | undefined,
                updatedAt: routeData.updatedAt as string | undefined,
            };
            setRoute(routeDetail);
            // TODO: Implement fetching actual comments and spots here
            // For now, using mock comments if the fetched route is mock-1
             if (routeData.id === "mock-1") {
                 setRoute(prev => prev ? ({ ...prev, comments: [
                    { id: "c1", user: "TravelerJane", userId: "mock-user-1", avatarUrl: "https://picsum.photos/seed/jane/50/50", avatarHint: "jane avatar", text: "Absolutely stunning! The views from the top are worth the climb. Highly recommend.", rating: 5, date: "2024-07-20T10:00:00Z" },
                    { id: "c2", user: "HistoryBuff", userId: "mock-user-2", avatarUrl: "https://picsum.photos/seed/buff/50/50", avatarHint: "buff avatar", text: "A fantastic route for anyone interested in local history. The Sunken Pagoda was my favorite.", rating: 4, date: "2024-07-18T15:30:00Z" },
                 ]}) : null);
                 setRoute(prev => prev ? ({...prev, spots: [
                     { id: "s1", name: "Sunken Pagoda", description: "A partially submerged ancient structure with intricate carvings.", photos: [{id: "p1", url:"https://picsum.photos/seed/pagoda_spot/400/300", user:"UserA", hint:"pagoda photo"}, {id: "p2", url:"https://picsum.photos/seed/pagoda_spot2/400/300", user:"UserB", hint:"pagoda detail"}] },
                     { id: "s2", name: "Moon Reflection Pond", description: "Known for its perfectly still waters reflecting the sky.", photos: [{id: "p3", url: "https://picsum.photos/seed/pond_spot/400/300", user:"UserC", hint:"pond reflection"}] },
                     { id: "s3", name: "Guardian Tree", description: "A massive, ancient tree believed to protect the trail.", photos: [] },
                     { id: "s4", name: "Summit Shrine", description: "The final destination offering stunning views.", photos: [{id: "p4", url:"https://picsum.photos/seed/summit_shrine/400/300", user:"UserD", hint:"summit view"}] },
                 ] }) : null);
                 setRoute(prev => prev ? ({...prev, communityFeedbackSummary: "Most visitors love the peaceful atmosphere and historical significance. Some mention the trail can be challenging in parts but ultimately rewarding. Popular photo spots include the Sunken Pagoda and the view from Summit Shrine."}) : null);
             }
        } else {
          setErrorLoadingRoute("Route not found.");
          setRoute(null);
        }
      } catch (error: any) {
        console.error("Error fetching route details:", error);
        setErrorLoadingRoute(error.message || "Failed to load route details.");
        setRoute(null);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [routeId]); // Depend on routeId


  const handleGetSuggestions = async () => {
    if (!route) return;
    setIsLoadingSuggestions(true);
    try {
      const input: SuggestCommentsInput = {
        routeDescription: route.title + ". " + route.description,
        communityFeedback: route.communityFeedbackSummary || "No aggregated feedback available yet.",
      };
      const result: SuggestCommentsOutput = await suggestComments(input);
      setSuggestedComments(result.suggestedComments);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({
        variant: "destructive",
        title: "Failed to get suggestions",
        description: "Could not load AI comment suggestions at this time.",
      });
      setSuggestedComments([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
         toast({ variant: "destructive", title: "Not Signed In", description: "Please sign in to leave a review." });
         return;
    }
    if (!newComment.trim() || newRating === 0) {
      toast({
        variant: "destructive",
        title: "Incomplete submission",
        description: "Please write a comment and select a rating.",
      });
      return;
    }

    setIsSubmittingReview(true);

    const newCommentEntry: Comment = {
      id: `c_local_${Date.now()}`, // Temporary local ID
      userId: user.uid,
      user: user.displayName || "Anonymous User",
      avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/50/50`,
      avatarHint: "current user avatar",
      text: newComment,
      rating: newRating,
      date: new Date().toISOString(), // Use ISO string for consistency
    };

    // TODO: Implement Firestore logic to save the comment (e.g., to a subcollection)
    // For now, just add locally for UI update
    try {
        // --- Replace with actual Firestore comment saving ---
        // Example (requires setup): await addCommentToRoute(routeId, newCommentEntry);
        console.log("Submitting comment (local simulation):", newCommentEntry);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        // --- End of simulation ---

        setRoute(prev => prev ? ({ ...prev, comments: [newCommentEntry, ...prev.comments] }) : null);
        // Optionally update the overall route rating and reviewsCount here or via a backend function

        setNewComment('');
        setNewRating(0);
        setSuggestedComments([]);
        toast({
          title: "Feedback submitted!",
          description: "Thank you for your review.",
          action: <CheckCircle className="text-green-500" />,
        });
    } catch (error: any) {
        console.error("Error submitting review:", error);
        toast({ variant: "destructive", title: "Submission Failed", description: "Could not save your review. Please try again." });
    } finally {
       setIsSubmittingReview(false);
    }

  };

  const handlePhotoUpload = (spotId: string, files: FileList | null) => {
     if (!user) {
         toast({ variant: "destructive", title: "Not Signed In", description: "Please sign in to upload photos." });
         return;
     }
    if (files && route && route.spots) {
        const spotName = route.spots.find(s => s.id === spotId)?.name || 'this spot';
        // TODO: Implement actual photo upload logic to Firebase Storage
        console.log(`Uploading ${files.length} photos for spot ${spotId}`);
        setUploadedPhotos(prev => ({...prev, [spotId]: Array.from(files)}));
        toast({ title: `${files.length} photo(s) selected for ${spotName}.`, description: "Upload functionality not yet implemented." });
    }
  };

  // --- Render States ---

  if (isLoadingRoute) {
    return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Loading route details...</p></div>;
  }

  if (errorLoadingRoute) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Route</h2>
        <p className="text-muted-foreground mb-6">{errorLoadingRoute}</p>
        <Button onClick={() => router.push('/discover')}>Back to Discover Routes</Button>
      </div>
    );
  }

  if (!route) { // Should be caught by error state, but good failsafe
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Route Not Found</h2>
        <p className="text-muted-foreground mb-6">The route you are looking for does not exist.</p>
        <Button onClick={() => router.push('/discover')}>Back to Discover Routes</Button>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="space-y-8">
      {/* Route Header */}
      <Card className="overflow-hidden rounded-xl shadow-lg">
        <div className="relative h-64 md:h-96 w-full">
          <Image
             src={route.imageUrl || 'https://picsum.photos/seed/default_route/1200/500'} // Fallback
             alt={route.title}
             layout="fill"
             objectFit="cover"
             priority // Prioritize loading header image
             data-ai-hint={route.imageHint || "route image"}
             unoptimized={route.imageUrl?.includes('picsum.photos')}
           />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-lg">{route.title}</h1>
            {route.isCulturalRoute && (
              <Badge variant="default" className="mt-2 bg-primary text-primary-foreground text-sm py-1 px-3 shadow-md">Cultural Route</Badge>
            )}
          </div>
           {/* Edit button for creator */}
           {user && user.uid === route.creatorId && (
             <Button
                 variant="secondary"
                 size="sm"
                 className="absolute top-4 right-4 shadow-md"
                 onClick={() => router.push(`/create?edit=${route.id}`)}
             >
                 <Edit3 className="h-4 w-4 mr-2" /> Edit Route
             </Button>
           )}
        </div>
        <CardContent className="p-6 md:p-8">
          {/* Stats Row */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 mb-6">
            <div className="flex items-center text-foreground">
              <Clock className="h-5 w-5 mr-2.5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">{route.duration}</p>
              </div>
            </div>
            <div className="flex items-center text-foreground">
              <Star className="h-5 w-5 mr-2.5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="font-semibold">
                   {route.rating !== null && route.rating !== undefined
                     ? `${route.rating.toFixed(1)} (${route.reviewsCount} reviews)`
                     : `No reviews yet`}
                 </p>
              </div>
            </div>
             <div className="flex items-center text-foreground">
               <User className="h-5 w-5 mr-2.5 text-primary flex-shrink-0" />
               <div>
                 <p className="text-sm text-muted-foreground">Created by</p>
                 <div className="flex items-center gap-1.5">
                      {route.creator.avatarUrl && (
                          <Avatar className="h-5 w-5">
                              <AvatarImage src={route.creator.avatarUrl} alt={route.creator.name}/>
                              <AvatarFallback className="text-xs">{route.creator.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                      )}
                      <p className="font-semibold">{route.creator.name}</p>
                 </div>
               </div>
             </div>
             {route.difficulty && (
                <div className="flex items-center text-foreground">
                  <MapPin className="h-5 w-5 mr-2.5 text-primary flex-shrink-0" /> {/* Reusing MapPin for difficulty */}
                  <div>
                    <p className="text-sm text-muted-foreground">Difficulty</p>
                    <p className="font-semibold">{route.difficulty}</p>
                  </div>
                </div>
             )}
          </div>
          <p className="text-muted-foreground mb-4">{route.description}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {route.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          </div>

           {/* Google Map Embed */}
            {route.googleMapsLink && (() => {
             let embedSrc = '';
              const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

              try {
                  const url = new URL(route.googleMapsLink);
                  // Handle maps.app.goo.gl links
                  if (url.hostname === 'maps.app.goo.gl') {
                       // We can't directly embed goo.gl links. Display a direct link.
                       return (
                           <div className="my-6 p-4 bg-yellow-50 border border-yellow-300 rounded-md text-center">
                               <p className="text-sm text-yellow-800 font-medium">Map Preview Not Available for Short Links</p>
                               <p className="text-xs text-yellow-700 mt-1">Shortened Google Maps links (maps.app.goo.gl) cannot be directly embedded.</p>
                               <a
                                   href={route.googleMapsLink}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm mt-2"
                               >
                                   <ExternalLink className="h-4 w-4"/> Open Route in Google Maps
                               </a>
                           </div>
                       );
                   }
                  // Handle standard www.google.com/maps links
                  else if (url.hostname === 'www.google.com' && url.pathname.includes('/maps/')) {
                      if (url.pathname.startsWith('/maps/d/viewer') || url.pathname.startsWith('/maps/d/edit')) {
                          // My Maps embed
                          const mid = url.searchParams.get('mid');
                          if (mid) {
                              embedSrc = `https://www.google.com/maps/d/embed?mid=${mid}`;
                          }
                      } else if (url.pathname.startsWith('/maps/embed')) {
                          // Already an embed link
                          embedSrc = route.googleMapsLink;
                      } else if (url.pathname.includes('/place/')) {
                          // Place embed
                           const placePath = url.pathname.split('/place/')[1];
                           const placeName = placePath.split('/')[0]; // Get the first part after /place/
                           if (placeName && apiKey) {
                               embedSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(placeName)}`;
                           } else if (!apiKey) {
                               console.warn("API key missing for place embed");
                           }
                      } else if (url.pathname.includes('/@')) {
                          // View embed (coordinates and zoom)
                          const parts = url.pathname.split('/@')[1]?.split(',');
                          if (parts && parts.length >= 3 && apiKey) {
                             const lat = parts[0];
                             const lng = parts[1];
                             const zoom = parts[2].match(/(\d+(\.\d*)?)z/)?.[1]; // Extract zoom level
                             if (lat && lng && zoom) {
                                embedSrc = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${lat},${lng}&zoom=${zoom}`;
                             }
                          } else if (!apiKey) {
                              console.warn("API key missing for view embed");
                          }
                      }
                  }
              } catch (e) {
                 console.error("Error parsing Google Maps URL:", e);
              }

             // Fallback or warning if no embed link could be generated (and it's not a goo.gl link)
             if (!embedSrc) {
                 return (
                      <div className="my-6 p-4 bg-muted/50 border rounded-md text-center">
                          <p className="text-sm text-muted-foreground">Could not generate map embed for this link.</p>
                           <a
                               href={route.googleMapsLink}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm mt-2"
                           >
                               <ExternalLink className="h-4 w-4"/> View on Google Maps
                           </a>
                      </div>
                  );
             }

             // Render the iframe if embedSrc is valid
             return (
               <div className="my-6">
                   <a
                       href={route.googleMapsLink}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm mb-3"
                   >
                       <ExternalLink className="h-4 w-4"/> View Full Map on Google Maps
                   </a>
                   <div className="aspect-video rounded-lg overflow-hidden border border-border shadow-md bg-muted"> {/* Added bg-muted for loading state */}
                       <iframe
                       src={embedSrc}
                       width="100%"
                       height="100%"
                       style={{ border:0 }}
                       allowFullScreen={true}
                       loading="lazy"
                       referrerPolicy="no-referrer-when-downgrade"
                       title={`Map of ${route.title}`}
                       ></iframe>
                   </div>
               </div>
             );
           })()}

           {/* Long Description */}
           {route.longDescription && (
            <>
              <Separator className="my-6" />
              <h2 className="text-xl font-semibold text-foreground mb-3">About this Route</h2>
              {/* Use whitespace-pre-line to respect line breaks */}
              <p className="text-foreground whitespace-pre-line leading-relaxed">
                {route.longDescription}
              </p>
            </>
           )}
        </CardContent>
      </Card>

      {/* Feedback & Comments Section */}
      <Card id="feedback" className="rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Feedback & Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Review Submission Form */}
          <form onSubmit={handleCommentSubmit} className="space-y-4 mb-8 p-4 border border-border rounded-lg bg-background shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Leave Your Review</h3>
            {/* Rating Input */}
            <div>
              <Label className="block mb-1 text-sm font-medium text-foreground">Your Rating</Label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setNewRating(star)}
                    className={`rounded-full hover:bg-accent/20 ${newRating >= star ? 'text-accent' : 'text-muted-foreground/50'} transition-colors`}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star className={`h-6 w-6 ${newRating >= star ? 'fill-accent' : ''}`} />
                  </Button>
                ))}
              </div>
            </div>
            {/* Comment Textarea */}
            <div>
              <Label htmlFor="newComment" className="block mb-1 text-sm font-medium text-foreground">Your Comment</Label>
              <Textarea
                id="newComment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? "Share your experience with this route..." : "Please sign in to leave a comment."}
                rows={4}
                required
                disabled={!user || isSubmittingReview}
              />
            </div>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
               <Button
                 type="button"
                 variant="outline"
                 onClick={handleGetSuggestions}
                 disabled={isLoadingSuggestions || !user || isSubmittingReview || !route.description} // Disable if no description for context
                 className="text-sm border-primary text-primary hover:bg-primary/10"
                 title={!user ? "Sign in to get suggestions" : ""}
               >
                 {isLoadingSuggestions ? (
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 ) : (
                   <Lightbulb className="h-4 w-4 mr-2" />
                 )}
                 Get AI Comment Suggestions
               </Button>
               <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm" disabled={!user || isSubmittingReview}>
                 {isSubmittingReview ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                 {isSubmittingReview ? "Submitting..." : "Submit Review"}
               </Button>
            </div>
             {!user && !authLoading && (
                <p className="text-xs text-destructive text-center mt-2">You must be signed in to submit a review.</p>
             )}
            {/* AI Suggestions */}
            {suggestedComments.length > 0 && (
              <div className="mt-3 space-y-2 p-3 bg-muted/50 rounded-md">
                <h4 className="text-sm font-medium text-foreground">Suggested comments:</h4>
                <ul className="space-y-1">
                  {suggestedComments.map((s, i) => (
                    <li key={i} className="text-xs">
                      <Button variant="link" size="sm" className="p-0 h-auto text-primary hover:text-primary/80 text-left leading-snug" onClick={() => setNewComment(s)}>
                        "{s}"
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>

          <Separator className="my-6" />

          {/* Display Existing Comments */}
          <h3 className="text-lg font-semibold text-foreground mb-4">Community Reviews ({route.comments.length})</h3>
          <div className="space-y-6">
            {route.comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.avatarUrl} alt={comment.user} data-ai-hint={comment.avatarHint || "user avatar"}/>
                  <AvatarFallback>{comment.user?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{comment.user}</p>
                    <p className="text-xs text-muted-foreground">{new Date(comment.date).toLocaleDateString()}</p> {/* Format date */}
                  </div>
                  <div className="flex items-center my-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < comment.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))}
            {route.comments.length === 0 && (
              <p className="text-muted-foreground text-sm">No reviews yet. Be the first to share your thoughts!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Route Spots / Itinerary Section */}
      {(route.spots && route.spots.length > 0) ? (
        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-foreground">Route Itinerary & Spots</CardTitle>
            <CardDescription>Key points of interest along the trail. Tap a spot to see photos or add your own!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {/* TODO: Consider adding an interactive map here showing spot markers if no main Google Map embed is present */}
            {/* {!route.googleMapsLink && (
                 <div className="bg-muted rounded-lg h-64 flex items-center justify-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mr-2" /> Interactive Spot Map (Placeholder)
                </div>
            )} */}

            {route.spots.map((spot, index) => (
              <div key={spot.id} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-primary flex items-center">
                  <span className="mr-2 text-accent font-bold">{index + 1}.</span> {spot.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 mb-3">{spot.description}</p>

                {/* Display Photos */}
                {spot.photos && spot.photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                    {spot.photos.map(photo => (
                       <div key={photo.id} className="relative aspect-square rounded-md overflow-hidden group bg-muted"> {/* Added bg-muted */}
                          <Image
                             src={photo.url}
                             alt={`${spot.name} photo by ${photo.user}`}
                             layout="fill"
                             objectFit="cover"
                             data-ai-hint={photo.hint || 'spot photo'}
                             className="transition-transform duration-300 group-hover:scale-105"
                           />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                              <p className="text-white text-[10px] font-medium truncate">By {photo.user}</p>
                          </div>
                       </div>
                    ))}
                  </div>
                )}

                {/* Add Photo Button */}
                 <Button variant="outline" size="sm" onClick={() => user ? setShowPhotoUploadModal(spot.id) : toast({ variant: 'destructive', title: 'Please sign in to add photos.' })}>
                   <Camera className="h-4 w-4 mr-2" />
                   {spot.photos && spot.photos.length > 0 ? 'View / Add Photos' : 'Add Your Photo'}
                 </Button>

                {/* Photo Upload Modal/Section */}
                {showPhotoUploadModal === spot.id && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-md border border-dashed">
                    <Label htmlFor={`photo-upload-${spot.id}`} className="font-semibold mb-2 block text-sm">Upload photos for: <span className="text-primary">{spot.name}</span></Label>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <Input
                        id={`photo-upload-${spot.id}`}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(spot.id, e.target.files)}
                        className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                      />
                      <Button size="sm" variant="ghost" onClick={() => setShowPhotoUploadModal(null)}>Close</Button>
                    </div>
                     {uploadedPhotos[spot.id] && uploadedPhotos[spot.id].length > 0 && (
                        <div className="mt-3 text-xs text-muted-foreground">
                            <ul className="list-disc pl-4">
                                {uploadedPhotos[spot.id].map(file => <li key={file.name}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>)}
                            </ul>
                            <Button size="sm" variant="link" className="p-0 h-auto text-accent mt-1" onClick={() => {/* TODO: Implement upload action */} toast({title: "Upload action needed"})}>
                                Confirm Upload {/* Change text based on upload state */}
                            </Button>
                        </div>
                     )}
                     {!uploadedPhotos[spot.id] && <p className="text-xs text-muted-foreground mt-2">Select one or more image files.</p>}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        // Show info card if no spots are defined AND no google map link exists
        !route.googleMapsLink && (
            <Card className="rounded-xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-foreground">Route Itinerary & Spots</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 text-muted-foreground p-4 bg-muted/50 rounded-md border border-dashed">
                        <Info className="h-5 w-5 flex-shrink-0"/>
                        <p className="text-sm">No specific spots or map link provided for this route yet. Enjoy the general journey description!</p>
                    </div>
                </CardContent>
            </Card>
        )
      )}
    </div>
  );
}
