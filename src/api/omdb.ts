import axios from 'axios';

const OMDB_API_KEY = 'e5577f27';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

export interface OMDBMovie {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: { Source: string; Value: string }[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
  Error?: string;
}

const omdbApi = axios.create({
  baseURL: OMDB_BASE_URL,
  params: {
    apikey: OMDB_API_KEY,
  },
});

// Cache for API responses
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

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

export const getMovieByImdbId = async (imdbId: string): Promise<OMDBMovie | null> => {
  const cacheKey = `omdb-${imdbId}`;
  const cached = getCached<OMDBMovie>(cacheKey);
  if (cached) return cached;

  try {
    const response = await omdbApi.get('/', {
      params: { i: imdbId, plot: 'full' },
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

export const getMovieByTitle = async (title: string, year?: number): Promise<OMDBMovie | null> => {
  const cacheKey = `omdb-title-${title}-${year}`;
  const cached = getCached<OMDBMovie>(cacheKey);
  if (cached) return cached;

  try {
    const params: Record<string, string | number> = { t: title, plot: 'full' };
    if (year) params.y = year;

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

export const searchOMDB = async (query: string, page = 1): Promise<{ movies: OMDBMovie[]; totalResults: number }> => {
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

export const parseRatings = (ratings: { Source: string; Value: string }[]): Record<string, number> => {
  const parsed: Record<string, number> = {};
  
  ratings.forEach(rating => {
    if (rating.Source === 'Internet Movie Database') {
      parsed.imdb = parseFloat(rating.Value.split('/')[0]);
    } else if (rating.Source === 'Rotten Tomatoes') {
      parsed.rottenTomatoes = parseInt(rating.Value);
    } else if (rating.Source === 'Metacritic') {
      parsed.metacritic = parseInt(rating.Value.split('/')[0]);
    }
  });
  
  return parsed;
};

export const parseRuntime = (runtime: string): number => {
  const match = runtime.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

export const parseActors = (actors: string): string[] => {
  return actors.split(', ').filter(Boolean);
};
