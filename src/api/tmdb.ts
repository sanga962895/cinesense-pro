import axios from 'axios';

const TMDB_API_KEY = '76b64f689ed420b78b21d05a0b813306';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;
  genres: { id: number; name: string }[];
  credits?: {
    cast: TMDBCastMember[];
    crew: { id: number; name: string; job: string; profile_path: string | null }[];
  };
  videos?: {
    results: { key: string; type: string; site: string }[];
  };
  similar?: {
    results: TMDBMovie[];
  };
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBPerson {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  movie_credits?: {
    cast: TMDBMovie[];
  };
  images?: {
    profiles: { file_path: string }[];
  };
}

const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

// Add artificial delay for loading states
const withDelay = async <T>(promise: Promise<T>, delay = 700): Promise<T> => {
  const [result] = await Promise.all([
    promise,
    new Promise(resolve => setTimeout(resolve, delay)),
  ]);
  return result;
};

// Cache for API responses
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCached = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
};

const setCache = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

export const getImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500'): string => {
  if (!path) return '/placeholder.svg';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

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

export const getMovieDetails = async (movieId: number): Promise<TMDBMovieDetails | null> => {
  const cacheKey = `movie-${movieId}`;
  const cached = getCached<TMDBMovieDetails>(cacheKey);
  if (cached) return cached;

  try {
    const response = await withDelay(
      tmdbApi.get(`/movie/${movieId}`, {
        params: {
          append_to_response: 'credits,videos,similar',
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

export const getPersonDetails = async (personId: number): Promise<TMDBPerson | null> => {
  const cacheKey = `person-${personId}`;
  const cached = getCached<TMDBPerson>(cacheKey);
  if (cached) return cached;

  try {
    const response = await withDelay(
      tmdbApi.get(`/person/${personId}`, {
        params: {
          append_to_response: 'movie_credits,images',
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

export const discoverMovies = async (params: {
  with_genres?: string;
  'vote_average.gte'?: number;
  'primary_release_date.gte'?: string;
  'primary_release_date.lte'?: string;
  with_original_language?: string;
  'with_runtime.lte'?: number;
  'with_runtime.gte'?: number;
  sort_by?: string;
  page?: number;
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

export const getGenreId = (genreName: string): number | undefined => {
  const lowerGenre = genreName.toLowerCase();
  const entry = Object.entries(genreMap).find(
    ([, name]) => name.toLowerCase() === lowerGenre || 
    (lowerGenre === 'sci-fi' && name === 'Science Fiction') ||
    (lowerGenre === 'anime' && name === 'Animation')
  );
  return entry ? parseInt(entry[0]) : undefined;
};
