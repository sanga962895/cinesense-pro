import { useState, useEffect, useCallback } from 'react';
import { TMDBMovie } from '@/api/tmdb';

const WATCHLIST_KEY = 'movie-watchlist';

export interface WatchlistItem extends TMDBMovie {
  addedAt: number;
}

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = useCallback((movie: TMDBMovie) => {
    setWatchlist(prev => {
      if (prev.some(item => item.id === movie.id)) {
        return prev;
      }
      return [...prev, { ...movie, addedAt: Date.now() }];
    });
  }, []);

  const removeFromWatchlist = useCallback((movieId: number) => {
    setWatchlist(prev => prev.filter(item => item.id !== movieId));
  }, []);

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
    setWatchlist([]);
  }, []);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    toggleWatchlist,
    clearWatchlist,
    watchlistCount: watchlist.length,
  };
};
