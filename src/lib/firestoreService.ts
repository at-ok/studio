
'use server'; // Indicate this runs on the server or can be called from server components/actions

import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Assuming db is exported from your firebase config
import type { User } from "firebase/auth";

// Define the structure for Route data in Firestore
export interface RouteData {
  id?: string; // Firestore ID, optional when creating
  title: string;
  description: string;
  longDescription?: string;
  imageUrl: string;
  imageHint: string;
  tags: string[];
  rating: number | null;
  reviewsCount?: number; // Use reviewsCount consistent with RouteDetail
  duration: string;
  difficulty?: string;
  creatorId: string; // Firebase Auth User UID
  creatorName: string; // Store creator's name for display
  creatorAvatarUrl?: string; // Store avatar URL
  isCulturalRoute: boolean;
  startPoint: string;
  startPointCoords?: { lat: number; lng: number };
  googleMapsLink?: string;
  createdAt: Timestamp | FieldValue; // Use Firestore Timestamp or FieldValue
  updatedAt?: Timestamp | FieldValue;
  // Add other relevant fields from your interfaces (e.g., spots, comments - though comments might be a subcollection)
  // For simplicity, spots and comments are not included in this basic structure yet
}

const routesCollection = collection(db, "routes");

// --- Service Functions ---

/**
 * Adds a new route to Firestore.
 * @param routeData - The data for the new route.
 * @param user - The authenticated Firebase user creating the route.
 * @returns The ID of the newly created route document.
 * @throws If the user is not authenticated or if there's a Firestore error.
 */
export async function addRoute(routeData: Omit<RouteData, 'id' | 'createdAt' | 'creatorId' | 'creatorName' | 'creatorAvatarUrl'>, user: User): Promise<string> {
  if (!user) {
    throw new Error("User must be authenticated to add a route.");
  }

  const newRouteData: Omit<RouteData, 'id'> = {
    ...routeData,
    creatorId: user.uid,
    creatorName: user.displayName || "Anonymous User",
    creatorAvatarUrl: user.photoURL || undefined,
    createdAt: serverTimestamp(), // Use server timestamp
    updatedAt: serverTimestamp(),
    rating: routeData.rating === undefined ? null : routeData.rating, // Ensure consistency
    reviewsCount: 0, // Initialize reviews count
  };

  try {
    const docRef = await addDoc(routesCollection, newRouteData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding route to Firestore:", error);
    // Consider more specific error handling based on Firestore error codes
    throw new Error("Failed to save the route to the database.");
  }
}

/**
 * Fetches a single route by its Firestore document ID.
 * @param routeId - The Firestore document ID of the route.
 * @returns The route data including its ID, or null if not found.
 * @throws If there's a Firestore error.
 */
export async function getRouteById(routeId: string): Promise<(RouteData & { id: string }) | null> {
  try {
    const docRef = doc(db, "routes", routeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Convert Timestamps to string or Date objects if needed for client-side
      const data = docSnap.data() as RouteData;
       const convertTimestamp = (timestamp: Timestamp | FieldValue | undefined) => {
         if (timestamp instanceof Timestamp) {
           return timestamp.toDate().toISOString(); // Or keep as Date object: timestamp.toDate()
         }
         return undefined; // Handle serverTimestamp FieldValue if necessary, might appear as null initially
       }
      
      return { 
        ...data, 
        id: docSnap.id,
        // Ensure timestamps are serializable if passing to client components directly
        createdAt: convertTimestamp(data.createdAt) || new Date().toISOString(), // Provide fallback if server timestamp not resolved
        updatedAt: convertTimestamp(data.updatedAt), 
      };
    } else {
      console.log("No such route document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting route by ID:", error);
    throw new Error("Failed to fetch route details.");
  }
}


/**
 * Fetches all routes created by a specific user.
 * @param userId - The Firebase Auth UID of the user.
 * @returns An array of route data objects (including ID) created by the user, ordered by creation date descending.
 * @throws If there's a Firestore error.
 */
export async function getRoutesByCreator(userId: string): Promise<(RouteData & { id: string })[]> {
   if (!userId) {
      console.warn("getRoutesByCreator called without userId");
      return [];
   }
  try {
    const q = query(
      routesCollection, 
      where("creatorId", "==", userId), 
      orderBy("createdAt", "desc") // Order by creation time, newest first
    );
    const querySnapshot = await getDocs(q);
    const routes: (RouteData & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
       const data = doc.data() as RouteData;
       const convertTimestamp = (timestamp: Timestamp | FieldValue | undefined) => {
         if (timestamp instanceof Timestamp) {
           return timestamp.toDate().toISOString(); 
         }
         return undefined; 
       }
      routes.push({ 
        ...data, 
        id: doc.id,
         createdAt: convertTimestamp(data.createdAt) || new Date().toISOString(), 
        updatedAt: convertTimestamp(data.updatedAt), 
       });
    });
    return routes;
  } catch (error) {
    console.error("Error getting routes by creator:", error);
    throw new Error("Failed to fetch user's routes.");
  }
}

/**
 * Fetches all routes, optionally limited.
 * @param count - Optional limit for the number of routes to fetch.
 * @returns An array of all route data objects (including ID), ordered by creation date descending.
 * @throws If there's a Firestore error.
 */
export async function getAllRoutes(count?: number): Promise<(RouteData & { id: string })[]> {
  try {
    let q;
    if (count && count > 0) {
        q = query(routesCollection, orderBy("createdAt", "desc"), limit(count));
    } else {
        q = query(routesCollection, orderBy("createdAt", "desc"));
    }
    
    const querySnapshot = await getDocs(q);
    const routes: (RouteData & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as RouteData;
       const convertTimestamp = (timestamp: Timestamp | FieldValue | undefined) => {
         if (timestamp instanceof Timestamp) {
           return timestamp.toDate().toISOString(); 
         }
         return undefined; 
       }
      routes.push({ 
        ...data, 
        id: doc.id,
        createdAt: convertTimestamp(data.createdAt) || new Date().toISOString(), 
        updatedAt: convertTimestamp(data.updatedAt), 
      });
    });
    return routes;
  } catch (error) {
    console.error("Error getting all routes:", error);
    throw new Error("Failed to fetch routes.");
  }
}


/**
 * Updates an existing route in Firestore.
 * @param routeId - The Firestore document ID of the route to update.
 * @param updatedData - An object containing the fields to update.
 * @param userId - The UID of the user attempting the update (for permission check).
 * @throws If the user is not authenticated, doesn't own the route, or if there's a Firestore error.
 */
export async function updateRoute(routeId: string, updatedData: Partial<RouteData>, userId: string): Promise<void> {
   if (!userId) {
      throw new Error("User must be authenticated to update a route.");
   }
  const routeRef = doc(db, "routes", routeId);

  try {
    // Optional: Check ownership before updating
    const docSnap = await getDoc(routeRef);
    if (!docSnap.exists() || docSnap.data()?.creatorId !== userId) {
       throw new Error("Route not found or user does not have permission to update.");
    }

    await updateDoc(routeRef, {
      ...updatedData,
      updatedAt: serverTimestamp(), // Update the timestamp
    });
  } catch (error) {
    console.error("Error updating route:", error);
     if (error instanceof Error && error.message.includes("permission")) {
         throw new Error("Permission denied to update this route.");
     }
    throw new Error("Failed to update the route.");
  }
}


/**
 * Deletes a route from Firestore.
 * @param routeId - The Firestore document ID of the route to delete.
 * @param userId - The UID of the user attempting the deletion (for permission check).
 * @throws If the user is not authenticated, doesn't own the route, or if there's a Firestore error.
 */
export async function deleteRoute(routeId: string, userId: string): Promise<void> {
  if (!userId) {
      throw new Error("User must be authenticated to delete a route.");
  }
  const routeRef = doc(db, "routes", routeId);

  try {
     // **Crucial:** Check ownership before deleting
    const docSnap = await getDoc(routeRef);
    if (!docSnap.exists()) {
        console.warn(`Route with ID ${routeId} not found for deletion.`);
        // Depending on desired behavior, you might throw an error or just return
        return; // Route already gone or never existed
    }
    if (docSnap.data()?.creatorId !== userId) {
        throw new Error("User does not have permission to delete this route.");
    }

    await deleteDoc(routeRef);
  } catch (error) {
    console.error("Error deleting route:", error);
     if (error instanceof Error && error.message.includes("permission")) {
         throw new Error("Permission denied to delete this route.");
     }
    throw new Error("Failed to delete the route.");
  }
}
