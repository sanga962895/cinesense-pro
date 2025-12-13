/**
 * useWatchlistSync Hook
 * 
 * Manages the user's movie watchlist with dual-storage synchronization:
 * - localStorage: For offline access and guest users
 * - Firestore: For cloud persistence when user is authenticated
 * 
 * Sync Strategy:
 * 1. On page load: Initialize from localStorage
 * 2. On user login: Merge localStorage with Firestore (dedupe by movie ID)
 * 3. On add/remove: Update both localStorage and Firestore simultaneously
 * 4. On logout: Keep localStorage data for next session
 * 
 * This ensures:
 * - No data loss during merge operations
 * - Offline-first functionality
 * - Seamless sync when network is available
 */

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TMDBMovie } from '@/api/tmdb';

// localStorage key for watchlist data
const WATCHLIST_KEY = 'movie-watchlist';

/**
 * Extended movie type with timestamp for sorting
 * Extends TMDBMovie with addedAt timestamp
 */
export interface WatchlistItem extends TMDBMovie {
  addedAt: number; // Unix timestamp when added
}

/**
 * Custom hook for watchlist management with cloud sync
 * @param user - Firebase User object or null for guest users
 * @returns Object with watchlist state and methods
 */
export const useWatchlistSync = (user: User | null) => {
  // Initialize watchlist from localStorage on first render
  const [watchlist, setWatchlistState] = useState<WatchlistItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  
  // Track sync status for UI feedback
  const [syncing, setSyncing] = useState(false);

  /**
   * Merge two watchlists, deduplicating by movie ID
   * Local items take priority (already in user's localStorage)
   * Cloud items are added only if not already present
   * Results sorted by addedAt timestamp (newest first)
   */
  const mergeWatchlists = (local: WatchlistItem[], cloud: WatchlistItem[]): WatchlistItem[] => {
    const merged = new Map<number, WatchlistItem>();
    
    // Add local items first (priority)
    local.forEach(item => {
      merged.set(item.id, item);
    });
    
    // Add cloud items only if not already in local
    cloud.forEach(item => {
      if (!merged.has(item.id)) {
        merged.set(item.id, item);
      }
    });
    
    // Sort by addedAt descending (newest first)
    return Array.from(merged.values()).sort((a, b) => b.addedAt - a.addedAt);
  };

  /**
   * Effect: Sync watchlist when user logs in
   * 1. Fetch watchlist from Firestore
   * 2. Merge with localStorage
   * 3. Save merged list to both stores
   */
  useEffect(() => {
    const loadAndMerge = async () => {
      if (!user) return;
      
      setSyncing(true);
      try {
        // Get Firestore document reference for this user
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        // Get current localStorage data
        const localWatchlist = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
        let cloudWatchlist: WatchlistItem[] = [];
        
        // Get cloud data if exists
        if (docSnap.exists()) {
          cloudWatchlist = docSnap.data().watchlist || [];
        }
        
        // Merge both sources
        const merged = mergeWatchlists(localWatchlist, cloudWatchlist);
        
        // Update state and both storage locations
        setWatchlistState(merged);
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(merged));
        
        // Persist merged list back to Firestore
        await setDoc(docRef, { watchlist: merged }, { merge: true });
      } catch (error) {
        console.error('Error syncing watchlist:', error);
        // On error, keep local data
      } finally {
        setSyncing(false);
      }
    };

    loadAndMerge();
  }, [user]);

  /**
   * Set entire watchlist (used internally)
   * Updates both localStorage and Firestore
   */
  const setWatchlist = useCallback(async (newWatchlist: WatchlistItem[]) => {
    setWatchlistState(newWatchlist);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newWatchlist));

    // Sync to Firestore if user is logged in
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, { watchlist: newWatchlist }, { merge: true });
      } catch (error) {
        console.error('Error saving to Firestore:', error);
        // Data is saved to localStorage, will sync on next login
      }
    }
  }, [user]);

  /**
   * Add a movie to the watchlist
   * @param movie - TMDB movie object to add
   */
  const addToWatchlist = useCallback((movie: TMDBMovie) => {
    setWatchlistState(prev => {
      // Prevent duplicates
      if (prev.some(item => item.id === movie.id)) {
        return prev;
      }
      
      // Add movie with timestamp
      const newList = [...prev, { ...movie, addedAt: Date.now() }];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
      
      // Async Firestore update (fire and forget)
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        setDoc(docRef, { watchlist: newList }, { merge: true }).catch(console.error);
      }
      
      return newList;
    });
  }, [user]);

  /**
   * Remove a movie from the watchlist
   * @param movieId - ID of movie to remove
   */
  const removeFromWatchlist = useCallback((movieId: number) => {
    setWatchlistState(prev => {
      const newList = prev.filter(item => item.id !== movieId);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
      
      // Async Firestore update
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        setDoc(docRef, { watchlist: newList }, { merge: true }).catch(console.error);
      }
      
      return newList;
    });
  }, [user]);

  /**
   * Check if a movie is in the watchlist
   * @param movieId - ID of movie to check
   * @returns boolean indicating if movie is in watchlist
   */
  const isInWatchlist = useCallback((movieId: number) => {
    return watchlist.some(item => item.id === movieId);
  }, [watchlist]);

  /**
   * Toggle a movie's presence in the watchlist
   * @param movie - TMDB movie object
   * @returns boolean - true if added, false if removed
   */
  const toggleWatchlist = useCallback((movie: TMDBMovie) => {
    if (isInWatchlist(movie.id)) {
      removeFromWatchlist(movie.id);
      return false; // Was removed
    } else {
      addToWatchlist(movie);
      return true; // Was added
    }
  }, [addToWatchlist, removeFromWatchlist, isInWatchlist]);

  /**
   * Clear the entire watchlist
   * Removes all movies from both localStorage and Firestore
   */
  const clearWatchlist = useCallback(() => {
    setWatchlistState([]);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify([]));
    
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      setDoc(docRef, { watchlist: [] }, { merge: true }).catch(console.error);
    }
  }, [user]);

  // Return hook interface
  return {
    watchlist,           // Current watchlist array
    setWatchlist,        // Replace entire watchlist
    addToWatchlist,      // Add single movie
    removeFromWatchlist, // Remove by ID
    isInWatchlist,       // Check if movie is in list
    toggleWatchlist,     // Add or remove
    clearWatchlist,      // Remove all
    watchlistCount: watchlist.length, // Convenience getter
    syncing,             // Sync status for UI
  };
};
