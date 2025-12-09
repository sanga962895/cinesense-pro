import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, Star, Calendar, Sparkles } from 'lucide-react';
import { TMDBMovie } from '@/api/tmdb';
import MovieCard from './MovieCard';
import { SkeletonGrid } from './SkeletonCard';
import { Button } from '@/components/ui/button';

interface MovieRowProps {
  title: string;
  movies: TMDBMovie[];
  isLoading?: boolean;
  icon?: 'trending' | 'star' | 'calendar' | 'sparkles';
  onMovieClick?: (movie: TMDBMovie) => void;
}

const iconMap = {
  trending: TrendingUp,
  star: Star,
  calendar: Calendar,
  sparkles: Sparkles,
};

const MovieRow = ({ title, movies, isLoading, icon, onMovieClick }: MovieRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const Icon = icon ? iconMap[icon] : null;

  return (
    <section className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          <h2 className="font-display text-3xl md:text-4xl text-foreground">{title}</h2>
        </motion.div>

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

      {/* Movie Grid/Scroll */}
      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {movies.map((movie, index) => (
            <div
              key={movie.id}
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
