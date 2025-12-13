/**
 * OMDb API Client
 * 
 * Handles interactions with the Open Movie Database (OMDb) API.
 * OMDb is used as a supplementary data source for additional movie information.
 * 
 * Responsibilities:
 * - Fetch additional ratings (IMDb, Rotten Tomatoes, Metacritic)
 * - Get awards information
 * - Get detailed plot descriptions
 * - Get director and actor information
 * 
 * Why use OMDb alongside TMDB?
 * - OMDb provides Rotten Tomatoes and Metacritic scores
 * - More detailed awards information
 * - Different plot summaries (can be longer/more detailed)
 * 
 * Features:
 * - Response caching (10 minute TTL)
 * - Search by IMDb ID or title
 * - Rating parsing utilities
 */

import axios from 'axios';

// API Configuration
const OMDB_API_KEY = 'e5577f27';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Full movie data from OMDb API
 * Note: OMDb uses PascalCase for property names
 */
export interface OMDBMovie {
  Title: string;
  Year: string;
  Rated: string;           // Content rating (PG, R, etc.)
  Released: string;        // Full release date string
  Runtime: string;         // e.g., "142 min"
  Genre: string;           // Comma-separated genres
  Director: string;
  Writer: string;
  Actors: string;          // Comma-separated actor names
  Plot: string;            // Movie description
  Language: string;
  Country: string;
  Awards: string;          // Awards description
  Poster: string;          // Poster URL
  Ratings: { Source: string; Value: string }[];  // Multiple rating sources
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;            // "movie", "series", etc.
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;        // "True" or "False"
  Error?: string;          // Error message if Response is "False"
}

// ============================================
// API CLIENT SETUP
// ============================================

/**
 * Axios instance with OMDb base configuration
 * API key is automatically added to all requests
 */
const omdbApi = axios.create({
  baseURL: OMDB_BASE_URL,
  params: {
    apikey: OMDB_API_KEY,
  },
});

// ============================================
// CACHING LAYER
// ============================================

/**
 * In-memory cache for API responses
 * Longer TTL than TMDB since OMDb data changes less frequently
 */
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

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
// API METHODS
// ============================================

/**
 * Fetch movie by IMDb ID
 * Most reliable way to get exact movie match
 * @param imdbId - IMDb ID (e.g., "tt0111161")
 * @returns OMDb movie data or null if not found
 */
export const getMovieByImdbId = async (imdbId: string): Promise<OMDBMovie | null> => {
  const cacheKey = `omdb-${imdbId}`;
  const cached = getCached<OMDBMovie>(cacheKey);
  if (cached) return cached;

  try {
    const response = await omdbApi.get('/', {
      params: { i: imdbId, plot: 'full' },  // 'full' gets complete plot description
    });
    
    if (response.data.Response === 'True') {
      setCache(cacheKey, response.data);
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching movie from OMDb:', error);
    return null;
  }
};

/**
 * Fetch movie by title (and optionally year)
 * Used when IMDb ID is not available
 * @param title - Movie title
 * @param year - Release year (optional, helps with accuracy)
 * @returns OMDb movie data or null if not found
 */
export const getMovieByTitle = async (title: string, year?: number): Promise<OMDBMovie | null> => {
  const cacheKey = `omdb-title-${title}-${year}`;
  const cached = getCached<OMDBMovie>(cacheKey);
  if (cached) return cached;

  try {
    const params: Record<string, string | number> = { t: title, plot: 'full' };
    if (year) params.y = year;  // Add year for more accurate matching

    const response = await omdbApi.get('/', { params });
    
    if (response.data.Response === 'True') {
      setCache(cacheKey, response.data);
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching movie from OMDb:', error);
    return null;
  }
};

/**
 * Search for movies by query
 * Returns multiple results (useful for browsing)
 * @param query - Search query
 * @param page - Page number (default: 1)
 * @returns Object with movies array and total count
 */
export const searchOMDB = async (
  query: string, 
  page = 1
): Promise<{ movies: OMDBMovie[]; totalResults: number }> => {
  const cacheKey = `omdb-search-${query}-${page}`;
  const cached = getCached<{ movies: OMDBMovie[]; totalResults: number }>(cacheKey);
  if (cached) return cached;

  try {
    const response = await omdbApi.get('/', {
      params: { s: query, page, type: 'movie' },
    });
    
    if (response.data.Response === 'True') {
      const result = {
        movies: response.data.Search,
        totalResults: parseInt(response.data.totalResults),
      };
      setCache(cacheKey, result);
      return result;
    }
    return { movies: [], totalResults: 0 };
  } catch (error) {
    console.error('Error searching OMDb:', error);
    return { movies: [], totalResults: 0 };
  }
};

// ============================================
// PARSING UTILITIES
// ============================================

/**
 * Parse OMDb ratings array into a normalized object
 * Converts different rating formats to consistent numbers
 * 
 * @param ratings - OMDb ratings array
 * @returns Object with numeric ratings for each source
 * 
 * Example input:
 * [
 *   { Source: "Internet Movie Database", Value: "8.8/10" },
 *   { Source: "Rotten Tomatoes", Value: "93%" },
 *   { Source: "Metacritic", Value: "84/100" }
 * ]
 * 
 * Example output:
 * { imdb: 8.8, rottenTomatoes: 93, metacritic: 84 }
 */
export const parseRatings = (ratings: { Source: string; Value: string }[]): Record<string, number> => {
  const parsed: Record<string, number> = {};
  
  ratings.forEach(rating => {
    if (rating.Source === 'Internet Movie Database') {
      // Format: "8.8/10" -> 8.8
      parsed.imdb = parseFloat(rating.Value.split('/')[0]);
    } else if (rating.Source === 'Rotten Tomatoes') {
      // Format: "93%" -> 93
      parsed.rottenTomatoes = parseInt(rating.Value);
    } else if (rating.Source === 'Metacritic') {
      // Format: "84/100" -> 84
      parsed.metacritic = parseInt(rating.Value.split('/')[0]);
    }
  });
  
  return parsed;
};

/**
 * Parse runtime string to number of minutes
 * @param runtime - Runtime string (e.g., "142 min")
 * @returns Runtime in minutes or 0 if invalid
 */
export const parseRuntime = (runtime: string): number => {
  const match = runtime.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

/**
 * Parse comma-separated actors string to array
 * @param actors - Actors string (e.g., "Tom Hanks, Tim Allen, Don Rickles")
 * @returns Array of actor names
 */
export const parseActors = (actors: string): string[] => {
  return actors.split(', ').filter(Boolean);
};