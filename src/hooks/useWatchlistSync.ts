import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TMDBMovie } from '@/api/tmdb';

const WATCHLIST_KEY = 'movie-watchlist';

export interface WatchlistItem extends TMDBMovie {
  addedAt: number;
}

export const useWatchlistSync = (user: User | null) => {
  const [watchlist, setWatchlistState] = useState<WatchlistItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [syncing, setSyncing] = useState(false);

  // Merge and dedupe watchlists by movie id
  const mergeWatchlists = (local: WatchlistItem[], cloud: WatchlistItem[]): WatchlistItem[] => {
    const merged = new Map<number, WatchlistItem>();
    
    // Add local items first
    local.forEach(item => {
      merged.set(item.id, item);
    });
    
    // Add cloud items (won't overwrite if already exists)
    cloud.forEach(item => {
      if (!merged.has(item.id)) {
        merged.set(item.id, item);
      }
    });
    
    return Array.from(merged.values()).sort((a, b) => b.addedAt - a.addedAt);
  };

  // Load from Firestore and merge with localStorage on login
  useEffect(() => {
    const loadAndMerge = async () => {
      if (!user) return;
      
      setSyncing(true);
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        const localWatchlist = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
        let cloudWatchlist: WatchlistItem[] = [];
        
        if (docSnap.exists()) {
          cloudWatchlist = docSnap.data().watchlist || [];
        }
        
        const merged = mergeWatchlists(localWatchlist, cloudWatchlist);
        setWatchlistState(merged);
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(merged));
        
        // Save merged list back to Firestore
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

  // Save to localStorage and Firestore
  const setWatchlist = useCallback(async (newWatchlist: WatchlistItem[]) => {
    setWatchlistState(newWatchlist);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newWatchlist));

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

  const addToWatchlist = useCallback((movie: TMDBMovie) => {
    setWatchlistState(prev => {
      if (prev.some(item => item.id === movie.id)) {
        return prev;
      }
      const newList = [...prev, { ...movie, addedAt: Date.now() }];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
      
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        setDoc(docRef, { watchlist: newList }, { merge: true }).catch(console.error);
      }
      
      return newList;
    });
  }, [user]);

  const removeFromWatchlist = useCallback((movieId: number) => {
    setWatchlistState(prev => {
      const newList = prev.filter(item => item.id !== movieId);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
      
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        setDoc(docRef, { watchlist: newList }, { merge: true }).catch(console.error);
      }
      
      return newList;
    });
  }, [user]);

  const isInWatchlist = useCallback((movieId: number) => {
    return watchlist.some(item => item.id === movieId);
  }, [watchlist]);

  const toggleWatchlist = useCallback((movie: TMDBMovie) => {
    if (isInWatchlist(movie.id)) {
      removeFromWatchlist(movie.id);
      return false;
    } else {
      addToWatchlist(movie);
      return true;
    }
  }, [addToWatchlist, removeFromWatchlist, isInWatchlist]);

  const clearWatchlist = useCallback(() => {
    setWatchlistState([]);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify([]));
    
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      setDoc(docRef, { watchlist: [] }, { merge: true }).catch(console.error);
    }
  }, [user]);

  return {
    watchlist,
    setWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    toggleWatchlist,
    clearWatchlist,
    watchlistCount: watchlist.length,
    syncing,
  };
};
