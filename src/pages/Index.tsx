/**
 * Index Page (Home Page)
 * 
 * The main landing page of the CineVerse application.
 * Displays featured movies, recommendation form, and movie categories.
 * 
 * Page Sections:
 * 1. Featured Hero - Large banner with trending movie
 * 2. Search Results - Shown when user types in search bar
 * 3. Recommendation Form - Filters for personalized suggestions
 * 4. Recommendations - Results from the recommendation engine
 * 5. Movie Rows - Trending, Popular, Top Rated, Upcoming sections
 * 
 * Data Sources:
 * - TMDB API for movie listings
 * - Local recommendation engine for filtered results
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  // Read URL search params for section navigation
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section');

  // Refs for scrolling to sections
  const heroRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const topRatedRef = useRef<HTMLDivElement>(null);
  const upcomingRef = useRef<HTMLDivElement>(null);

  // Track highlighted section for animation
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  // ============================================
  // STATE: Movie Data from TMDB API
  // ============================================
  const [trending, setTrending] = useState<TMDBMovie[]>([]);
  const [popular, setPopular] = useState<TMDBMovie[]>([]);
  const [topRated, setTopRated] = useState<TMDBMovie[]>([]);
  const [upcoming, setUpcoming] = useState<TMDBMovie[]>([]);
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [recommendations, setRecommendations] = useState<ScoredMovie[]>([]);
  
  // ============================================
  // STATE: Loading States for each section
  // ============================================
  const [isLoading, setIsLoading] = useState({ 
    trending: true, 
    popular: true, 
    topRated: true, 
    upcoming: true 
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  // ============================================
  // STATE: User Interactions
  // ============================================
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ============================================
  // STATE: Recommendation Filters
  // ============================================
  const [filters, setFilters] = useState<RecommendationFilters>({
    genres: [],
    moods: [],
    minRating: 0,
    language: 'all',
    yearRange: { min: 1900, max: 2024 },
    runtime: 'any',
    searchQuery: '',
  });

  // Debounce search query to reduce API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  /**
   * Effect: Fetch all movie categories on page load
   * Runs once on mount, fetches data in parallel
   * Each category updates its loading state independently
   */
  useEffect(() => {
    // Fetch trending movies
    getTrending().then(data => { 
      setTrending(data); 
      setIsLoading(prev => ({ ...prev, trending: false })); 
    });
    
    // Fetch popular movies
    getPopular().then(data => { 
      setPopular(data); 
      setIsLoading(prev => ({ ...prev, popular: false })); 
    });
    
    // Fetch top rated movies
    getTopRated().then(data => { 
      setTopRated(data); 
      setIsLoading(prev => ({ ...prev, topRated: false })); 
    });
    
    // Fetch upcoming movies
    getUpcoming().then(data => { 
      setUpcoming(data); 
      setIsLoading(prev => ({ ...prev, upcoming: false })); 
    });
  }, []);

  /**
   * Effect: Scroll to section when URL param changes
   */
  useEffect(() => {
    const scrollToRef = (ref: React.RefObject<HTMLDivElement>, sectionName: string) => {
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Trigger highlight animation
        setHighlightedSection(sectionName);
        setTimeout(() => setHighlightedSection(null), 1500);
      }, 100);
    };

    // If no section, scroll to top (Home)
    if (section === null) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    switch (section) {
      case 'trending':
        scrollToRef(trendingRef, 'trending');
        break;
      case 'top-rated':
        scrollToRef(topRatedRef, 'top-rated');
        break;
      case 'upcoming':
        scrollToRef(upcomingRef, 'upcoming');
        break;
    }
  }, [section]);

  /**
   * Effect: Search movies when query changes
   * Uses debounced query to prevent excessive API calls
   * Clears results when query is empty
   */
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

  /**
   * Handle "Get Recommendations" button click
   * Runs local recommendation engine with current filters
   * Includes 700ms artificial delay for UX polish
   */
  const handleGetRecommendations = () => {
    setIsRecommending(true);
    setShowRecommendations(true);
    
    // Artificial delay simulates API call for smoother UX
    setTimeout(() => {
      const results = getRecommendations(filters);
      setRecommendations(results);
      setIsRecommending(false);
    }, 700);
  };

  /**
   * Handle movie card click
   * Opens the movie detail modal for the selected movie
   */
  const handleMovieClick = (movie: TMDBMovie) => {
    setSelectedMovieId(movie.id);
    setIsModalOpen(true);
  };

  // Get first trending movie for featured hero section
  const featuredMovie = trending[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar with search functionality */}
      <Navbar onSearch={setSearchQuery} searchQuery={searchQuery} />

      <main className="container mx-auto px-4 pb-16">
        {/* ============================================
            SEARCH RESULTS VIEW
            Shown when user types in search bar
            ============================================ */}
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

        {/* ============================================
            DEFAULT HOME VIEW
            Shown when not searching
            ============================================ */}
        {!searchQuery && (
          <>
            {/* Featured Hero Section - Large banner with first trending movie */}
            {featuredMovie && !isLoading.trending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-12">
                <MovieCard 
                  movie={featuredMovie} 
                  variant="featured" 
                  onClick={() => handleMovieClick(featuredMovie)} 
                />
              </motion.div>
            )}

            {/* Recommendation Filter Form */}
            <MovieForm
              filters={filters}
              onFiltersChange={setFilters}
              onSubmit={handleGetRecommendations}
              isLoading={isRecommending}
            />

            {/* Recommendation Results - Shown after form submission */}
            {showRecommendations && (
              <Results
                movies={recommendations}
                isLoading={isRecommending}
                title="Recommended For You"
                subtitle="Based on your preferences"
                onMovieClick={handleMovieClick}
                showMatchReasons  // Display why each movie was recommended
                emptyMessage="No movies match your criteria. Try adjusting your filters."
              />
            )}

            {/* Movie Category Rows */}
            <div 
              ref={trendingRef} 
              className={`scroll-mt-24 transition-all duration-500 ${
                highlightedSection === 'trending' ? 'ring-2 ring-primary/50 rounded-2xl bg-primary/5' : ''
              }`}
            >
              <MovieRow 
                title="Trending Now" 
                movies={trending} 
                isLoading={isLoading.trending} 
                icon="trending" 
                onMovieClick={handleMovieClick} 
              />
            </div>
            <MovieRow 
              title="Popular" 
              movies={popular} 
              isLoading={isLoading.popular} 
              icon="sparkles" 
              onMovieClick={handleMovieClick} 
            />
            <div 
              ref={topRatedRef} 
              className={`scroll-mt-24 transition-all duration-500 ${
                highlightedSection === 'top-rated' ? 'ring-2 ring-primary/50 rounded-2xl bg-primary/5' : ''
              }`}
            >
              <MovieRow 
                title="Top Rated" 
                movies={topRated} 
                isLoading={isLoading.topRated} 
                icon="star" 
                onMovieClick={handleMovieClick} 
              />
            </div>
            <div 
              ref={upcomingRef} 
              className={`scroll-mt-24 transition-all duration-500 ${
                highlightedSection === 'upcoming' ? 'ring-2 ring-primary/50 rounded-2xl bg-primary/5' : ''
              }`}
            >
              <MovieRow 
                title="Upcoming" 
                movies={upcoming} 
                isLoading={isLoading.upcoming} 
                icon="calendar" 
                onMovieClick={handleMovieClick} 
              />
            </div>
          </>
        )}
      </main>

      {/* Movie Detail Modal - Opens when a movie card is clicked */}
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

export default Index;