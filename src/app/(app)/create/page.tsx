tsx
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Route, Info, ExternalLink, Map } from "lucide-react";
import Image from "next/image";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

type CreateMode = 'options' | 'share' | 'new';

// Define a structure for the routes consistent with DiscoverPage
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
  // mapPosition?: { top: string; left: string }; // mapPosition is hard to generate client-side
}

const SHARED_ROUTES_LS_KEY = 'userSharedRoutes';

export default function CreatePage() {
  const [mode, setMode] = useState<CreateMode>('options');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [routePreview, setRoutePreview] = useState<string | null>(null);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [isCulturalRoute, setIsCulturalRoute] = useState(false);
  const { toast } = useToast();

  // Effect to clear form state when mode changes back to options
  useEffect(() => {
    if (mode === 'options') {
      setGoogleMapsLink('');
      setRoutePreview(null);
      setRouteName('');
      setRouteDescription('');
      setIsCulturalRoute(false);
    }
  }, [mode]);


  const addRouteToLocalStorage = (newRoute: SharedRoute) => {
    if (typeof window !== 'undefined') {
      try {
        const existingRoutesRaw = localStorage.getItem(SHARED_ROUTES_LS_KEY);
        const existingRoutes: SharedRoute[] = existingRoutesRaw ? JSON.parse(existingRoutesRaw) : [];
        // Avoid adding duplicates by title, simplistic check
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
    setGoogleMapsLink(e.target.value);
    if (e.target.value.startsWith("https://maps.google.com/") || e.target.value.startsWith("https://www.google.com/maps/")) {
      setRoutePreview(`https://picsum.photos/seed/${encodeURIComponent(e.target.value)}/600/300`);
    } else {
      setRoutePreview(null);
    }
  };

  const handleSubmitSharedRoute = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoute: SharedRoute = {
      id: `user_shared_${Date.now()}`,
      title: routeName,
      description: routeDescription,
      imageUrl: routePreview || `https://picsum.photos/seed/${encodeURIComponent(routeName)}/600/400`,
      imageHint: "shared map route",
      tags: isCulturalRoute ? ["Cultural", "Shared Map"] : ["Shared Map"],
      rating: null,
      reviews: 0,
      duration: "Varies",
      creator: "You (Shared)",
      isCulturalRoute,
      startPoint: "From Google Maps",
      googleMapsLink: googleMapsLink,
    };
    
    if(addRouteToLocalStorage(newRoute)) {
        toast({
            title: "Route Shared!",
            description: `${routeName} has been added to your local shared routes.`,
        });
        setMode('options');
    }
  };
  
  const handleCreateNewRoute = (e: React.FormEvent) => {
    e.preventDefault();
     const newRoute: SharedRoute = {
      id: `user_created_${Date.now()}`,
      title: routeName,
      description: routeDescription,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(routeName)}/600/400`,
      imageHint: "custom community route",
      tags: isCulturalRoute ? ["Cultural", "Custom"] : ["Custom"],
      rating: null,
      reviews: 0,
      duration: "User Defined",
      creator: "You (Created)",
      isCulturalRoute,
      startPoint: "User Described",
    };

    if(addRouteToLocalStorage(newRoute)) {
        toast({
            title: "Route Created!",
            description: `${routeName} has been added to your local routes.`,
        });
        setMode('options');
    }
  };

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
              <CardTitle className="flex items-center gap-2 text-xl">
                <Share2 className="h-6 w-6 text-primary" /> Share Existing Route
              </CardTitle>
              <CardDescription>
                Already have a route planned on Google Maps? Share the link here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setMode('share')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Share Google Maps Route
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-300 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Route className="h-6 w-6 text-accent" /> Create New Route
              </CardTitle>
              <CardDescription>
                Use our tools or get guidance to create a brand new route.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setMode('new')} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Create a New Route
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (mode === 'share') {
    return (
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Share Google Maps Route</h1>
            <p className="text-muted-foreground">Paste your Google Maps route link below.</p>
          </div>
          <Button variant="outline" onClick={() => setMode('options')}>Back to Options</Button>
        </header>
        <Card className="rounded-xl shadow-lg">
          <form onSubmit={handleSubmitSharedRoute}>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="routeName" className="text-base">Route Name</Label>
                <Input 
                  id="routeName" 
                  placeholder="e.g., Historic Downtown Walk" 
                  value={routeName} 
                  onChange={(e) => setRouteName(e.target.value)}
                  required 
                  className="py-3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="routeDescription" className="text-base">Route Description</Label>
                <Textarea 
                  id="routeDescription" 
                  placeholder="A brief description of your route, what makes it special, etc." 
                  value={routeDescription}
                  onChange={(e) => setRouteDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="googleMapsLink" className="text-base">Google Maps Link</Label>
                <Input 
                  id="googleMapsLink" 
                  type="url" 
                  placeholder="https://maps.google.com/..." 
                  value={googleMapsLink} 
                  onChange={handleLinkPaste} 
                  required 
                  className="py-3"
                />
              </div>

              {routePreview && (
                <div className="space-y-2">
                  <Label className="text-base">Route Preview</Label>
                  <div className="border border-border rounded-lg overflow-hidden aspect-video">
                    <Image src={routePreview} alt="Route Preview" width={600} height={300} className="object-cover w-full h-full" data-ai-hint="map preview" />
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="isCulturalRoute" checked={isCulturalRoute} onCheckedChange={(checked) => setIsCulturalRoute(Boolean(checked))} />
                <Label htmlFor="isCulturalRoute" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  This is a Cultural Route (e.g., focuses on local traditions, history, art)
                </Label>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setMode('options')}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2">
                  <Share2 className="h-5 w-5" /> Share Route
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    );
  }

  if (mode === 'new') {
    return (
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Create a New Route</h1>
            <p className="text-muted-foreground">Design your own unique cultural journey.</p>
          </div>
          <Button variant="outline" onClick={() => setMode('options')}>Back to Options</Button>
        </header>

        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info className="h-6 w-6 text-primary" /> Route Creation Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To create a high-quality route, we recommend using Google Maps for its powerful route planning features.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-foreground">
              <li>Open <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Google Maps <ExternalLink className="inline h-4 w-4"/></a> in a new tab or its app.</li>
              <li>Plan your route by adding desired waypoints and spots.</li>
              <li>Once your route is finalized, generate a shareable link for it.</li>
              <li>Come back here and choose "Share Existing Route" to submit your link.</li>
            </ol>
            
            <div className="bg-accent text-accent-foreground p-6 rounded-lg shadow-md border-l-4 border-accent-foreground">
              <div className="flex items-start">
                <Map className="h-6 w-6 text-accent-foreground mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-accent-foreground">Pro Tip: Adding Detail</h4>
                  <p className="text-sm text-accent-foreground/90">
                    For the best experience, make your route descriptive. Include notes about specific cultural spots, historical significance, or unique features along the way. This helps others appreciate the journey!
                  </p>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground pt-4">
              Alternatively, you can describe your route below. Providing a Google Maps link is preferred for accuracy if possible.
            </p>
            
            <form onSubmit={handleCreateNewRoute} className="space-y-6 pt-4 border-t border-border">
               <div className="space-y-2">
                <Label htmlFor="newRouteName" className="text-base">Route Name</Label>
                <Input 
                  id="newRouteName" 
                  placeholder="e.g., Artisans of Old Town" 
                  value={routeName} 
                  onChange={(e) => setRouteName(e.target.value)}
                  required 
                  className="py-3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newRouteDescription" className="text-base">Route Description & Spots</Label>
                <Textarea 
                  id="newRouteDescription" 
                  placeholder="Describe your route in detail. List key spots, their significance, and any tips for travelers." 
                  value={routeDescription}
                  onChange={(e) => setRouteDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="newIsCulturalRoute" checked={isCulturalRoute} onCheckedChange={(checked) => setIsCulturalRoute(Boolean(checked))} />
                <Label htmlFor="newIsCulturalRoute" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  This is a Cultural Route
                </Label>
              </div>
               <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setMode('options')}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground flex items-center gap-2">
                  <Route className="h-5 w-5" /> Create Route
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null; // Should not happen
}
