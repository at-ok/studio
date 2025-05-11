
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Clock, Users, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

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
  startPoint: string; // Text description of start point
  startPointCoords?: { lat: number; lng: number }; // Geographic coordinates
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
    startPoint: "Central Park Entrance",
    startPointCoords: { lat: 35.6895, lng: 139.6917 }, // Example: Tokyo Imperial Palace area
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
    startPoint: "Shibuya Crossing",
    startPointCoords: { lat: 35.6595, lng: 139.7006 }, // Example: Shibuya Crossing
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
    startPoint: "Kamakura Beach",
    startPointCoords: { lat: 35.3060, lng: 139.5470 }, // Example: Kamakura
  },
];

const mapContainerStyle = {
  width: '100%',
  height: '400px', // Adjust height as needed
};

// Default center (e.g., Tokyo)
const defaultCenter = {
  lat: 35.6895,
  lng: 139.6917,
};

export default function DiscoverPage() {
  const [displayedRoutes, setDisplayedRoutes] = useState<DiscoverRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<DiscoverRoute | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);


  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(userLocation);
          mapInstance.setCenter(userLocation);
          mapInstance.setZoom(14); // Zoom in more when current location is available
        },
        () => {
          // Handle error or if user denies location access
          // Fallback to default center and zoom
          mapInstance.setCenter(defaultCenter);
          mapInstance.setZoom(12); 
          console.warn("User location not available or denied. Using default map center.");
        }
      );
    } else {
      // Geolocation not supported
      mapInstance.setCenter(defaultCenter);
      mapInstance.setZoom(12); 
      console.warn("Geolocation is not supported by this browser. Using default map center.");
    }
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      const storedUserRoutesRaw = localStorage.getItem(SHARED_ROUTES_LS_KEY);
      const storedUserRoutes: DiscoverRoute[] = storedUserRoutesRaw ? JSON.parse(storedUserRoutesRaw) : [];
      
      const uniqueMockRoutes = mockRoutes.filter(mr => !storedUserRoutes.some(ur => ur.id === mr.id));
      setDisplayedRoutes([...storedUserRoutes, ...uniqueMockRoutes]);
    } else {
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

  // Ensure the API key is set. If not, you might want to display a message or a fallback.
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!googleMapsApiKey) {
      console.warn("Google Maps API key is not set (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY). Map functionality will be limited.");
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
            {googleMapsApiKey ? (
              <LoadScript googleMapsApiKey={googleMapsApiKey}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={currentLocation || defaultCenter}
                  zoom={currentLocation ? 14 : 12} // Use more zoomed in if location available
                  onLoad={onMapLoad}
                  onUnmount={onMapUnmount}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                  }}
                >
                  {filteredRoutes.map(route => (
                    route.startPointCoords && (
                      <Marker
                        key={`map-pin-${route.id}`}
                        position={route.startPointCoords}
                        onClick={() => setSelectedRoute(route)}
                        title={route.title}
                      />
                    )
                  ))}
                  {selectedRoute && selectedRoute.startPointCoords && (
                    <InfoWindow
                      position={selectedRoute.startPointCoords}
                      onCloseClick={() => setSelectedRoute(null)}
                    >
                      <div className="p-1">
                        <h3 className="font-semibold text-foreground mb-1">{selectedRoute.title}</h3>
                        <p className="text-xs text-muted-foreground mb-2">Starts at: {selectedRoute.startPoint}</p>
                        <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary hover:underline">
                           <Link href={`/route/${selectedRoute.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            ) : (
              <div className="w-full aspect-[16/9] md:aspect-[2.5/1] bg-muted flex items-center justify-center rounded-lg">
                <MapPin className="h-10 w-10 text-muted-foreground mr-3" />
                <div>
                    <p className="font-semibold text-foreground">Map Preview Unavailable</p>
                    <p className="text-sm text-muted-foreground">Google Maps API key is missing or invalid.</p>
                </div>
              </div>
            )}
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
                <CardDescription className="text-muted-foreground text-sm mb-3 line-clamp-3 h-[3.75rem]">{/* approx 3 lines with line-height 1.25rem */ route.description}</CardDescription>
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
