/**
 * TMDB API Client
 * 
 * Handles all interactions with The Movie Database (TMDB) API.
 * TMDB is the primary data source for movie information.
 * 
 * Responsibilities:
 * - Trending, Popular, Top Rated, Upcoming movie lists
 * - Movie details with credits, videos, and similar movies
 * - Actor/Person details with filmography
 * - Movie search functionality
 * - Discover endpoint for advanced filtering
 * 
 * Features:
 * - Response caching (5 minute TTL)
 * - Artificial delay for smooth loading states
 * - Image URL construction helper
 * - Genre ID to name mapping
 */

import axios from 'axios';

// API Configuration
const TMDB_API_KEY = '76b64f689ed420b78b21d05a0b813306';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Basic movie data returned in list endpoints
 */
export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;    // Path to poster image
  backdrop_path: string | null;  // Path to backdrop image
  overview: string;              // Movie description
  release_date: string;          // Format: YYYY-MM-DD
  vote_average: number;          // Rating out of 10
  genre_ids: number[];           // Array of genre IDs
  original_language: string;     // ISO 639-1 language code
  popularity: number;            // Popularity score
}

/**
 * Extended movie data from details endpoint
 * Includes credits, videos, and similar movies
 */
export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;  // Runtime in minutes
  genres: { id: number; name: string }[];  // Full genre objects
  credits?: {
    cast: TMDBCastMember[];
    crew: { id: number; name: string; job: string; profile_path: string | null }[];
  };
  videos?: {
    results: { key: string; type: string; site: string }[];  // YouTube video keys
  };
  similar?: {
    results: TMDBMovie[];
  };
}

/**
 * Cast member data from movie credits
 */
export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;         // Role name in movie
  profile_path: string | null;
  order: number;             // Billing order
}

/**
 * Person/Actor data from person endpoint
 */
export interface TMDBPerson {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;  // e.g., "Acting", "Directing"
  movie_credits?: {
    cast: TMDBMovie[];  // Movies they've acted in
  };
  images?: {
    profiles: { file_path: string }[];  // Additional photos
  };
}

// ============================================
// API CLIENT SETUP
// ============================================

/**
 * Axios instance with TMDB base configuration
 * API key is automatically added to all requests
 */
const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Add artificial delay to API calls
 * Creates smoother loading transitions in the UI
 * @param promise - The API promise to delay
 * @param delay - Delay in milliseconds (default: 700ms)
 */
const withDelay = async <T>(promise: Promise<T>, delay = 700): Promise<T> => {
  const [result] = await Promise.all([
    promise,
    new Promise(resolve => setTimeout(resolve, delay)),
  ]);
  return result;
};

// ============================================
// CACHING LAYER
// ============================================

/**
 * In-memory cache for API responses
 * Reduces API calls and improves performance
 */
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Retrieve cached data if not expired
 * @param key - Cache key
 * @returns Cached data or null if expired/missing
 */
const getCached = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
};

/**
 * Store data in cache with timestamp
 * @param key - Cache key
 * @param data - Data to cache
 */
const setCache = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

// ============================================
// IMAGE URL HELPER
// ============================================

/**
 * Construct full image URL from TMDB path
 * @param path - Image path from TMDB (e.g., "/abc123.jpg")
 * @param size - Image size: w200, w300, w500, w780, or original
 * @returns Full image URL or placeholder if path is null
 */
export const getImageUrl = (
  path: string | null, 
  size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500'
): string => {
  if (!path) return '/placeholder.svg';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

// ============================================
// MOVIE LIST ENDPOINTS
// ============================================

/**
 * Get trending movies
 * @param timeWindow - 'day' or 'week' (default: week)
 * @returns Array of trending movies
 */
export const getTrending = async (timeWindow: 'day' | 'week' = 'week'): Promise<TMDBMovie[]> => {
  const cacheKey = `trending-${timeWindow}`;
  const cached = getCached<TMDBMovie[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await withDelay(
      tmdbApi.get(`/trending/movie/${timeWindow}`)
    );
    setCache(cacheKey, response.data.results);
    return response.data.results;
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    return [];
  }
};

/**
 * Get popular movies
 * @param page - Page number for pagination (default: 1)
 * @returns Array of popular movies
 */
export const getPopular = async (page = 1): Promise<TMDBMovie[]> => {
  const cacheKey = `popular-${page}`;
  const cached = getCached<TMDBMovie[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await withDelay(
      tmdbApi.get('/movie/popular', { params: { page } })
    );
    setCache(cacheKey, response.data.results);
    return response.data.results;
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return [];
  }
};

/**
 * Get top rated movies
 * @param page - Page number for pagination (default: 1)
 * @returns Array of top rated movies
 */
export const getTopRated = async (page = 1): Promise<TMDBMovie[]> => {
  const cacheKey = `top-rated-${page}`;
  const cached = getCached<TMDBMovie[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await withDelay(
      tmdbApi.get('/movie/top_rated', { params: { page } })
    );
    setCache(cacheKey, response.data.results);
    return response.data.results;
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    return [];
  }
};

/**
 * Get upcoming movies
 * @param page - Page number for pagination (default: 1)
 * @returns Array of upcoming movies
 */
export const getUpcoming = async (page = 1): Promise<TMDBMovie[]> => {
  const cacheKey = `upcoming-${page}`;
  const cached = getCached<TMDBMovie[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await withDelay(
      tmdbApi.get('/movie/upcoming', { params: { page } })
    );
    setCache(cacheKey, response.data.results);
    return response.data.results;
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
    return [];
  }
};

// ============================================
// DETAIL ENDPOINTS
// ============================================

/**
 * Get detailed movie information
 * Includes credits (cast/crew), videos (trailers), and similar movies
 * @param movieId - TMDB movie ID
 * @returns Movie details or null if not found
 */
export const getMovieDetails = async (movieId: number): Promise<TMDBMovieDetails | null> => {
  const cacheKey = `movie-${movieId}`;
  const cached = getCached<TMDBMovieDetails>(cacheKey);
  if (cached) return cached;

  try {
    const response = await withDelay(
      tmdbApi.get(`/movie/${movieId}`, {
        params: {
          append_to_response: 'credits,videos,similar',  // Fetch additional data in single call
        },
      })
    );
    setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return null;
  }
};

/**
 * Search for movies by title
 * @param query - Search query string
 * @param page - Page number for pagination (default: 1)
 * @returns Array of matching movies
 */
export const searchMovies = async (query: string, page = 1): Promise<TMDBMovie[]> => {
  if (!query.trim()) return [];

  const cacheKey = `search-${query}-${page}`;
  const cached = getCached<TMDBMovie[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await withDelay(
      tmdbApi.get('/search/movie', { params: { query, page } })
    );
    setCache(cacheKey, response.data.results);
    return response.data.results;
  } catch (error) {
    console.error('Error searching movies:', error);
    return [];
  }
};

/**
 * Get person/actor details with filmography
 * @param personId - TMDB person ID
 * @returns Person details or null if not found
 */
export const getPersonDetails = async (personId: number): Promise<TMDBPerson | null> => {
  const cacheKey = `person-${personId}`;
  const cached = getCached<TMDBPerson>(cacheKey);
  if (cached) return cached;

  try {
    const response = await withDelay(
      tmdbApi.get(`/person/${personId}`, {
        params: {
          append_to_response: 'movie_credits,images',  // Include filmography and photos
        },
      })
    );
    setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching person details:', error);
    return null;
  }
};

/**
 * Discover movies with advanced filters
 * Used by recommendation engine for filtered queries
 * @param params - Filter parameters
 * @returns Array of movies matching filters
 */
export const discoverMovies = async (params: {
  with_genres?: string;                    // Comma-separated genre IDs
  'vote_average.gte'?: number;             // Minimum rating
  'primary_release_date.gte'?: string;     // Release date range start
  'primary_release_date.lte'?: string;     // Release date range end
  with_original_language?: string;         // ISO language code
  'with_runtime.lte'?: number;             // Maximum runtime
  'with_runtime.gte'?: number;             // Minimum runtime
  sort_by?: string;                        // Sort order
  page?: number;                           // Pagination
}): Promise<TMDBMovie[]> => {
  const cacheKey = `discover-${JSON.stringify(params)}`;
  const cached = getCached<TMDBMovie[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await withDelay(
      tmdbApi.get('/discover/movie', { params })
    );
    setCache(cacheKey, response.data.results);
    return response.data.results;
  } catch (error) {
    console.error('Error discovering movies:', error);
    return [];
  }
};

// ============================================
// GENRE UTILITIES
// ============================================

/**
 * TMDB Genre ID to Name mapping
 * Used to display genre names from genre_ids array
 */
export const genreMap: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

/**
 * Get genre ID from genre name
 * Handles common aliases like "sci-fi" -> "Science Fiction"
 * @param genreName - Genre name or alias
 * @returns Genre ID or undefined if not found
 */
export const getGenreId = (genreName: string): number | undefined => {
  const lowerGenre = genreName.toLowerCase();
  const entry = Object.entries(genreMap).find(
    ([, name]) => name.toLowerCase() === lowerGenre || 
    (lowerGenre === 'sci-fi' && name === 'Science Fiction') ||
    (lowerGenre === 'anime' && name === 'Animation')
  );
  return entry ? parseInt(entry[0]) : undefined;
};