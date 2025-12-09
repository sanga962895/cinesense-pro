import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Filter, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { genres, moods, languages, yearRanges, runtimeOptions } from '@/data/moviesData';
import { RecommendationFilters } from '@/lib/recommendation';

interface MovieFormProps {
  filters: RecommendationFilters;
  onFiltersChange: (filters: RecommendationFilters) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const MovieForm = ({ filters, onFiltersChange, onSubmit, isLoading }: MovieFormProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleGenre = (genre: string) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter(g => g !== genre)
      : [...filters.genres, genre];
    onFiltersChange({ ...filters, genres: newGenres });
  };

  const toggleMood = (mood: string) => {
    const newMoods = filters.moods.includes(mood)
      ? filters.moods.filter(m => m !== mood)
      : [...filters.moods, mood];
    onFiltersChange({ ...filters, moods: newMoods });
  };

  const resetFilters = () => {
    onFiltersChange({
      genres: [],
      moods: [],
      minRating: 0,
      language: 'all',
      yearRange: { min: 1900, max: 2024 },
      runtime: 'any',
      searchQuery: '',
    });
  };

  const activeFiltersCount = 
    filters.genres.length + 
    filters.moods.length + 
    (filters.minRating > 0 ? 1 : 0) + 
    (filters.language !== 'all' ? 1 : 0) +
    (filters.runtime !== 'any' ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-6 mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Filter className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground">Find Your Perfect Movie</h2>
            <p className="text-sm text-muted-foreground">Use filters to discover personalized recommendations</p>
          </div>
        </div>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Genre Selection */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Genres</label>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <motion.button
                key={genre.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleGenre(genre.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filters.genres.includes(genre.value)
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {genre.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Mood Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Mood</label>
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
              <motion.button
                key={mood.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleMood(mood.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  filters.moods.includes(mood.value)
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <span>{mood.emoji}</span>
                {mood.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Expandable Filters */}
        <motion.div
          animate={{ height: isExpanded ? 'auto' : 0 }}
          className="overflow-hidden"
        >
          <div className="pt-4 space-y-6 border-t border-border">
            {/* Rating Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-foreground">Minimum Rating</label>
                <span className="text-sm text-primary font-semibold">
                  {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}
                </span>
              </div>
              <Slider
                value={[filters.minRating]}
                onValueChange={([value]) => onFiltersChange({ ...filters, minRating: value })}
                max={9}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Any</span>
                <span>9+</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Language */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Language</label>
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onFiltersChange({ ...filters, language: 'all' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filters.language === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    All
                  </motion.button>
                  {languages.map((lang) => (
                    <motion.button
                      key={lang.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onFiltersChange({ ...filters, language: lang.value })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filters.language === lang.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {lang.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Year Range */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Release Era</label>
                <div className="flex flex-wrap gap-2">
                  {yearRanges.map((range) => (
                    <motion.button
                      key={range.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onFiltersChange({ 
                        ...filters, 
                        yearRange: { min: range.min, max: range.max } 
                      })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filters.yearRange.min === range.min && filters.yearRange.max === range.max
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {range.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Runtime */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Runtime</label>
                <div className="flex flex-wrap gap-2">
                  {runtimeOptions.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onFiltersChange({ 
                        ...filters, 
                        runtime: opt.value as 'short' | 'long' | 'any'
                      })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filters.runtime === opt.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Toggle & Submit */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground"
          >
            <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            {isExpanded ? 'Less Filters' : 'More Filters'}
          </Button>
          
          <Button
            onClick={onSubmit}
            disabled={isLoading}
            className="flex-1 md:flex-none md:px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
              />
            ) : (
              'Get Recommendations'
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieForm;
