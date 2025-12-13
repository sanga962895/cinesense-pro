/**
 * MovieRow Component
 * 
 * A horizontally scrolling row of movie cards with navigation controls.
 * Used on the home page to display categories like "Trending", "Popular", etc.
 * 
 * Features:
 * - Horizontal scroll with smooth snap behavior
 * - Navigation arrows for desktop (hidden on mobile)
 * - Icon display based on category type
 * - Loading state with skeleton cards
 * - Responsive card sizing across breakpoints
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, Star, Calendar, Sparkles } from 'lucide-react';
import { TMDBMovie } from '@/api/tmdb';
import MovieCard from './MovieCard';
import { SkeletonGrid } from './SkeletonCard';
import { Button } from '@/components/ui/button';

/**
 * Props for MovieRow component
 * @property title - Section heading text
 * @property movies - Array of TMDB movie objects to display
 * @property isLoading - Show skeleton cards while loading
 * @property icon - Category icon: 'trending' | 'star' | 'calendar' | 'sparkles'
 * @property onMovieClick - Handler when a movie card is clicked
 */
interface MovieRowProps {
  title: string;
  movies: TMDBMovie[];
  isLoading?: boolean;
  icon?: 'trending' | 'star' | 'calendar' | 'sparkles';
  onMovieClick?: (movie: TMDBMovie) => void;
}

/**
 * Icon mapping for different category types
 * Maps string identifiers to Lucide icon components
 */
const iconMap = {
  trending: TrendingUp,
  star: Star,
  calendar: Calendar,
  sparkles: Sparkles,
};

const MovieRow = ({ title, movies, isLoading, icon, onMovieClick }: MovieRowProps) => {
  // Reference to scroll container for programmatic scrolling
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll the movie list left or right
   * Scrolls by 80% of the visible container width
   * @param direction - 'left' or 'right'
   */
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Get the appropriate icon component based on prop
  const Icon = icon ? iconMap[icon] : null;

  return (
    <section className="mb-12">
      {/* Section Header with title and navigation */}
      <div className="flex items-center justify-between mb-6">
        {/* Title with icon */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          {/* Category icon in rounded container */}
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          <h2 className="font-display text-3xl md:text-4xl text-foreground">{title}</h2>
        </motion.div>

        {/* Navigation arrows - hidden on mobile */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            className="hidden md:flex"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            className="hidden md:flex"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Movie Cards Container */}
      {isLoading ? (
        // Show skeleton loading cards
        <SkeletonGrid count={6} />
      ) : (
        // Horizontal scrolling container
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {/* Render each movie card with responsive widths */}
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              // Responsive card widths:
              // - Mobile: 2 cards visible (50%)
              // - Small: 3 cards (33.333%)
              // - Medium: 4 cards (25%)
              // - Large: 5 cards (20%)
              // - XL: 6 cards (16.666%)
              className="flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-12px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-12px)] xl:w-[calc(16.666%-14px)]"
              style={{ scrollSnapAlign: 'start' }}
            >
              <MovieCard
                movie={movie}
                index={index}
                onClick={() => onMovieClick?.(movie)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MovieRow;