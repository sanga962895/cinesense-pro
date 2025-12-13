/**
 * Results Component
 * 
 * A grid layout component for displaying movie search results or recommendations.
 * Handles loading states, empty states, and optional match reason badges.
 * 
 * Features:
 * - Responsive grid layout (2-8 columns based on screen size)
 * - Loading state with skeleton cards
 * - Empty state with friendly message
 * - Optional "match reasons" badges for recommendations
 * - Supports both TMDBMovie and ScoredMovie data types
 * 
 * Usage:
 * - Search results display
 * - Recommendation results
 * - Any movie collection grid
 */

import { motion } from 'framer-motion';
import { Film, Frown } from 'lucide-react';
import { TMDBMovie } from '@/api/tmdb';
import MovieCard from './MovieCard';
import { SkeletonGrid } from './SkeletonCard';
import { ScoredMovie } from '@/lib/recommendation';

/**
 * Props for Results component
 * @property movies - Array of movies to display
 * @property isLoading - Shows skeleton grid when true
 * @property title - Optional section title
 * @property subtitle - Optional subtitle/description
 * @property onMovieClick - Handler when a movie card is clicked
 * @property emptyMessage - Custom message when no results
 * @property showMatchReasons - Show recommendation match badges
 */
interface ResultsProps {
  movies: TMDBMovie[] | ScoredMovie[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  onMovieClick?: (movie: TMDBMovie) => void;
  emptyMessage?: string;
  showMatchReasons?: boolean;
}

const Results = ({
  movies,
  isLoading,
  title,
  subtitle,
  onMovieClick,
  emptyMessage = "No movies found. Try adjusting your filters.",
  showMatchReasons = false,
}: ResultsProps) => {
  // ============================================
  // LOADING STATE
  // Show skeleton cards while data is loading
  // ============================================
  if (isLoading) {
    return (
      <section className="py-8">
        {title && (
          <div className="mb-8">
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2">{title}</h2>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        <SkeletonGrid count={12} />
      </section>
    );
  }

  // ============================================
  // EMPTY STATE
  // Show friendly message when no results
  // ============================================
  if (movies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-16 text-center"
      >
        {/* Empty state icon */}
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Frown className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="font-display text-2xl text-foreground mb-2">No Results Found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">{emptyMessage}</p>
      </motion.div>
    );
  }

  // ============================================
  // RESULTS GRID
  // Display movies in responsive grid
  // ============================================
  return (
    <section className="py-8">
      {/* Section header with icon */}
      {title && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Film className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">{title}</h2>
          </div>
          {subtitle && <p className="text-muted-foreground ml-13">{subtitle}</p>}
        </motion.div>
      )}

      {/* Responsive movie grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-4 md:gap-6">
        {movies.map((movie, index) => {
          // Type cast to access ScoredMovie properties
          const scoredMovie = movie as ScoredMovie;
          
          // Convert ScoredMovie format to TMDBMovie format if needed
          // This handles the different data structures between TMDB API and recommendation engine
          const tmdbMovie: TMDBMovie = 'poster_url' in movie 
            ? {
                id: movie.id,
                title: movie.title,
                // Remove base URL from poster_url to get path
                poster_path: movie.poster_url?.replace('https://image.tmdb.org/t/p/w500', '') || null,
                backdrop_path: movie.backdrop_url?.replace('https://image.tmdb.org/t/p/original', '') || null,
                overview: movie.description || '',
                release_date: `${movie.release_year}-01-01`,
                vote_average: movie.rating,
                genre_ids: [],
                original_language: movie.language?.toLowerCase() || 'en',
                popularity: 0,
              }
            : movie;

          return (
            <div key={movie.id} className="relative">
              {/* Movie card */}
              <MovieCard
                movie={tmdbMovie}
                index={index}
                onClick={() => onMovieClick?.(tmdbMovie)}
              />
              
              {/* Match reason badges - shown below card when recommendations */}
              {showMatchReasons && scoredMovie.matchReasons && scoredMovie.matchReasons.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.3 }}
                  className="absolute -bottom-2 left-2 right-2 flex flex-wrap gap-1"
                >
                  {/* Show up to 2 match reasons */}
                  {scoredMovie.matchReasons.slice(0, 2).map((reason, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium"
                    >
                      {reason}
                    </span>
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Results;