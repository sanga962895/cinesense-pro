/**
 * MovieCard Component
 * 
 * A versatile card component for displaying movie information with three variants:
 * - 'default': Standard card with poster, rating, and hover effects
 * - 'compact': Smaller version for tight layouts
 * - 'featured': Large hero-style card with backdrop and detailed info
 * 
 * Features:
 * - Animated hover states using Framer Motion
 * - Lazy-loaded images with skeleton placeholders
 * - Watchlist toggle functionality (synced with Firebase)
 * - Responsive design for all screen sizes
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, Check, Play, Info } from 'lucide-react';
import { TMDBMovie, getImageUrl } from '@/api/tmdb';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlistSync } from '@/hooks/useWatchlistSync';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Props for MovieCard component
 * @property movie - TMDB movie data object
 * @property index - Position in list (used for staggered animations)
 * @property onClick - Handler for card click (typically opens modal)
 * @property variant - Display variant: 'default' | 'compact' | 'featured'
 */
interface MovieCardProps {
  movie: TMDBMovie;
  index?: number;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

const MovieCard = ({ movie, index = 0, onClick, variant = 'default' }: MovieCardProps) => {
  // Track hover state for interactive effects
  const [isHovered, setIsHovered] = useState(false);
  // Track image load state for skeleton placeholder
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Get current user for watchlist functionality
  const { user } = useAuth();
  // Hook for watchlist operations (add/remove/check)
  const { isInWatchlist, toggleWatchlist } = useWatchlistSync(user);
  // Check if this movie is in user's watchlist
  const inWatchlist = isInWatchlist(movie.id);

  /**
   * Handle watchlist button click
   * Stops event propagation to prevent triggering card click
   */
  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(movie);
  };

  // Extract year from release date for display
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  // Round rating to one decimal place
  const rating = Math.round(movie.vote_average * 10) / 10;

  // ============================================
  // FEATURED VARIANT - Large hero-style card
  // ============================================
  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="relative w-full h-[60vh] min-h-[500px] max-h-[800px] overflow-hidden rounded-3xl cursor-pointer group"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background Image with zoom effect on hover */}
        <motion.div
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img
            src={getImageUrl(movie.backdrop_path || movie.poster_path, 'original')}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Gradient overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        </motion.div>

        {/* Content overlay - positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl"
          >
            {/* Meta badges: Featured tag, year, rating */}
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-primary text-primary-foreground">Featured</Badge>
              {releaseYear && (
                <span className="text-muted-foreground">{releaseYear}</span>
              )}
              <div className="flex items-center gap-1 text-gold">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold">{rating}</span>
              </div>
            </div>

            {/* Movie title - large display font */}
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground mb-4 leading-tight">
              {movie.title}
            </h2>

            {/* Movie overview - truncated to 3 lines */}
            <p className="text-muted-foreground text-lg mb-6 line-clamp-3">
              {movie.overview}
            </p>

            {/* Action buttons: Trailer, More Info, Watchlist */}
            <div className="flex items-center gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                onClick={onClick}
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Trailer
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2 border-foreground/30 hover:bg-foreground/10"
                onClick={onClick}
              >
                <Info className="w-5 h-5" />
                More Info
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="gap-2"
                onClick={handleWatchlistClick}
              >
                {inWatchlist ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {inWatchlist ? 'Added' : 'Watchlist'}
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ============================================
  // DEFAULT VARIANT - Standard card with poster
  // ============================================
  return (
    <motion.div
      // Staggered fade-in animation based on index
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      // Lift effect on hover
      whileHover={{ y: -8 }}
      className="movie-card cursor-pointer group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster Container with 2:3 aspect ratio */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
        {/* Skeleton placeholder shown while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 skeleton-shimmer" />
        )}
        
        {/* Movie poster image */}
        <motion.img
          src={getImageUrl(movie.poster_path, 'w500')}
          alt={movie.title}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${isHovered ? 'scale-110' : 'scale-100'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Gradient overlay - visible on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating badge - top left corner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-3 left-3"
        >
          <div className="rating-badge">
            <Star className="w-3 h-3 fill-current" />
            {rating}
          </div>
        </motion.div>

        {/* Watchlist button - top right, appears on hover */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleWatchlistClick}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            inWatchlist 
              ? 'bg-green-500 text-white' 
              : 'bg-background/80 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground'
          }`}
        >
          {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </motion.button>

        {/* View Details button - appears at bottom on hover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-0 left-0 right-0 p-4"
        >
          <Button
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <Play className="w-4 h-4 fill-current" />
            View Details
          </Button>
        </motion.div>
      </div>

      {/* Movie info below poster */}
      <div className="p-3">
        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {releaseYear && (
            <span className="text-sm text-muted-foreground">{releaseYear}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;