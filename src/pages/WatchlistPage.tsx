import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, Clock, Star, Film, Cloud, CloudOff } from 'lucide-react';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import MovieModal from '@/components/MovieModal';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlistSync, WatchlistItem } from '@/hooks/useWatchlistSync';
import { TMDBMovie } from '@/api/tmdb';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const WatchlistPage = () => {
  const { user } = useAuth();
  const { watchlist, removeFromWatchlist, clearWatchlist, syncing } = useWatchlistSync(user);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMovieClick = (movie: TMDBMovie) => {
    setSelectedMovieId(movie.id);
    setIsModalOpen(true);
  };

  const formatAddedDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-4xl md:text-5xl text-foreground">My Watchlist</h1>
                {syncing ? (
                  <Cloud className="w-5 h-5 text-primary animate-pulse" />
                ) : user ? (
                  <Cloud className="w-5 h-5 text-green-500" />
                ) : (
                  <CloudOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'} saved
                {user && ' • Synced to cloud'}
              </p>
            </div>
          </div>

          {watchlist.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Watchlist?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all {watchlist.length} movies from your watchlist. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearWatchlist}>Clear All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Empty State */}
        {watchlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-center"
          >
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-6">
              <Film className="w-16 h-16 text-muted-foreground" />
            </div>
            <h2 className="font-display text-3xl text-foreground mb-2">Your Watchlist is Empty</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Start adding movies to your watchlist by clicking the + button on any movie card.
            </p>
            <Link to="/">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Film className="w-4 h-4" />
                Browse Movies
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Grid View */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
              <AnimatePresence mode="popLayout">
                {watchlist.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative group"
                  >
                    <MovieCard
                      movie={movie}
                      index={index}
                      onClick={() => handleMovieClick(movie)}
                    />
                    
                    {/* Remove Button */}
                    <motion.button
                      initial={{ opacity: 0 }}
                      whileHover={{ scale: 1.1 }}
                      className="absolute top-2 left-2 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist(movie.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>

                    {/* Added Date */}
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Added {formatAddedDate(movie.addedAt)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Film className="w-5 h-5" />
                  <span className="font-medium">Total Movies</span>
                </div>
                <p className="font-display text-4xl text-foreground">{watchlist.length}</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-2 text-gold mb-2">
                  <Star className="w-5 h-5" />
                  <span className="font-medium">Average Rating</span>
                </div>
                <p className="font-display text-4xl text-foreground">
                  {(watchlist.reduce((acc, m) => acc + m.vote_average, 0) / watchlist.length).toFixed(1)}
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Latest Added</span>
                </div>
                <p className="font-display text-xl text-foreground truncate">
                  {watchlist[watchlist.length - 1]?.title || 'None'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </main>

      <MovieModal
        movieId={selectedMovieId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMovieId(null);
        }}
      />
    </div>
  );
};

export default WatchlistPage;
