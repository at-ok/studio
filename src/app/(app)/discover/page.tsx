"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Clock, Users, Loader2 } from "lucide-react";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from 'next/link';

// Route type definition
interface DiscoverRoute {
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
  mapPosition?: { top: string; left: string };
  googleMapsLink?: string;
}

const SHARED_ROUTES_LS_KEY = 'userSharedRoutes';

// Mock data for routes
const mockRoutes: DiscoverRoute[] = [
  {
    id: "mock-1",
    title: "Ancient Temple Trail",
    description: "Explore historic temples and serene landscapes. A journey through time.",
    imageUrl: "https://picsum.photos/seed/temple/600/400",
    imageHint: "temple landscape",
    tags: ["History", "Nature", "Cultural"],
    rating: 4.5,
    reviews: 120,
    duration: "3 hours",
    creator: "Culture Enthusiast",
    isCulturalRoute: true,
    startPoint: "Central Park",
    mapPosition: { top: '25%', left: '30%' },
  },
  {
    id: "mock-2",
    title: "Urban Art Walk",
    description: "Discover vibrant street art and modern galleries in the city's art district.",
    imageUrl: "https://picsum.photos/seed/art/600/400",
    imageHint: "street art",
    tags: ["Art", "City", "Modern"],
    rating: 4.8,
    reviews: 250,
    duration: "2 hours",
    creator: "City Explorer",
    isCulturalRoute: false,
    startPoint: "Downtown Plaza",
    mapPosition: { top: '60%', left: '65%' },
  },
  {
    id: "mock-3",
    title: "Seaside Heritage Path",
    description: "A scenic coastal walk featuring old fishing villages and maritime history.",
    imageUrl: "https://picsum.photos/seed/seaside/600/400",
    imageHint: "coastal village",
    tags: ["Coastal", "History", "Scenic"],
    rating: 4.2,
    reviews: 95,
    duration: "2.5 hours",
    creator: "Local Historian",
    isCulturalRoute: true,
    startPoint: "Old Harbor",
    mapPosition: { top: '45%', left: '15%' },
  },
];

export default function DiscoverPage() {
  const [displayedRoutes, setDisplayedRoutes] = useState<DiscoverRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      const storedUserRoutesRaw = localStorage.getItem(SHARED_ROUTES_LS_KEY);
      const storedUserRoutes: DiscoverRoute[] = storedUserRoutesRaw ? JSON.parse(storedUserRoutesRaw) : [];
      
      // Combine user routes with mock routes, ensuring user routes are prioritized and mock routes are filtered if IDs overlap
      const uniqueMockRoutes = mockRoutes.filter(mr => !storedUserRoutes.some(ur => ur.id === mr.id));
      setDisplayedRoutes([...storedUserRoutes, ...uniqueMockRoutes]);
    } else {
      // Fallback for SSR or environments without localStorage
      setDisplayedRoutes(mockRoutes);
    }
    setIsLoading(false);
  }, []);

  const filteredRoutes = displayedRoutes.filter(route => 
    route.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Loading routes...</p></div>;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Discover Routes</h1>
        <p className="text-muted-foreground">Find your next adventure. Explore routes shared by our community.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Search routes by name, location, or tags..." 
          className="w-full pl-10 pr-4 py-3 rounded-lg shadow-sm border-border focus-visible:ring-primary" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Route Starting Points</h2>
        <Card className="rounded-xl shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="relative w-full aspect-[16/9] md:aspect-[2.5/1] bg-muted">
              <Image
                src="https://picsum.photos/seed/routemap/1200/480"
                alt="Map of nearby routes"
                fill={true}
                style={{objectFit:"cover"}}
                data-ai-hint="abstract map"
                className="opacity-70"
              />
              <TooltipProvider>
                {/* Only display pins for routes that have mapPosition data */}
                {displayedRoutes.filter(route => route.mapPosition).map(route => (
                  <Tooltip key={`map-pin-${route.id}`} delayDuration={100}>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute p-1 bg-primary rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                        style={{ 
                          top: route.mapPosition!.top,  // Added non-null assertion as we filter
                          left: route.mapPosition!.left, // Added non-null assertion
                          transform: 'translate(-50%, -50%)' 
                        }}
                        aria-label={`Location pin for ${route.title}`}
                      >
                        <MapPin className="h-6 w-6 text-primary-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-background border-border shadow-xl rounded-md">
                      <p className="font-semibold text-foreground">{route.title}</p>
                      <p className="text-sm text-muted-foreground">Starts at: {route.startPoint}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
          {searchTerm ? `Search Results (${filteredRoutes.length})` : `Popular & New Routes (${filteredRoutes.length})`}
        </h2>
        {filteredRoutes.length === 0 && (
          <p className="text-muted-foreground">
            No routes found matching your criteria. Try a different search or <Link href="/create" className="text-primary hover:underline">share a new route</Link>!
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
              <CardHeader className="p-0 relative">
                <Image 
                  src={route.imageUrl} 
                  alt={route.title} 
                  width={600} 
                  height={400} 
                  className="object-cover w-full h-48"
                  data-ai-hint={route.imageHint}
                />
                {route.isCulturalRoute && (
                  <Badge variant="default" className="absolute top-3 right-3 bg-primary text-primary-foreground">Cultural Route</Badge>
                )}
              </CardHeader>
              <CardContent className="p-6 flex-grow">
                <CardTitle className="text-xl font-semibold mb-2 text-foreground">{route.title}</CardTitle>
                <CardDescription className="text-muted-foreground text-sm mb-3 line-clamp-3 h-12">{route.description}</CardDescription> {/* Fixed height for consistency */}
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <MapPin className="h-4 w-4 mr-1.5 text-primary" /> Starts at {route.startPoint}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1.5 text-primary" /> Approx. {route.duration}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {route.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-6 bg-muted/30 flex justify-between items-center">
                <div className="flex items-center">
                   {route.rating !== null ? (
                    <>
                      <Star className="h-5 w-5 text-accent mr-1" fill="hsl(var(--accent))" />
                      <span className="font-semibold text-foreground">{route.rating}</span>
                      <span className="text-muted-foreground text-sm ml-1">({route.reviews} reviews)</span>
                    </>
                  ) : (
                     <span className="text-muted-foreground text-sm">No reviews yet</span>
                  )}
                </div>
                <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Link href={`/route/${route.id}`}>View Route</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
