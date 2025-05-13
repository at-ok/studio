
"use client";

import { useState, type FormEvent, useEffect, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Route, Info, ExternalLink, Lightbulb, Trash2, Edit, Save, MapPin, Loader2 } from "lucide-react";
import Image from "next/image";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from "@/lib/firebase"; // Import Firebase auth instance
import { useAuthState } from 'react-firebase-hooks/auth'; // Hook to get auth state
import { addRoute, getRouteById, updateRoute, type RouteData } from '@/lib/firestoreService'; // Import Firestore service functions
import type { Timestamp } from 'firebase/firestore';

type CreateMode = 'options' | 'share' | 'new' | 'edit';

// Use RouteData from firestoreService, adjusting for client-side (e.g., string timestamps)
interface ClientRouteData extends Omit<RouteData, 'createdAt' | 'updatedAt' | 'creatorId' | 'creatorName' | 'creatorAvatarUrl'> {
  id: string; // Ensure ID is always present on the client
  createdAt?: string; // Use string for easier state management
  updatedAt?: string;
  creatorName?: string; // Include for potential display if needed later
  creatorAvatarUrl?: string;
  creatorId?: string; // Keep creatorId
}


const VALID_MAPS_LINK_PREFIX = "https://maps.app.goo.gl/";

export default function CreatePage() {
  const [mode, setMode] = useState<CreateMode>('options');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [isCulturalRoute, setIsCulturalRoute] = useState(false);
  const [uploadedImageDataUrl, setUploadedImageDataUrl] = useState<string | null>(null);
  const [picsumPreviewUrl, setPicsumPreviewUrl] = useState<string | null>(null);

  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [routeToEdit, setRouteToEdit] = useState<ClientRouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false); // General loading state for async ops

  const [user, authLoading, authError] = useAuthState(auth); // Get user auth state
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Effect to fetch route data if editing
 useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && user) { // Check user auth before fetching
      setIsLoading(true);
      setEditingRouteId(editId);
      getRouteById(editId)
        .then(routeData => {
          if (routeData) {
            if (routeData.creatorId !== user.uid) {
                toast({ variant: "destructive", title: "Permission Denied", description: "You can only edit your own routes." });
                router.push('/my-page');
                return;
            }
            const clientData: ClientRouteData = {
                ...routeData,
                 // Convert Firestore Timestamps to string dates if they exist
                createdAt: routeData.createdAt instanceof Timestamp ? routeData.createdAt.toDate().toISOString() : undefined,
                updatedAt: routeData.updatedAt instanceof Timestamp ? routeData.updatedAt.toDate().toISOString() : undefined,
            };
            setRouteToEdit(clientData);
            setRouteName(clientData.title);
            setRouteDescription(clientData.description);
            setGoogleMapsLink(clientData.googleMapsLink || '');
            setIsCulturalRoute(clientData.isCulturalRoute);

            // Image handling logic
            if (clientData.imageUrl && !clientData.imageUrl.startsWith('https://picsum.photos')) {
              setUploadedImageDataUrl(clientData.imageUrl);
              setPicsumPreviewUrl(null);
            } else if (clientData.googleMapsLink?.startsWith(VALID_MAPS_LINK_PREFIX)) {
              setPicsumPreviewUrl(`https://picsum.photos/seed/${encodeURIComponent(clientData.googleMapsLink)}/600/300`);
              setUploadedImageDataUrl(null);
            } else if (clientData.imageUrl?.startsWith('https://picsum.photos')) {
              setPicsumPreviewUrl(clientData.imageUrl);
              setUploadedImageDataUrl(null);
            } else {
              setUploadedImageDataUrl(null);
              setPicsumPreviewUrl(null);
            }
            setMode('edit');

          } else {
            toast({ variant: "destructive", title: "Error", description: "Route not found for editing." });
            router.push('/my-page');
          }
        })
        .catch(error => {
          console.error("Error fetching route for edit:", error);
          toast({ variant: "destructive", title: "Loading Error", description: "Could not load route data." });
          router.push('/my-page');
        })
        .finally(() => setIsLoading(false));
    } else if (editId && !user && !authLoading) {
        // Redirect if trying to edit while not logged in (and auth check is complete)
        toast({ variant: "destructive", title: "Authentication Required", description: "Please sign in to edit routes." });
        router.push('/auth/signin');
    } else if (!editId) {
         // Reset form if not in edit mode
         setMode('options');
    }
  }, [searchParams, user, authLoading, toast, router]);


  // Effect to reset form state when mode changes back to 'options'
  useEffect(() => {
    if (mode === 'options' && !isLoading) {
      setGoogleMapsLink('');
      setPicsumPreviewUrl(null);
      setUploadedImageDataUrl(null);
      setRouteName('');
      setRouteDescription('');
      setIsCulturalRoute(false);
      setEditingRouteId(null);
      setRouteToEdit(null);
      // Clear edit param from URL without page reload
      router.replace('/create', undefined); 
    }
  }, [mode, isLoading, router]);


  const handleLinkPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
    const link = e.target.value;
    setGoogleMapsLink(link);

    if (!uploadedImageDataUrl) { // Only set picsum if no user image is uploaded
      if (link.startsWith(VALID_MAPS_LINK_PREFIX)) {
        setPicsumPreviewUrl(`https://picsum.photos/seed/${encodeURIComponent(link)}/600/300`);
      } else {
        setPicsumPreviewUrl(null);
        if (link.trim() !== '' && !link.startsWith(VALID_MAPS_LINK_PREFIX)) {
          toast({
            variant: "destructive",
            title: "Invalid Google Maps Link",
            description: `Route link must start with '${VALID_MAPS_LINK_PREFIX}'.`,
            duration: 5000,
          });
        }
      }
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ variant: "destructive", title: "Image too large", description: "Please upload an image smaller than 5MB." });
        event.target.value = ''; // Clear the input
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageDataUrl(reader.result as string);
        setPicsumPreviewUrl(null); // User image overrides picsum preview
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImageDataUrl(null);
     // Restore picsum preview if a valid link exists
    if (googleMapsLink.startsWith(VALID_MAPS_LINK_PREFIX)) {
      setPicsumPreviewUrl(`https://picsum.photos/seed/${encodeURIComponent(googleMapsLink)}/600/300`);
    } else {
       setPicsumPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) {
        toast({ variant: "default", title: "Verifying user..." });
        return;
    }
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please sign in to share or create routes." });
      router.push('/auth/signin');
      return;
    }

    // Common validations
    if (!routeName || !routeDescription) {
      toast({ variant: "destructive", title: "Missing Information", description: "Route name and description are required." });
      return;
    }
    if (isShareLike && !googleMapsLink.startsWith(VALID_MAPS_LINK_PREFIX)) {
       toast({ variant: "destructive", title: "Invalid Google Maps Link", description: `Please provide a valid Google Maps link starting with '${VALID_MAPS_LINK_PREFIX}'.` });
       return;
    }

    setIsLoading(true);

    // Determine image URL and hint
    let finalImageUrl = uploadedImageDataUrl || picsumPreviewUrl;
    if (!finalImageUrl && !isEditMode) { // Generate default only if creating new and none provided
        finalImageUrl = `https://picsum.photos/seed/${encodeURIComponent(routeName || 'default_route')}/600/400`;
    } else if (!finalImageUrl && isEditMode && routeToEdit?.googleMapsLink) { // Default for editing map link
        finalImageUrl = `https://picsum.photos/seed/${encodeURIComponent(routeToEdit.googleMapsLink)}/600/300`;
    } else if (!finalImageUrl && isEditMode && !routeToEdit?.googleMapsLink) { // Default for editing custom
        finalImageUrl = `https://picsum.photos/seed/${encodeURIComponent(routeName || 'custom_route')}/600/400`;
    }
     let finalImageHint = uploadedImageDataUrl ? "user uploaded" 
                        : (picsumPreviewUrl && googleMapsLink ? "map preview" 
                        : (picsumPreviewUrl ? "custom community route" : "generic route image"));


     // Prepare Route Data
     const routeDataBase: Omit<RouteData, 'id' | 'createdAt' | 'updatedAt' | 'creatorId' | 'creatorName' | 'creatorAvatarUrl'> = {
        title: routeName,
        description: routeDescription,
        imageUrl: finalImageUrl || '', // Ensure imageUrl is not undefined
        imageHint: finalImageHint,
        tags: [], // Will be set below
        rating: null, // Rating starts at null
        duration: isShareLike ? "Varies" : "User Defined",
        isCulturalRoute: isCulturalRoute,
        startPoint: isShareLike ? "From Google Maps" : "User Described",
        googleMapsLink: isShareLike ? googleMapsLink : undefined,
        // Omit creatorId, creatorName, creatorAvatarUrl, createdAt, updatedAt - handled by service/server
        // Omit id - handled by service/server
     };
     
     // Set tags based on type and cultural status
     if (isShareLike) {
        routeDataBase.tags = isCulturalRoute ? ["Cultural", "Shared Map"] : ["Shared Map"];
     } else { // isNewLike
        routeDataBase.tags = isCulturalRoute ? ["Cultural", "Custom"] : ["Custom"];
     }


    try {
       if (mode === 'edit' && editingRouteId) {
           // UPDATE existing route
           const updateData: Partial<RouteData> = {
                title: routeName,
                description: routeDescription,
                googleMapsLink: isShareLike ? googleMapsLink : undefined,
                isCulturalRoute,
                imageUrl: finalImageUrl || routeToEdit?.imageUrl || '', // Fallback to existing if somehow null
                imageHint: finalImageHint,
                tags: routeDataBase.tags,
                startPoint: routeDataBase.startPoint,
                duration: routeDataBase.duration,
           };
           await updateRoute(editingRouteId, updateData, user.uid);
           toast({ title: "Route Updated!", description: `${routeName} has been successfully updated.` });
           router.push('/my-page'); // Redirect after successful update
       } else {
           // ADD new route (Share or New)
           await addRoute(routeDataBase, user);
           toast({ title: `Route ${isShareLike ? 'Shared' : 'Created'}!`, description: `${routeName} has been added.` });
           setMode('options'); // Go back to options after successful creation
       }
    } catch (error: any) {
        console.error(`Error ${mode === 'edit' ? 'updating' : 'saving'} route:`, error);
        toast({
          variant: "destructive",
          title: `Route ${mode === 'edit' ? 'Update' : 'Save'} Failed`,
          description: error.message || `Could not ${mode === 'edit' ? 'update' : 'save'} the route. Please try again.`,
        });
    } finally {
      setIsLoading(false);
    }
  };


  const handleCancel = () => {
    if (mode === 'edit') {
      router.push('/my-page'); // Navigate back to My Page if editing
    } else {
      setMode('options');
       router.replace('/create', undefined); // Clear query params without history entry
    }
  };

  const currentPreviewUrl = uploadedImageDataUrl || picsumPreviewUrl;

  // Loading state for auth check
  if (authLoading) {
    return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Loading user data...</p></div>;
  }
  // Handle auth error (optional, could rely on redirect from effect)
  if (authError) {
      return <div className="text-destructive">Error loading user data: {authError.message}</div>;
  }
  // Handle case where user is required but not logged in (should be caught by effect, but good failsafe)
   if ((mode === 'new' || mode === 'share' || mode === 'edit') && !user) {
       // Redirect to sign-in if trying to access create/edit forms without being logged in
       if (typeof window !== 'undefined') { // Ensure this only runs client-side
            router.push('/auth/signin');
       }
       return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Redirecting to sign in...</p></div>;
   }

  if (isLoading && mode === 'edit') {
     return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Loading route data...</p></div>;
  }

  if (mode === 'options') {
    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create or Share a Route</h1>
          <p className="text-muted-foreground">Contribute to Culture Compass by adding new routes for others to explore.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><Share2 className="h-6 w-6 text-primary" /> Share Existing Route</CardTitle>
              <CardDescription>Share a Google Maps link (must start with {VALID_MAPS_LINK_PREFIX}) and optionally add an image.</CardDescription>
            </CardHeader>
            <CardContent><Button onClick={() => setMode('share')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Share Google Maps Route</Button></CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-300 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><Route className="h-6 w-6 text-accent" /> Create New Route</CardTitle>
              <CardDescription>Design your own route, providing details and optionally an image.</CardDescription>
            </CardHeader>
            <CardContent><Button onClick={() => setMode('new')} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Create a New Route</Button></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Combined Form for Share, New, and Edit modes
  const isEditMode = mode === 'edit';
  // Determine if the current mode resembles sharing a map (has googleMapsLink field)
  const isShareLike = (isEditMode && routeToEdit?.googleMapsLink) || mode === 'share';
  // Determine if the current mode resembles creating a new custom route (no googleMapsLink field)
  const isNewLike = (isEditMode && !routeToEdit?.googleMapsLink) || mode === 'new';

  let pageTitle = "";
  let submitIcon = <Route className="h-5 w-5" />;
  let submitText = "";
  let primaryButtonClass = "bg-accent hover:bg-accent/90 text-accent-foreground"; // Default for 'new'

  if (isEditMode) {
    pageTitle = `Edit Route: ${routeToEdit?.title || 'Loading...'}`;
    submitIcon = <Save className="h-5 w-5" />;
    submitText = "Update Route";
    // Adjust button style based on whether the route being edited is a map link or custom
    primaryButtonClass = routeToEdit?.googleMapsLink ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-accent hover:bg-accent/90 text-accent-foreground";
  } else if (isShareLike) {
    pageTitle = "Share Google Maps Route";
    submitIcon = <Share2 className="h-5 w-5" />;
    submitText = "Share Route";
    primaryButtonClass = "bg-primary hover:bg-primary/90 text-primary-foreground";
  } else if (isNewLike) {
    pageTitle = "Create a New Route";
    submitIcon = <Route className="h-5 w-5" />;
    submitText = "Create Route";
     // primaryButtonClass remains the default 'new' style
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {isEditMode ? "Modify the details of your route." : (isShareLike ? "Paste your Google Maps route link and add details." : "Design your own unique cultural journey.")}
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          {isEditMode ? "Cancel Edit" : "Back to Options"}
        </Button>
      </header>

      {isNewLike && !isEditMode && ( // Show guide only for 'new' mode creation
        <Card className="rounded-xl shadow-lg border-l-4 border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-primary"><Info className="h-5 w-5" /> Route Creation Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-foreground/90">
              To create a high-quality route, we recommend using Google Maps for its planning features.
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-foreground/80">
              <li>Open <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Google Maps <ExternalLink className="inline h-4 w-4"/></a>.</li>
              <li>Plan your route, then generate a shareable link (starting with {VALID_MAPS_LINK_PREFIX}).</li>
              <li>Return here and choose "Share Existing Route" to submit your link.</li>
            </ol>
            <div className="mt-4 p-4 rounded-md bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-200 shadow-sm">
                <div className="flex items-start gap-3">
                    <Lightbulb className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                    <h4 className="font-semibold text-blue-800">Pro Tip: Adding Detail</h4>
                    <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                        For the best experience, make your route descriptive. Include notes about specific cultural spots, historical significance, or unique features along the way. This helps others appreciate the journey!
                    </p>
                    </div>
                </div>
            </div>
            <p className="text-foreground/90 pt-2">
              Alternatively, describe your route in the form below if you don't have a Google Maps link.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="routeName" className="text-base">Route Name</Label>
              <Input id="routeName" placeholder="e.g., Historic Downtown Walk" value={routeName} onChange={(e) => setRouteName(e.target.value)} required className="py-3" disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routeDescription" className="text-base">Route Description</Label>
              <Textarea id="routeDescription" placeholder="A brief description of your route..." value={routeDescription} onChange={(e) => setRouteDescription(e.target.value)} rows={3} required disabled={isLoading}/>
            </div>

            {isShareLike && (
              <div className="space-y-2">
                <Label htmlFor="googleMapsLink" className="text-base">Google Maps Link</Label>
                <Input id="googleMapsLink" type="url" placeholder={`${VALID_MAPS_LINK_PREFIX}...`} value={googleMapsLink} onChange={handleLinkPaste} required={mode==='share'} className="py-3" disabled={isLoading}/>
                <p className="text-xs text-muted-foreground">Must start with '{VALID_MAPS_LINK_PREFIX}'.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="routeImage" className="text-base">Route Image (Optional)</Label>
              <Input id="routeImage" type="file" accept="image/*" onChange={handleImageUpload} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isLoading}/>
              <p className="text-xs text-muted-foreground">Max 5MB. {isShareLike ? "Replaces map preview if uploaded." : "A default image will be used if none provided."}</p>
            </div>

            {currentPreviewUrl && (
              <div className="space-y-2">
                <Label className="text-base">Route Preview</Label>
                <div className="border border-border rounded-lg overflow-hidden aspect-video relative group">
                  <Image src={currentPreviewUrl} alt="Route Preview" width={600} height={300} className="object-cover w-full h-full" data-ai-hint={uploadedImageDataUrl ? "user uploaded image" : "map preview"} />
                  {uploadedImageDataUrl && (
                    <Button variant="destructive" size="icon" onClick={removeUploadedImage} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove uploaded image" disabled={isLoading}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="isCulturalRoute" checked={isCulturalRoute} onCheckedChange={(checked) => setIsCulturalRoute(Boolean(checked))} disabled={isLoading} />
              <Label htmlFor="isCulturalRoute" className="text-sm font-medium">This is a Cultural Route</Label>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>Cancel</Button>
              <Button type="submit" className={`${primaryButtonClass} flex items-center gap-2`} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : submitIcon}
                {isLoading ? "Saving..." : submitText}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
