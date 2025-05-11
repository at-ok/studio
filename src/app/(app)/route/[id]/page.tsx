
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
import { MapPin, Star, Clock, User, Camera, MessageSquare, Send, ThumbsUp, Lightbulb, Loader2, AlertTriangle, CheckCircle, ImagePlus, Info, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Extended Route Detail type
interface RouteSpotPhoto {
  id: string;
  url: string;
  user: string;
  hint: string;
}
interface RouteSpot {
  id: string;
  name: string;
  description: string;
  photos: RouteSpotPhoto[];
}
interface Comment {
  id: string;
  user: string;
  avatarUrl: string;
  avatarHint?: string;
  text: string;
  rating: number;
  date: string;
}
interface RouteDetail {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  imageUrl: string;
  imageHint?: string;
  tags: string[];
  rating: number | null;
  reviewsCount: number;
  duration: string;
  difficulty?: string; 
  creator: {
    name: string;
    avatarUrl?: string;
    avatarHint?: string;
  };
  isCulturalRoute: boolean;
  startPoint: string;
  spots?: RouteSpot[]; 
  communityFeedbackSummary?: string;
  comments: Comment[];
  googleMapsLink?: string;
}


// Mock data for a single route (can be fallback or part of initial data)
const mockRouteDetailList: RouteDetail[] = [
  {
    id: "mock-1", 
    title: "Ancient Temple Trail",
    description: "A captivating journey through historic temples, serene bamboo forests, and breathtaking viewpoints. This trail offers a deep dive into local traditions and natural beauty. Suitable for moderate fitness levels.",
    longDescription: "The Ancient Temple Trail starts at the Whispering Pines Gate and winds its way up Mount serenity. Along the path, you'll encounter the Sunken Pagoda, the Moon Reflection Pond, and the thousand-year-old Guardian Tree. Each spot has its own story, passed down through generations. The trail culminates at the Summit Shrine, offering panoramic views of the entire valley. Be sure to wear comfortable shoes and bring water. The best times to visit are early morning or late afternoon to avoid crowds and catch the golden light.",
    imageUrl: "https://picsum.photos/seed/temple_detail/1200/500",
    imageHint: "temple panorama",
    tags: ["History", "Nature", "Cultural", "Hiking"],
    rating: 4.5,
    reviewsCount: 120,
    duration: "3 hours",
    difficulty: "Moderate",
    creator: {
      name: "Culture Enthusiast",
      avatarUrl: "https://picsum.photos/seed/creator_enthusiast/100/100",
      avatarHint: "creator avatar"
    },
    isCulturalRoute: true,
    startPoint: "Whispering Pines Gate",
    spots: [
      { id: "s1", name: "Sunken Pagoda", description: "A partially submerged ancient structure with intricate carvings.", photos: [{id: "p1", url:"https://picsum.photos/seed/pagoda_spot/400/300", user:"UserA", hint:"pagoda photo"}, {id: "p2", url:"https://picsum.photos/seed/pagoda_spot2/400/300", user:"UserB", hint:"pagoda detail"}] },
      { id: "s2", name: "Moon Reflection Pond", description: "Known for its perfectly still waters reflecting the sky.", photos: [{id: "p3", url: "https://picsum.photos/seed/pond_spot/400/300", user:"UserC", hint:"pond reflection"}] },
      { id: "s3", name: "Guardian Tree", description: "A massive, ancient tree believed to protect the trail.", photos: [] },
      { id: "s4", name: "Summit Shrine", description: "The final destination offering stunning views.", photos: [{id: "p4", url:"https://picsum.photos/seed/summit_shrine/400/300", user:"UserD", hint:"summit view"}] },
    ],
    communityFeedbackSummary: "Most visitors love the peaceful atmosphere and historical significance. Some mention the trail can be challenging in parts but ultimately rewarding. Popular photo spots include the Sunken Pagoda and the view from Summit Shrine.",
    comments: [
      { id: "c1", user: "TravelerJane", avatarUrl: "https://picsum.photos/seed/jane/50/50", avatarHint: "jane avatar", text: "Absolutely stunning! The views from the top are worth the climb. Highly recommend.", rating: 5, date: "2 days ago" },
      { id: "c2", user: "HistoryBuff", avatarUrl: "https://picsum.photos/seed/buff/50/50", avatarHint: "buff avatar", text: "A fantastic route for anyone interested in local history. The Sunken Pagoda was my favorite.", rating: 4, date: "5 days ago" },
    ]
  },
   {
    id: "mock-2",
    title: "Urban Art Walk",
    description: "Discover vibrant street art and modern galleries in the city's art district.",
    imageUrl: "https://picsum.photos/seed/art_detail/1200/500",
    imageHint: "urban art mural",
    tags: ["Art", "City", "Modern"],
    rating: 4.8,
    reviewsCount: 250,
    duration: "2 hours",
    difficulty: "Easy",
    creator: { name: "City Explorer" },
    isCulturalRoute: false,
    startPoint: "Downtown Plaza",
    comments: [],
  },
  {
    id: "mock-3",
    title: "Seaside Heritage Path",
    description: "A scenic coastal walk featuring old fishing villages and maritime history.",
    imageUrl: "https://picsum.photos/seed/seaside_detail/1200/500",
    imageHint: "coastal village path",
    tags: ["Coastal", "History", "Scenic"],
    rating: 4.2,
    reviewsCount: 95,
    duration: "2.5 hours",
    difficulty: "Moderate",
    creator: { name: "Local Historian" },
    isCulturalRoute: true,
    startPoint: "Old Harbor",
    comments: [],
  }
];

const SHARED_ROUTES_LS_KEY = 'userSharedRoutes';


export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const routeId = params.id as string;

  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState<number>(0);
  const [suggestedComments, setSuggestedComments] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [currentComments, setCurrentComments] = useState<Comment[]>([]);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState<string | null>(null); // Spot ID
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, File[]>>({});


  useEffect(() => {
    setIsLoadingRoute(true);
    let foundRouteData: Partial<RouteDetail> | undefined | null = null;

    if (typeof window !== 'undefined' && (routeId.startsWith('user_shared_') || routeId.startsWith('user_created_'))) {
      const storedUserRoutesRaw = localStorage.getItem(SHARED_ROUTES_LS_KEY);
      // Ensure storedUserRoutes are compatible with RouteDetail or a simpler shared type
      const storedUserRoutes: Array<Partial<RouteDetail> & { creator: string | RouteDetail['creator'] }> = storedUserRoutesRaw ? JSON.parse(storedUserRoutesRaw) : [];
      const rawFoundRoute = storedUserRoutes.find(r => r.id === routeId);
      if (rawFoundRoute) {
        // Adapt SharedRoute to RouteDetail structure
        foundRouteData = {
          ...rawFoundRoute,
          creator: typeof rawFoundRoute.creator === 'string' ? { name: rawFoundRoute.creator } : rawFoundRoute.creator,
          reviewsCount: rawFoundRoute.reviewsCount || (rawFoundRoute.rating !== null && rawFoundRoute.rating !== undefined ? 1 : 0),
          spots: rawFoundRoute.spots || [],
          comments: rawFoundRoute.comments || [],
          longDescription: rawFoundRoute.longDescription || rawFoundRoute.description,
          difficulty: rawFoundRoute.difficulty || "Varies",
          imageHint: rawFoundRoute.imageHint || "route image",
        };
      }
    }

    if (!foundRouteData) {
      foundRouteData = mockRouteDetailList.find(r => r.id === routeId);
    }
    
    if (foundRouteData) {
        setRoute(foundRouteData as RouteDetail); // Cast after ensuring all required fields are present or defaulted
        setCurrentComments(foundRouteData.comments || []);
    } else {
        setRoute(null); 
    }

    const timer = setTimeout(() => setIsLoadingRoute(false), 300); 
    return () => clearTimeout(timer);
  }, [routeId]);


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

  const handleCommentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || newRating === 0) {
      toast({
        variant: "destructive",
        title: "Incomplete submission",
        description: "Please write a comment and select a rating.",
      });
      return;
    }
    const newCommentEntry: Comment = {
      id: `c${currentComments.length + 3}_${Date.now()}`, 
      user: "CurrentUser", 
      avatarUrl: "https://picsum.photos/seed/currentuser/50/50",
      avatarHint: "current user avatar",
      text: newComment,
      rating: newRating,
      date: "Just now",
    };
    setCurrentComments(prev => [newCommentEntry, ...prev]);
    // TODO: Persist comment to localStorage or backend for this route
    setNewComment('');
    setNewRating(0);
    setSuggestedComments([]);
    toast({
      title: "Feedback submitted!",
      description: "Thank you for your review.",
      action: <CheckCircle className="text-green-500" />,
    });
  };
  
  const handlePhotoUpload = (spotId: string, files: FileList | null) => {
    if (files && route && route.spots) {
      setUploadedPhotos(prev => ({...prev, [spotId]: Array.from(files)}));
      toast({ title: `${files.length} photo(s) selected for ${route.spots.find(s => s.id === spotId)?.name}. They will be uploaded when you submit your review.`});
    }
  };


  if (isLoadingRoute) {
    return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Loading route details...</p></div>;
  }

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Route Not Found</h2>
        <p className="text-muted-foreground mb-6">The route you are looking for does not exist or could not be loaded.</p>
        <Button onClick={() => router.push('/discover')}>Back to Discover Routes</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Route Header */}
      <Card className="overflow-hidden rounded-xl shadow-lg">
        <div className="relative h-64 md:h-96">
          <Image src={route.imageUrl} alt={route.title} layout="fill" objectFit="cover" data-ai-hint={route.imageHint || "route image"} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-lg">{route.title}</h1>
            {route.isCulturalRoute && (
              <Badge variant="default" className="mt-2 bg-primary text-primary-foreground text-sm py-1 px-3 shadow-md">Cultural Route</Badge>
            )}
          </div>
        </div>
        <CardContent className="p-6 md:p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center text-foreground">
              <Clock className="h-6 w-6 mr-2.5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">{route.duration}</p>
              </div>
            </div>
            <div className="flex items-center text-foreground">
              <Star className="h-6 w-6 mr-2.5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="font-semibold">{route.rating !== null ? `${route.rating} (${route.reviewsCount} reviews)` : `No reviews yet`}</p>
              </div>
            </div>
            <div className="flex items-center text-foreground">
              <User className="h-6 w-6 mr-2.5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Created by</p>
                <p className="font-semibold">{route.creator.name}</p>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">{route.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {route.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          </div>

          {route.googleMapsLink && (() => {
            let embedSrc = route.googleMapsLink; 
            if (route.googleMapsLink.includes("/maps/d/viewer")) {
              embedSrc = route.googleMapsLink.replace("/maps/d/viewer", "/maps/d/embed");
            } else if (route.googleMapsLink.includes("/maps/d/edit")) {
              embedSrc = route.googleMapsLink.replace("/maps/d/edit", "/maps/d/embed");
            } else if (route.googleMapsLink.includes("/maps/embed/")) {
              // Already an embed link
              embedSrc = route.googleMapsLink;
            } else if (route.googleMapsLink.includes("/maps/")) {
               // Attempt to construct a basic embed link for general /maps/ links.
               // This might not work for all types of Google Maps links, especially complex ones.
               // A more robust solution might involve parsing the URL to extract place IDs or coordinates
               // and constructing an embed URL using the Google Maps Embed API format.
               // For simplicity, this basic replacement is a common case.
              const urlParts = route.googleMapsLink.split('/@');
              if (urlParts.length > 1 && urlParts[0].includes('/place/')) {
                 // Looks like a place URL, try to make an embed link
                 const placeName = urlParts[0].substring(urlParts[0].lastIndexOf('/') + 1);
                 embedSrc = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(placeName)}`;
              } else if (urlParts.length > 1) {
                 // Looks like a coordinate-based URL, try to make an embed link
                 const coordsAndZoom = urlParts[1].split(',');
                 if (coordsAndZoom.length >= 3) { // lat, lng, zoom
                    embedSrc = `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${coordsAndZoom[0]},${coordsAndZoom[1]}&zoom=${coordsAndZoom[2].replace('z', '')}`;
                 }
              }
              // If not a known pattern, it might fallback to original or just not embed well.
            }


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
                  <div className="aspect-video rounded-lg overflow-hidden border border-border shadow-md">
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
          
          {route.longDescription && (
            <>
              <Separator className="my-6" />
              <h2 className="text-xl font-semibold text-foreground mb-3">About this Route</h2>
              <p className="text-foreground whitespace-pre-line leading-relaxed">
                {route.longDescription}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Route Spots / Itinerary */}
      {(route.spots && route.spots.length > 0) ? (
        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-foreground">Route Itinerary & Spots</CardTitle>
            <CardDescription>Key points of interest along the trail. Tap a spot to see photos or add your own!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Conditional Map Placeholder only if googleMapsLink is not present */}
            {!route.googleMapsLink && (
                 <div className="bg-muted rounded-lg h-64 flex items-center justify-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mr-2" /> Interactive Map Placeholder (Spots)
                </div>
            )}

            {route.spots.map((spot, index) => (
              <div key={spot.id} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-primary flex items-center">
                  <span className="mr-2 text-accent font-bold">{index + 1}.</span> {spot.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 mb-3">{spot.description}</p>
                
                {spot.photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                    {spot.photos.map(photo => (
                       <div key={photo.id} className="relative aspect-square rounded-md overflow-hidden group">
                          <Image src={photo.url} alt={`${spot.name} photo by ${photo.user}`} layout="fill" objectFit="cover" data-ai-hint={photo.hint}/>
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                              <p className="text-white text-xs truncate">By {photo.user}</p>
                          </div>
                       </div>
                    ))}
                  </div>
                )}
                
                <Button variant="outline" size="sm" onClick={() => setShowPhotoUploadModal(spot.id)}>
                  <Camera className="h-4 w-4 mr-2" /> {spot.photos.length > 0 ? 'View / Add Photos' : 'Add Your Photo'}
                </Button>

                {showPhotoUploadModal === spot.id && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-md">
                    <Label htmlFor={`photo-upload-${spot.id}`} className="font-semibold mb-2 block">Upload photos for {spot.name}</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id={`photo-upload-${spot.id}`} 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(spot.id, e.target.files)}
                        className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                      <Button size="sm" onClick={() => setShowPhotoUploadModal(null)}>Close</Button>
                    </div>
                    {uploadedPhotos[spot.id] && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {uploadedPhotos[spot.id]?.length} photo(s) selected.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : !route.googleMapsLink && ( // Show this card only if no spots AND no googleMapsLink to embed
        <Card className="rounded-xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">Route Itinerary & Spots</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted/50 rounded-md">
                    <Info className="h-5 w-5"/>
                    <p>No specific spots or map link provided for this route yet. Enjoy the general journey!</p>
                </div>
            </CardContent>
        </Card>
      )}


      {/* Feedback & Comments Section */}
      <Card className="rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Feedback & Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCommentSubmit} className="space-y-4 mb-8 p-4 border border-border rounded-lg bg-background shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Leave Your Review</h3>
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
                    className={`rounded-full hover:bg-accent/20 ${newRating >= star ? 'text-accent' : 'text-muted-foreground/50'}`}
                    aria-label={`Rate ${star} star`}
                  >
                    <Star className={`h-6 w-6 ${newRating >= star ? 'fill-accent' : ''}`} />
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="newComment" className="block mb-1 text-sm font-medium text-foreground">Your Comment</Label>
              <Textarea
                id="newComment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience with this route..."
                rows={4}
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGetSuggestions}
                disabled={isLoadingSuggestions}
                className="text-sm border-primary text-primary hover:bg-primary/10"
              >
                {isLoadingSuggestions ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lightbulb className="h-4 w-4 mr-2" />
                )}
                Get AI Comment Suggestions
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
                <Send className="h-4 w-4 mr-2" /> Submit Review
              </Button>
            </div>
            {suggestedComments.length > 0 && (
              <div className="mt-3 space-y-2 p-3 bg-muted/50 rounded-md">
                <h4 className="text-sm font-medium text-foreground">Suggested comments:</h4>
                <ul className="space-y-1">
                  {suggestedComments.map((s, i) => (
                    <li key={i} className="text-xs">
                      <Button variant="link" size="sm" className="p-0 h-auto text-primary hover:text-primary/80 text-left" onClick={() => setNewComment(s)}>
                        "{s}"
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>

          <Separator className="my-6" />
          
          <h3 className="text-lg font-semibold text-foreground mb-4">Community Reviews ({currentComments.length})</h3>
          <div className="space-y-6">
            {currentComments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.avatarUrl} alt={comment.user} data-ai-hint={comment.avatarHint || "user avatar"}/>
                  <AvatarFallback>{comment.user.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{comment.user}</p>
                    <p className="text-xs text-muted-foreground">{comment.date}</p>
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
            {currentComments.length === 0 && (
              <p className="text-muted-foreground text-sm">No reviews yet. Be the first to share your thoughts!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

