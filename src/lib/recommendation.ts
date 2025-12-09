import { TMDBMovie, genreMap } from '@/api/tmdb';
import { moviesData, Movie } from '@/data/moviesData';

export interface RecommendationFilters {
  genres: string[];
  moods: string[];
  minRating: number;
  language: string;
  yearRange: { min: number; max: number };
  runtime: 'short' | 'long' | 'any';
  searchQuery: string;
}

export interface ScoredMovie extends Movie {
  score: number;
  matchReasons: string[];
}

const calculateGenreScore = (movie: Movie, selectedGenres: string[]): number => {
  if (selectedGenres.length === 0) return 1;
  const matchCount = movie.genre.filter(g => 
    selectedGenres.includes(g.toLowerCase())
  ).length;
  return matchCount / selectedGenres.length;
};

const calculateMoodScore = (movie: Movie, selectedMoods: string[]): number => {
  if (selectedMoods.length === 0) return 1;
  const matchCount = movie.mood_tags.filter(m => 
    selectedMoods.includes(m.toLowerCase())
  ).length;
  return matchCount / selectedMoods.length;
};

const calculateRatingScore = (rating: number): number => {
  return rating / 10;
};

const calculateRecencyScore = (year: number): number => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  return Math.max(0, 1 - age / 50);
};

const calculateAwardsScore = (awards: string[]): number => {
  const awardCount = awards.length;
  if (awardCount >= 3) return 1;
  if (awardCount >= 2) return 0.8;
  if (awardCount >= 1) return 0.6;
  return 0.3;
};

export const getRecommendations = (filters: RecommendationFilters): ScoredMovie[] => {
  let filteredMovies = [...moviesData];

  // Apply hard filters
  if (filters.genres.length > 0) {
    filteredMovies = filteredMovies.filter(movie =>
      movie.genre.some(g => filters.genres.includes(g.toLowerCase()))
    );
  }

  if (filters.minRating > 0) {
    filteredMovies = filteredMovies.filter(movie => movie.rating >= filters.minRating);
  }

  if (filters.language && filters.language !== 'all') {
    filteredMovies = filteredMovies.filter(movie => 
      movie.language.toLowerCase() === filters.language.toLowerCase()
    );
  }

  if (filters.yearRange) {
    filteredMovies = filteredMovies.filter(movie =>
      movie.release_year >= filters.yearRange.min && 
      movie.release_year <= filters.yearRange.max
    );
  }

  if (filters.runtime !== 'any') {
    filteredMovies = filteredMovies.filter(movie => {
      if (filters.runtime === 'short') return movie.runtime < 120;
      if (filters.runtime === 'long') return movie.runtime >= 120;
      return true;
    });
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredMovies = filteredMovies.filter(movie =>
      movie.title.toLowerCase().includes(query) ||
      movie.actors.some(a => a.toLowerCase().includes(query)) ||
      movie.director.toLowerCase().includes(query)
    );
  }

  // Score and rank movies
  const scoredMovies: ScoredMovie[] = filteredMovies.map(movie => {
    const genreScore = calculateGenreScore(movie, filters.genres) * 0.3;
    const moodScore = calculateMoodScore(movie, filters.moods) * 0.25;
    const ratingScore = calculateRatingScore(movie.rating) * 0.25;
    const recencyScore = calculateRecencyScore(movie.release_year) * 0.1;
    const awardsScore = calculateAwardsScore(movie.awards) * 0.1;

    const totalScore = genreScore + moodScore + ratingScore + recencyScore + awardsScore;

    const matchReasons: string[] = [];
    if (genreScore > 0.15) matchReasons.push('Genre match');
    if (moodScore > 0.12) matchReasons.push('Mood match');
    if (movie.rating >= 8.5) matchReasons.push('Highly rated');
    if (movie.awards.length > 0) matchReasons.push('Award winning');
    if (movie.release_year >= 2020) matchReasons.push('Recent release');

    return {
      ...movie,
      score: totalScore,
      matchReasons,
    };
  });

  // Sort by score and return top 10
  return scoredMovies
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
};

export const getSimilarMovies = (movie: Movie): Movie[] => {
  const similar = moviesData.filter(m => {
    if (m.id === movie.id) return false;
    
    const genreMatch = m.genre.some(g => movie.genre.includes(g));
    const moodMatch = m.mood_tags.some(t => movie.mood_tags.includes(t));
    const directorMatch = m.director === movie.director;
    
    return genreMatch || moodMatch || directorMatch;
  });

  // Score by similarity
  const scored = similar.map(m => {
    let score = 0;
    const genreOverlap = m.genre.filter(g => movie.genre.includes(g)).length;
    const moodOverlap = m.mood_tags.filter(t => movie.mood_tags.includes(t)).length;
    
    score += genreOverlap * 2;
    score += moodOverlap * 1.5;
    if (m.director === movie.director) score += 3;
    if (Math.abs(m.rating - movie.rating) < 0.5) score += 1;
    
    return { ...m, similarityScore: score };
  });

  return scored
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 6);
};

export const convertTMDBToLocalFormat = (tmdbMovie: TMDBMovie): Partial<Movie> => {
  const genres = tmdbMovie.genre_ids
    .map(id => genreMap[id]?.toLowerCase())
    .filter(Boolean);

  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title,
    poster_url: tmdbMovie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` 
      : '',
    backdrop_url: tmdbMovie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}`
      : undefined,
    genre: genres as string[],
    rating: Math.round(tmdbMovie.vote_average * 10) / 10,
    release_year: tmdbMovie.release_date 
      ? parseInt(tmdbMovie.release_date.split('-')[0]) 
      : 0,
    description: tmdbMovie.overview,
  };
};
