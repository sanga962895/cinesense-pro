import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Film, Loader2 } from 'lucide-react';
import { getPersonDetails, TMDBPerson, getImageUrl, TMDBMovie } from '@/api/tmdb';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import MovieModal from '@/components/MovieModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const ActorPage = () => {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<TMDBPerson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getPersonDetails(parseInt(id)).then((data) => {
        setPerson(data);
        setIsLoading(false);
      });
    }
  }, [id]);

  const handleMovieClick = (movie: TMDBMovie) => {
    setSelectedMovieId(movie.id);
    setIsModalOpen(true);
  };

  const calculateAge = (birthday: string, deathday?: string | null): number => {
    const endDate = deathday ? new Date(deathday) : new Date();
    const birthDate = new Date(birthday);
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const m = endDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const sortedFilmography = person?.movie_credits?.cast
    ?.filter(movie => movie.poster_path)
    .sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return dateB - dateA;
    }) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : person ? (
        <main className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Link to="/">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>

          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">
            {/* Profile Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="md:col-span-1"
            >
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={getImageUrl(person.profile_path, 'w500')}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Photo Gallery */}
              {person.images?.profiles && person.images.profiles.length > 1 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Photos</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {person.images.profiles.slice(0, 8).map((image, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="aspect-[2/3] rounded-lg overflow-hidden"
                      >
                        <img
                          src={getImageUrl(image.file_path, 'w200')}
                          alt={`${person.name} photo ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 lg:col-span-3"
            >
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-foreground mb-4">
                {person.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Badge variant="secondary" className="text-sm">
                  {person.known_for_department}
                </Badge>
                {person.birthday && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(person.birthday).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {person.birthday && (
                        <span className="text-foreground ml-1">
                          ({calculateAge(person.birthday, person.deathday)} years old)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {person.place_of_birth && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{person.place_of_birth}</span>
                  </div>
                )}
                {person.deathday && (
                  <div className="text-muted-foreground">
                    Passed: {new Date(person.deathday).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                )}
              </div>

              {/* Biography */}
              {person.biography && (
                <div className="mb-8">
                  <h3 className="font-display text-2xl text-foreground mb-4">Biography</h3>
                  <ScrollArea className="h-64 rounded-lg">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {person.biography}
                    </p>
                  </ScrollArea>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Film className="w-5 h-5" />
                    <span className="font-medium">Movies</span>
                  </div>
                  <p className="font-display text-3xl text-foreground">
                    {sortedFilmography.length}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filmography */}
          {sortedFilmography.length > 0 && (
            <section>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6 flex items-center gap-3">
                <Film className="w-8 h-8 text-primary" />
                Filmography
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
                {sortedFilmography.slice(0, 24).map((movie, index) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    index={index}
                    onClick={() => handleMovieClick(movie)}
                  />
                ))}
              </div>
            </section>
          )}
        </main>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Person not found</p>
        </div>
      )}

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

export default ActorPage;
