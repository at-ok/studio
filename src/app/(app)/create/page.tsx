"use client";

import { useState, type FormEvent, useEffect, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Route, Info, ExternalLink, Lightbulb, Trash2, Edit, Save, MapPin } from "lucide-react";
import Image from "next/image";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type CreateMode = 'options' | 'share' | 'new' | 'edit';

interface SharedRoute {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  tags: string[];
  rating: number | null;
  reviews: number;
  duration: string;
  creator: string;
  isCulturalRoute: boolean;
  startPoint: string;
  googleMapsLink?: string;
}

const SHARED_ROUTES_LS_KEY = 'userSharedRoutes';
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
  const [routeToEdit, setRouteToEdit] = useState<SharedRoute | null>(null);
  const [isLoadingEditData, setIsLoadingEditData] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsLoadingEditData(true);
      if (typeof window !== 'undefined') {
        const existingRoutesRaw = localStorage.getItem(SHARED_ROUTES_LS_KEY);
        const existingRoutes: SharedRoute[] = existingRoutesRaw ? JSON.parse(existingRoutesRaw) : [];
        const foundRoute = existingRoutes.find(r => r.id === editId);
        
        if (foundRoute) {
          setRouteToEdit(foundRoute);
          setEditingRouteId(foundRoute.id);
          setRouteName(foundRoute.title);
          setRouteDescription(foundRoute.description);
          setGoogleMapsLink(foundRoute.googleMapsLink || '');
          setIsCulturalRoute(foundRoute.isCulturalRoute);

          if (foundRoute.imageUrl && !foundRoute.imageUrl.startsWith('https://picsum.photos')) {
            setUploadedImageDataUrl(foundRoute.imageUrl);
            setPicsumPreviewUrl(null);
          } else if (foundRoute.googleMapsLink?.startsWith(VALID_MAPS_LINK_PREFIX)) {
            setPicsumPreviewUrl(`https://picsum.photos/seed/${encodeURIComponent(foundRoute.googleMapsLink)}/600/300`);
            setUploadedImageDataUrl(null);
          } else if (foundRoute.imageUrl.startsWith('https://picsum.photos')) {
             setPicsumPreviewUrl(foundRoute.imageUrl);
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
      }
      setIsLoadingEditData(false);
    }
  }, [searchParams, toast, router]);

  useEffect(() => {
    if (mode === 'options' && !isLoadingEditData) {
      setGoogleMapsLink('');
      setPicsumPreviewUrl(null);
      setUploadedImageDataUrl(null);
      setRouteName('');
      setRouteDescription('');
      setIsCulturalRoute(false);
      setEditingRouteId(null);
      setRouteToEdit(null);
    }
  }, [mode, isLoadingEditData]);


  const addRouteToLocalStorage = (newRoute: SharedRoute) => {
    if (typeof window !== 'undefined') {
      try {
        const existingRoutesRaw = localStorage.getItem(SHARED_ROUTES_LS_KEY);
        const existingRoutes: SharedRoute[] = existingRoutesRaw ? JSON.parse(existingRoutesRaw) : [];
        if (existingRoutes.some(r => r.title === newRoute.title)) {
            toast({
                variant: "destructive",
                title: "Route already shared",
                description: "A route with this title has already been shared locally.",
            });
            return false;
        }
        localStorage.setItem(SHARED_ROUTES_LS_KEY, JSON.stringify([...existingRoutes, newRoute]));
        return true;
      } catch (error) {
        console.error("Error saving route to localStorage:", error);
        toast({
          variant: "destructive",
          title: "Storage Error",
          description: "Could not save the route locally.",
        });
        return false;
      }
    }
    return false;
  };

  const handleLinkPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
    const link = e.target.value;
    setGoogleMapsLink(link);

    if (!uploadedImageDataUrl) {
      if (link.startsWith(VALID_MAPS_LINK_PREFIX)) {
        setPicsumPreviewUrl(`https://picsum.photos/seed/${encodeURIComponent(link)}/600/300`);
      } else {
        setPicsumPreviewUrl(null);
        if (link.trim() !== '' && !link.startsWith(VALID_MAPS_LINK_PREFIX)) {
          toast({
            variant: "destructive",
            title: "Invalid Google Maps Link",
            description: `Route link must start with '${VALID_MAPS_LINK_PREFIX}'.`,
          });
        }
      }
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Image too large", description: "Please upload an image smaller than 5MB." });
        event.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageDataUrl(reader.result as string);
        setPicsumPreviewUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImageDataUrl(null);
    if (googleMapsLink.startsWith(VALID_MAPS_LINK_PREFIX)) {
      setPicsumPreviewUrl(`https://picsum.photos/seed/${encodeURIComponent(googleMapsLink)}/600/300`);
    } else {
      setPicsumPreviewUrl(null);
    }
  };

  const handleSubmitSharedRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleMapsLink.startsWith(VALID_MAPS_LINK_PREFIX)) {
      toast({ variant: "destructive", title: "Invalid Google Maps Link", description: `Please provide a valid Google Maps link starting with '${VALID_MAPS_LINK_PREFIX}'.` });
      return;
    }
    if (!routeName || !routeDescription) {
      toast({ variant: "destructive", title: "Missing Information", description: "Route name and description are required." });
      return;
    }

    let finalImageUrl = uploadedImageDataUrl || picsumPreviewUrl || `https://picsum.photos/seed/${encodeURIComponent(routeName || 'shared_route')}/600/400`;
    let finalImageHint = uploadedImageDataUrl ? "user uploaded" : (picsumPreviewUrl ? "map preview" : "generic route image");

    const newRoute: SharedRoute = {
      id: `user_shared_${Date.now()}`, title: routeName, description: routeDescription, imageUrl: finalImageUrl, imageHint: finalImageHint,
      tags: isCulturalRoute ? ["Cultural", "Shared Map"] : ["Shared Map"], rating: null, reviews: 0, duration: "Varies",
      creator: "You (Shared)", isCulturalRoute, startPoint: "From Google Maps", googleMapsLink: googleMapsLink,
    };
    
    if(addRouteToLocalStorage(newRoute)) {
        toast({ title: "Route Shared!", description: `${routeName} has been added to your local shared routes.` });
        setMode('options');
    }
  };
  
  const handleCreateNewRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName || !routeDescription) {
      toast({ variant: "destructive", title: "Missing Information", description: "Route name and description are required." });
      return;
    }
    const newRoute: SharedRoute = {
      id: `user_created_${Date.now()}`, title: routeName, description: routeDescription,
      imageUrl: uploadedImageDataUrl || `https://picsum.photos/seed/${encodeURIComponent(routeName || 'custom_route')}/600/400`,
      imageHint: uploadedImageDataUrl ? "user uploaded" : "custom community route",
      tags: isCulturalRoute ? ["Cultural", "Custom"] : ["Custom"], rating: null, reviews: 0, duration: "User Defined",
      creator: "You (Created)", isCulturalRoute, startPoint: "User Described",
    };

    if(addRouteToLocalStorage(newRoute)) {
        toast({ title: "Route Created!", description: `${routeName} has been added to your local routes.` });
        setMode('options');
    }
  };

  const handleUpdateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRouteId || !routeToEdit) {
      toast({ variant: "destructive", title: "Error", description: "No route selected for update." });
      return;
    }
    if (routeToEdit.googleMapsLink && !googleMapsLink.startsWith(VALID_MAPS_LINK_PREFIX)) {
      toast({ variant: "destructive", title: "Invalid Google Maps Link", description: `Link must start with '${VALID_MAPS_LINK_PREFIX}'.` });
      return;
    }
    if (!routeName || !routeDescription) {
      toast({ variant: "destructive", title: "Missing Information", description: "Route name and description are required." });
      return;
    }

    let finalImageUrl = uploadedImageDataUrl || picsumPreviewUrl;
    if (!finalImageUrl) {
        finalImageUrl = routeToEdit.googleMapsLink 
            ? `https://picsum.photos/seed/${encodeURIComponent(routeToEdit.googleMapsLink)}/600/300` 
            : `https://picsum.photos/seed/${encodeURIComponent(routeName || 'custom_route')}/600/400`;
    }
    let finalImageHint = uploadedImageDataUrl ? "user uploaded" 
                        : (picsumPreviewUrl && routeToEdit.googleMapsLink ? "map preview" 
                        : (picsumPreviewUrl ? "custom community route" : "generic route image"));

    const updatedRoute: SharedRoute = {
      ...routeToEdit, title: routeName, description: routeDescription,
      googleMapsLink: routeToEdit.googleMapsLink ? googleMapsLink : undefined,
      isCulturalRoute, imageUrl: finalImageUrl, imageHint: finalImageHint,
      tags: isCulturalRoute 
          ? (routeToEdit.googleMapsLink ? ["Cultural", "Shared Map"] : ["Cultural", "Custom"])
          : (routeToEdit.googleMapsLink ? ["Shared Map"] : ["Custom"]),
    };

    if (typeof window !== 'undefined') {
      try {
        const existingRoutesRaw = localStorage.getItem(SHARED_ROUTES_LS_KEY);
        let existingRoutes: SharedRoute[] = existingRoutesRaw ? JSON.parse(existingRoutesRaw) : [];
        if (existingRoutes.some(r => r.title === updatedRoute.title && r.id !== editingRouteId)) {
            toast({ variant: "destructive", title: "Route title exists", description: "A route with this title already exists." });
            return;
        }
        const routeIndex = existingRoutes.findIndex(r => r.id === editingRouteId);
        if (routeIndex === -1) {
          toast({ variant: "destructive", title: "Error", description: "Original route not found." });
          return;
        }
        existingRoutes[routeIndex] = updatedRoute;
        localStorage.setItem(SHARED_ROUTES_LS_KEY, JSON.stringify(existingRoutes));
        toast({ title: "Route Updated!", description: `${routeName} has been successfully updated.` });
        router.push('/my-page'); // Navigate after successful update
      } catch (error) {
        console.error("Error updating route:", error);
        toast({ variant: "destructive", title: "Storage Error", description: "Could not update the route." });
      }
    }
  };

  const handleCancel = () => {
    if (mode === 'edit') {
      router.push('/my-page');
    } else {
      setMode('options');
      router.push('/create', {scroll: false}); // Clear query params
    }
  };

  const currentPreviewUrl = uploadedImageDataUrl || picsumPreviewUrl;

  if (isLoadingEditData) {
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
  const isShareLike = (isEditMode && routeToEdit?.googleMapsLink) || mode === 'share';
  const isNewLike = (isEditMode && !routeToEdit?.googleMapsLink) || mode === 'new';

  let pageTitle = "";
  let submitIcon = <Route className="h-5 w-5" />;
  let submitText = "";
  let submitHandler: (e: FormEvent) => void = () => {};
  let primaryButtonClass = "bg-accent hover:bg-accent/90 text-accent-foreground";

  if (isEditMode) {
    pageTitle = `Edit Route: ${routeToEdit?.title}`;
    submitIcon = <Save className="h-5 w-5" />;
    submitText = "Update Route";
    submitHandler = handleUpdateRoute;
    primaryButtonClass = routeToEdit?.googleMapsLink ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-accent hover:bg-accent/90 text-accent-foreground";
  } else if (isShareLike) {
    pageTitle = "Share Google Maps Route";
    submitIcon = <Share2 className="h-5 w-5" />;
    submitText = "Share Route";
    submitHandler = handleSubmitSharedRoute;
    primaryButtonClass = "bg-primary hover:bg-primary/90 text-primary-foreground";
  } else if (isNewLike) {
    pageTitle = "Create a New Route";
    submitIcon = <Route className="h-5 w-5" />;
    submitText = "Create Route";
    submitHandler = handleCreateNewRoute;
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
          {isEditMode ? "Cancel" : "Back to Options"}
        </Button>
      </header>

      {isNewLike && !isEditMode && ( // Show guide only for 'new' mode, not 'edit' custom route
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
                <div className="mt-4 p-4 rounded-md bg-background/70 border border-border shadow-sm">
                  <div className="flex items-start gap-3">
                      <Lightbulb className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                      <h4 className="font-semibold text-primary">Pro Tip: Adding Detail</h4>
                      <p className="text-xs text-foreground/80 mt-1">
                          Make your route descriptive! Include notes about cultural spots, history, or unique features. This helps others appreciate the journey.
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
        <form onSubmit={submitHandler}>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="routeName" className="text-base">Route Name</Label>
              <Input id="routeName" placeholder="e.g., Historic Downtown Walk" value={routeName} onChange={(e) => setRouteName(e.target.value)} required className="py-3"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="routeDescription" className="text-base">Route Description</Label>
              <Textarea id="routeDescription" placeholder="A brief description of your route..." value={routeDescription} onChange={(e) => setRouteDescription(e.target.value)} rows={3} required/>
            </div>

            {isShareLike && (
              <div className="space-y-2">
                <Label htmlFor="googleMapsLink" className="text-base">Google Maps Link</Label>
                <Input id="googleMapsLink" type="url" placeholder={`${VALID_MAPS_LINK_PREFIX}...`} value={googleMapsLink} onChange={handleLinkPaste} required={mode==='share'} className="py-3"/>
                <p className="text-xs text-muted-foreground">Must start with '{VALID_MAPS_LINK_PREFIX}'.</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="routeImage" className="text-base">Route Image (Optional)</Label>
              <Input id="routeImage" type="file" accept="image/*" onChange={handleImageUpload} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
              <p className="text-xs text-muted-foreground">Max 5MB. {isShareLike ? "Replaces map preview if uploaded." : "A default image will be used if none provided."}</p>
            </div>

            {currentPreviewUrl && (
              <div className="space-y-2">
                <Label className="text-base">Route Preview</Label>
                <div className="border border-border rounded-lg overflow-hidden aspect-video relative group">
                  <Image src={currentPreviewUrl} alt="Route Preview" width={600} height={300} className="object-cover w-full h-full" data-ai-hint={uploadedImageDataUrl ? "user uploaded image" : "map preview"} />
                  {uploadedImageDataUrl && (
                    <Button variant="destructive" size="icon" onClick={removeUploadedImage} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove uploaded image">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="isCulturalRoute" checked={isCulturalRoute} onCheckedChange={(checked) => setIsCulturalRoute(Boolean(checked))} />
              <Label htmlFor="isCulturalRoute" className="text-sm font-medium">This is a Cultural Route</Label>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button type="submit" className={`${primaryButtonClass} flex items-center gap-2`}>
                {submitIcon} {submitText}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}