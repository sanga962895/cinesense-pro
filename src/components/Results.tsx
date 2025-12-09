import { motion } from 'framer-motion';
import { Film, Frown } from 'lucide-react';
import { TMDBMovie } from '@/api/tmdb';
import MovieCard from './MovieCard';
import { SkeletonGrid } from './SkeletonCard';
import { ScoredMovie } from '@/lib/recommendation';

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

  if (movies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-16 text-center"
      >
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Frown className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="font-display text-2xl text-foreground mb-2">No Results Found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <section className="py-8">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-4 md:gap-6">
        {movies.map((movie, index) => {
          const scoredMovie = movie as ScoredMovie;
          const tmdbMovie: TMDBMovie = 'poster_url' in movie 
            ? {
                id: movie.id,
                title: movie.title,
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
              <MovieCard
                movie={tmdbMovie}
                index={index}
                onClick={() => onMovieClick?.(tmdbMovie)}
              />
              {showMatchReasons && scoredMovie.matchReasons && scoredMovie.matchReasons.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.3 }}
                  className="absolute -bottom-2 left-2 right-2 flex flex-wrap gap-1"
                >
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
