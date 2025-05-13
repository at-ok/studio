
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Clock, Users, Loader2, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { getAllRoutes, type RouteData } from '@/lib/firestoreService'; // Import Firestore service
import type { Timestamp } from 'firebase/firestore';

// Client-side representation, converting Timestamps if needed
interface DiscoverRouteClient extends Omit<RouteData, 'createdAt' | 'updatedAt'> {
  id: string; // Ensure ID is always present
  createdAt?: string;
  updatedAt?: string;
  // Add derived/client-specific fields if necessary
  creator?: { // Match structure used in cards if needed
        name: string;
        avatarUrl?: string;
        avatarHint?: string;
      }; 
}

// Default center (e.g., Tokyo) - Use a broader view initially
const defaultCenter = {
  lat: 35.68, // Slightly less precise for broader initial view
  lng: 139.76,
};

const mapContainerStyle = {
  width: '100%',
  height: '400px', // Adjust height as needed
};

export default function DiscoverPage() {
  const [allRoutes, setAllRoutes] = useState<DiscoverRouteClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<DiscoverRouteClient | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);


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
        (error) => {
           console.warn("Geolocation error:", error.message);
          // Handle error or if user denies location access
          // Fallback to default center and zoom
          mapInstance.setCenter(defaultCenter);
          mapInstance.setZoom(12); // Wider zoom for default
          setMapError("Could not get current location. Showing default area.");
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 } // Options for geolocation
      );
    } else {
      // Geolocation not supported
      mapInstance.setCenter(defaultCenter);
      mapInstance.setZoom(12); // Wider zoom for default
      console.warn("Geolocation is not supported by this browser. Using default map center.");
      setMapError("Geolocation not supported by this browser.");
    }
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Fetch all routes from Firestore
  useEffect(() => {
    const fetchRoutes = async () => {
        setIsLoading(true);
        setMapError(null); // Reset map error on fetch
        try {
            const routesFromDb = await getAllRoutes();
             // Map Firestore data to client-side structure
             const clientRoutes = routesFromDb.map(route => ({
                 ...route,
                  // Convert timestamps if they are strings or Date objects
                 createdAt: typeof route.createdAt === 'string' ? route.createdAt : (route.createdAt as Date)?.toISOString(), 
                 updatedAt: typeof route.updatedAt === 'string' ? route.updatedAt : (route.updatedAt as Date)?.toISOString(),
                 // Populate creator object for card display consistency
                 creator: {
                      name: route.creatorName || 'Unknown Creator',
                      avatarUrl: route.creatorAvatarUrl,
                 }
             }));
            setAllRoutes(clientRoutes);
        } catch (error: any) {
            console.error("Error fetching routes:", error);
            setMapError("Could not load routes. Please try again later."); // Use mapError state for feedback
            setAllRoutes([]); // Clear routes on error
        } finally {
            setIsLoading(false);
        }
    };
    fetchRoutes();
  }, []);

  const filteredRoutes = allRoutes.filter(route =>
    route.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) || // Check if tags exist
    route.startPoint?.toLowerCase().includes(searchTerm.toLowerCase()) // Search by start point text
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Loading routes...</p></div>;
  }

  // Ensure the API key is set. If not, display a message or a fallback.
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Discover Routes</h1>
        <p className="text-muted-foreground">Find your next adventure. Explore routes shared by our community.</p>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search routes by name, description, tag, or start point..."
          className="w-full pl-10 pr-4 py-3 rounded-lg shadow-sm border-border focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Map Section */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Route Starting Points</h2>
        <Card className="rounded-xl shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {googleMapsApiKey ? (
              <LoadScript googleMapsApiKey={googleMapsApiKey} loadingElement={<div className="flex items-center justify-center h-[400px] bg-muted"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading Map...</p></div>} >
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={currentLocation || defaultCenter}
                  zoom={14} // Consistent zoom level
                  onLoad={onMapLoad}
                  onUnmount={onMapUnmount}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false, // Disable fullscreen
                    zoomControlOptions: { // Position zoom control
                         position: google.maps.ControlPosition.RIGHT_BOTTOM,
                    },
                     gestureHandling: 'cooperative' // Better for touch devices
                  }}
                >
                   {/* Marker for current location */}
                   {currentLocation && (
                     <Marker
                         position={currentLocation}
                         title={"Your Location"}
                         icon={{ // Custom icon for user location
                           path: google.maps.SymbolPath.CIRCLE,
                           scale: 8,
                           fillColor: '#4285F4', // Google blue
                           fillOpacity: 1,
                           strokeWeight: 2,
                           strokeColor: 'white',
                         }}
                      />
                   )}

                  {/* Markers for route start points */}
                  {filteredRoutes.map(route => (
                    // Only render marker if startPointCoords exist
                    route.startPointCoords && (
                      <Marker
                        key={`map-pin-${route.id}`}
                        position={route.startPointCoords}
                        onClick={() => setSelectedRoute(route)}
                        title={route.title}
                        // Optional: Add a custom icon for routes
                        // icon={{ url: '/path/to/route-pin-icon.png', scaledSize: new google.maps.Size(30, 30) }}
                      />
                    )
                  ))}

                  {/* InfoWindow for selected route */}
                  {selectedRoute && selectedRoute.startPointCoords && (
                    <InfoWindow
                      position={selectedRoute.startPointCoords}
                      onCloseClick={() => setSelectedRoute(null)}
                       options={{ pixelOffset: new google.maps.Size(0, -30) }} // Offset slightly above pin
                    >
                      <div className="p-1 max-w-xs"> {/* Limit width */}
                        <h3 className="font-semibold text-foreground mb-1 text-sm">{selectedRoute.title}</h3>
                        <p className="text-xs text-muted-foreground mb-2">Starts at: {selectedRoute.startPoint}</p>
                         {selectedRoute.googleMapsLink && (
                             <a href={selectedRoute.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mr-2">
                                Open in Maps <ExternalLink className="h-3 w-3" />
                             </a>
                         )}
                        <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary hover:underline text-xs">
                           <Link href={`/route/${selectedRoute.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            ) : (
              // Fallback if API key is missing
              <div className="w-full h-[400px] bg-muted flex flex-col items-center justify-center rounded-lg text-center p-4">
                <MapPin className="h-10 w-10 text-muted-foreground mb-3" />
                 <p className="font-semibold text-foreground">Map Preview Unavailable</p>
                 <p className="text-sm text-muted-foreground">Google Maps API key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) is missing or invalid.</p>
                 <p className="text-xs text-muted-foreground mt-2">Please provide a valid API key in your environment variables.</p>
              </div>
            )}
            {mapError && <p className="p-4 text-sm text-center text-destructive bg-destructive/10">{mapError}</p>}
          </CardContent>
        </Card>
      </section>

      {/* Route List Section */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
          {searchTerm ? `Search Results (${filteredRoutes.length})` : `All Routes (${filteredRoutes.length})`}
        </h2>
        {filteredRoutes.length === 0 && !isLoading && (
          <p className="text-muted-foreground">
            No routes found{searchTerm ? ' matching your criteria' : ''}. Try searching for something else, or <Link href="/create" className="text-primary hover:underline">share a new route</Link>!
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
              <CardHeader className="p-0 relative">
                <Link href={`/route/${route.id}`} aria-label={`View details for ${route.title}`}>
                    <Image
                    src={route.imageUrl || 'https://picsum.photos/seed/default_route/600/400'} // Fallback image
                    alt={route.title}
                    width={600}
                    height={400}
                    className="object-cover w-full h-48 cursor-pointer"
                    data-ai-hint={route.imageHint || "route image"}
                    unoptimized={route.imageUrl?.includes('picsum.photos')} // Avoid optimizing picsum URLs if used
                    />
                </Link>
                {route.isCulturalRoute && (
                  <Badge variant="default" className="absolute top-3 right-3 bg-primary text-primary-foreground cursor-default">Cultural Route</Badge>
                )}
              </CardHeader>
              <CardContent className="p-6 flex-grow">
                <CardTitle className="text-xl font-semibold mb-2 text-foreground">{route.title}</CardTitle>
                <CardDescription className="text-muted-foreground text-sm mb-3 line-clamp-3 h-[3.75rem]">{route.description}</CardDescription>
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <MapPin className="h-4 w-4 mr-1.5 text-primary flex-shrink-0" /> Starts at {route.startPoint}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1.5 text-primary flex-shrink-0" /> Approx. {route.duration}
                </div>
                 {/* Optional: Display creator */}
                 {route.creator?.name && (
                     <div className="flex items-center text-sm text-muted-foreground mt-1">
                         <Users className="h-4 w-4 mr-1.5 text-primary flex-shrink-0" /> By {route.creator.name}
                     </div>
                 )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {route.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-6 bg-muted/30 flex justify-between items-center border-t"> {/* Added border-t */}
                <div className="flex items-center">
                   {route.rating !== null && route.rating !== undefined ? (
                    <>
                      <Star className="h-5 w-5 text-accent mr-1" fill="hsl(var(--accent))" />
                      <span className="font-semibold text-foreground">{route.rating.toFixed(1)}</span> {/* Format rating */}
                      <span className="text-muted-foreground text-sm ml-1">({route.reviewsCount || 0} reviews)</span>
                    </>
                  ) : (
                     <span className="text-muted-foreground text-sm italic">No reviews yet</span>
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
