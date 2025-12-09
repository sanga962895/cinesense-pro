import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import MovieForm from '@/components/MovieForm';
import MovieCard from '@/components/MovieCard';
import MovieRow from '@/components/MovieRow';
import MovieModal from '@/components/MovieModal';
import Results from '@/components/Results';
import { getTrending, getPopular, getTopRated, getUpcoming, searchMovies, TMDBMovie } from '@/api/tmdb';
import { getRecommendations, RecommendationFilters, ScoredMovie } from '@/lib/recommendation';
import { useDebounce } from '@/hooks/useDebounce';

const Index = () => {
  const [trending, setTrending] = useState<TMDBMovie[]>([]);
  const [popular, setPopular] = useState<TMDBMovie[]>([]);
  const [topRated, setTopRated] = useState<TMDBMovie[]>([]);
  const [upcoming, setUpcoming] = useState<TMDBMovie[]>([]);
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [recommendations, setRecommendations] = useState<ScoredMovie[]>([]);
  
  const [isLoading, setIsLoading] = useState({ trending: true, popular: true, topRated: true, upcoming: true });
  const [isSearching, setIsSearching] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [filters, setFilters] = useState<RecommendationFilters>({
    genres: [],
    moods: [],
    minRating: 0,
    language: 'all',
    yearRange: { min: 1900, max: 2024 },
    runtime: 'any',
    searchQuery: '',
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    getTrending().then(data => { setTrending(data); setIsLoading(prev => ({ ...prev, trending: false })); });
    getPopular().then(data => { setPopular(data); setIsLoading(prev => ({ ...prev, popular: false })); });
    getTopRated().then(data => { setTopRated(data); setIsLoading(prev => ({ ...prev, topRated: false })); });
    getUpcoming().then(data => { setUpcoming(data); setIsLoading(prev => ({ ...prev, upcoming: false })); });
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      setIsSearching(true);
      searchMovies(debouncedSearch).then(data => {
        setSearchResults(data);
        setIsSearching(false);
      });
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const handleGetRecommendations = () => {
    setIsRecommending(true);
    setShowRecommendations(true);
    setTimeout(() => {
      const results = getRecommendations(filters);
      setRecommendations(results);
      setIsRecommending(false);
    }, 700);
  };

  const handleMovieClick = (movie: TMDBMovie) => {
    setSelectedMovieId(movie.id);
    setIsModalOpen(true);
  };

  const featuredMovie = trending[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={setSearchQuery} searchQuery={searchQuery} />

      <main className="container mx-auto px-4 pb-16">
        {/* Search Results */}
        {searchQuery && (
          <Results
            movies={searchResults}
            isLoading={isSearching}
            title={`Search Results for "${searchQuery}"`}
            subtitle={`${searchResults.length} movies found`}
            onMovieClick={handleMovieClick}
            emptyMessage="No movies found. Try a different search term."
          />
        )}

        {!searchQuery && (
          <>
            {/* Featured Hero */}
            {featuredMovie && !isLoading.trending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-12">
                <MovieCard movie={featuredMovie} variant="featured" onClick={() => handleMovieClick(featuredMovie)} />
              </motion.div>
            )}

            {/* Recommendation Form */}
            <MovieForm
              filters={filters}
              onFiltersChange={setFilters}
              onSubmit={handleGetRecommendations}
              isLoading={isRecommending}
            />

            {/* Recommendations */}
            {showRecommendations && (
              <Results
                movies={recommendations}
                isLoading={isRecommending}
                title="Recommended For You"
                subtitle="Based on your preferences"
                onMovieClick={handleMovieClick}
                showMatchReasons
                emptyMessage="No movies match your criteria. Try adjusting your filters."
              />
            )}

            {/* Movie Rows */}
            <MovieRow title="Trending Now" movies={trending} isLoading={isLoading.trending} icon="trending" onMovieClick={handleMovieClick} />
            <MovieRow title="Popular" movies={popular} isLoading={isLoading.popular} icon="sparkles" onMovieClick={handleMovieClick} />
            <MovieRow title="Top Rated" movies={topRated} isLoading={isLoading.topRated} icon="star" onMovieClick={handleMovieClick} />
            <MovieRow title="Upcoming" movies={upcoming} isLoading={isLoading.upcoming} icon="calendar" onMovieClick={handleMovieClick} />
          </>
        )}
      </main>

      <MovieModal movieId={selectedMovieId} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedMovieId(null); }} />
    </div>
  );
};

export default Index;
