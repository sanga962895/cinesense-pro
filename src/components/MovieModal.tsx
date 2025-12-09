import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Star, Play, Plus, Check, Clock, Calendar, Award, Users, 
  Film, ChevronRight, ExternalLink, Loader2 
} from 'lucide-react';
import { TMDBMovieDetails, getMovieDetails, getImageUrl, TMDBCastMember } from '@/api/tmdb';
import { getMovieByTitle, parseRatings } from '@/api/omdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

interface MovieModalProps {
  movieId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onShowSimilar?: (movieId: number) => void;
}

const MovieModal = ({ movieId, isOpen, onClose, onShowSimilar }: MovieModalProps) => {
  const [movie, setMovie] = useState<TMDBMovieDetails | null>(null);
  const [omdbData, setOmdbData] = useState<{
    ratings: Record<string, number>;
    awards: string;
    actors: string;
    director: string;
    plot: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    if (movieId && isOpen) {
      setIsLoading(true);
      setMovie(null);
      setOmdbData(null);
      setShowTrailer(false);

      Promise.all([
        getMovieDetails(movieId),
        // Fetch OMDb data after getting movie title
      ]).then(async ([tmdbData]) => {
        setMovie(tmdbData);
        
        if (tmdbData) {
          const releaseYear = tmdbData.release_date 
            ? parseInt(tmdbData.release_date.split('-')[0]) 
            : undefined;
          const omdb = await getMovieByTitle(tmdbData.title, releaseYear);
          if (omdb) {
            setOmdbData({
              ratings: parseRatings(omdb.Ratings),
              awards: omdb.Awards,
              actors: omdb.Actors,
              director: omdb.Director,
              plot: omdb.Plot,
            });
          }
        }
        setIsLoading(false);
      });
    }
  }, [movieId, isOpen]);

  if (!isOpen) return null;

  const inWatchlist = movie ? isInWatchlist(movie.id) : false;
  const trailer = movie?.videos?.results.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  );

  const handleWatchlistClick = () => {
    if (movie) {
      toggleWatchlist({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genre_ids: movie.genres.map(g => g.id),
        original_language: movie.original_language,
        popularity: movie.popularity,
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="w-full max-w-5xl max-h-full bg-card rounded-2xl overflow-hidden shadow-2xl pointer-events-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
              ) : movie ? (
                <ScrollArea className="h-[85vh]">
                  {/* Header with Backdrop */}
                  <div className="relative h-80 md:h-96">
                    {showTrailer && trailer ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        <img
                          src={getImageUrl(movie.backdrop_path || movie.poster_path, 'original')}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                        
                        {trailer && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowTrailer(true)}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-xl hover:bg-primary/90 transition-colors"
                          >
                            <Play className="w-8 h-8 text-primary-foreground fill-current ml-1" />
                          </motion.button>
                        )}
                      </>
                    )}

                    {/* Close Button */}
                    <button
                      onClick={onClose}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                    >
                      <X className="w-5 h-5 text-foreground" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 md:p-8 -mt-20 relative">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Poster */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-40 md:w-48 flex-shrink-0 mx-auto md:mx-0"
                      >
                        <img
                          src={getImageUrl(movie.poster_path, 'w500')}
                          alt={movie.title}
                          className="w-full rounded-xl shadow-2xl"
                        />
                      </motion.div>

                      {/* Info */}
                      <div className="flex-1 text-center md:text-left">
                        <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">
                          {movie.title}
                        </h1>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                          <div className="rating-badge">
                            <Star className="w-4 h-4 fill-current" />
                            {Math.round(movie.vote_average * 10) / 10}
                          </div>
                          {movie.release_date && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {new Date(movie.release_date).getFullYear()}
                            </div>
                          )}
                          {movie.runtime > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                            </div>
                          )}
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                          {movie.genres.map((genre) => (
                            <Badge key={genre.id} variant="secondary" className="genre-tag">
                              {genre.name}
                            </Badge>
                          ))}
                        </div>

                        {/* Ratings from OMDb */}
                        {omdbData?.ratings && Object.keys(omdbData.ratings).length > 0 && (
                          <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                            {omdbData.ratings.imdb && (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <span className="text-yellow-500 font-bold">IMDb</span>
                                <span className="text-foreground font-semibold">{omdbData.ratings.imdb}/10</span>
                              </div>
                            )}
                            {omdbData.ratings.rottenTomatoes && (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                                <span className="text-red-500 font-bold">🍅</span>
                                <span className="text-foreground font-semibold">{omdbData.ratings.rottenTomatoes}%</span>
                              </div>
                            )}
                            {omdbData.ratings.metacritic && (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                                <span className="text-green-500 font-bold">MC</span>
                                <span className="text-foreground font-semibold">{omdbData.ratings.metacritic}/100</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
                          {trailer && (
                            <Button
                              onClick={() => setShowTrailer(!showTrailer)}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                            >
                              <Play className="w-4 h-4 fill-current" />
                              {showTrailer ? 'Hide Trailer' : 'Watch Trailer'}
                            </Button>
                          )}
                          <Button
                            variant={inWatchlist ? 'secondary' : 'outline'}
                            onClick={handleWatchlistClick}
                            className="gap-2"
                          >
                            {inWatchlist ? (
                              <>
                                <Check className="w-4 h-4 text-green-500" />
                                In Watchlist
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Add to Watchlist
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Plot */}
                        <p className="text-muted-foreground leading-relaxed">
                          {omdbData?.plot || movie.overview}
                        </p>
                      </div>
                    </div>

                    <Separator className="my-8" />

                    {/* Awards */}
                    {omdbData?.awards && omdbData.awards !== 'N/A' && (
                      <div className="mb-8">
                        <h3 className="font-display text-2xl text-foreground mb-4 flex items-center gap-2">
                          <Award className="w-6 h-6 text-gold" />
                          Awards & Recognition
                        </h3>
                        <p className="text-muted-foreground bg-gold/5 border border-gold/20 rounded-lg p-4">
                          {omdbData.awards}
                        </p>
                      </div>
                    )}

                    {/* Director */}
                    {(omdbData?.director || movie.credits?.crew) && (
                      <div className="mb-8">
                        <h3 className="font-display text-2xl text-foreground mb-4 flex items-center gap-2">
                          <Film className="w-6 h-6 text-primary" />
                          Director
                        </h3>
                        <p className="text-foreground font-medium">
                          {omdbData?.director || 
                            movie.credits?.crew.find(c => c.job === 'Director')?.name || 
                            'Unknown'}
                        </p>
                      </div>
                    )}

                    {/* Cast */}
                    {movie.credits?.cast && movie.credits.cast.length > 0 && (
                      <div className="mb-8">
                        <h3 className="font-display text-2xl text-foreground mb-4 flex items-center gap-2">
                          <Users className="w-6 h-6 text-primary" />
                          Cast
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {movie.credits.cast.slice(0, 12).map((actor) => (
                            <Link
                              key={actor.id}
                              to={`/actor/${actor.id}`}
                              onClick={onClose}
                              className="group"
                            >
                              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary mb-2">
                                <img
                                  src={getImageUrl(actor.profile_path, 'w200')}
                                  alt={actor.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                              </div>
                              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {actor.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {actor.character}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Similar Movies */}
                    {movie.similar?.results && movie.similar.results.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-display text-2xl text-foreground">Similar Movies</h3>
                          {onShowSimilar && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onClose();
                                onShowSimilar(movie.id);
                              }}
                              className="text-primary"
                            >
                              View All
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                          {movie.similar.results.slice(0, 6).map((similarMovie) => (
                            <motion.div
                              key={similarMovie.id}
                              whileHover={{ scale: 1.05 }}
                              className="cursor-pointer"
                              onClick={() => {
                                setMovie(null);
                                setOmdbData(null);
                                setIsLoading(true);
                                getMovieDetails(similarMovie.id).then(setMovie).finally(() => setIsLoading(false));
                              }}
                            >
                              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
                                <img
                                  src={getImageUrl(similarMovie.poster_path, 'w300')}
                                  alt={similarMovie.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <p className="text-xs font-medium text-foreground mt-2 truncate">
                                {similarMovie.title}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <p className="text-muted-foreground">Movie not found</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MovieModal;
