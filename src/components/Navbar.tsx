import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, Bookmark, Film, Flame, Star, Calendar } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

const Navbar = ({ onSearch, searchQuery = '' }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { watchlistCount } = useWatchlist();
  const location = useLocation();
  const debouncedSearch = useDebounce(localSearchQuery, 300);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);

  const navLinks = [
    { to: '/', label: 'Home', icon: Film },
    { to: '/?section=trending', label: 'Trending', icon: Flame },
    { to: '/?section=top-rated', label: 'Top Rated', icon: Star },
    { to: '/?section=upcoming', label: 'Upcoming', icon: Calendar },
    { to: '/watchlist', label: 'Watchlist', icon: Bookmark, badge: watchlistCount },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'glass-effect shadow-lg' 
            : 'bg-gradient-to-b from-background/80 to-transparent'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"
              >
                <Film className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <span className="font-display text-2xl md:text-3xl tracking-wider text-foreground">
                CINEVERSE
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to.split('?')[0] && 
                  (link.to.includes('?') 
                    ? location.search.includes(link.to.split('?')[1]) 
                    : !location.search);
                
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{link.label}</span>
                    {link.badge && link.badge > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                        {link.badge}
                      </Badge>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Search & Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Search Bar */}
              <motion.div
                animate={{ width: isSearchFocused ? 280 : 200 }}
                className="hidden md:flex items-center relative"
              >
                <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search movies..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="pl-10 bg-secondary/50 border-border/50 focus:border-primary transition-all"
                />
              </motion.div>

              <ThemeToggle />

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-card border-l border-border z-50 lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-display text-xl">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Mobile Search */}
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search movies..."
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              <nav className="p-4 space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="font-medium">{link.label}</span>
                      {link.badge && link.badge > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {link.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16 md:h-20" />
    </>
  );
};

export default Navbar;
