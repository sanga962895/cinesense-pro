/**
 * Navbar Component
 * 
 * The main navigation header for the CineVerse application.
 * Provides navigation links, search functionality, and user authentication controls.
 * 
 * Features:
 * - Responsive design with desktop and mobile layouts
 * - Glassmorphism effect on scroll
 * - Debounced search input
 * - Theme toggle (dark/light mode)
 * - User authentication state display
 * - Mobile slide-out menu with animations
 * - Watchlist badge with item count
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, Bookmark, Film, Flame, Star, Calendar, LogIn, LogOut, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlistSync } from '@/hooks/useWatchlistSync';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

/**
 * Props for Navbar component
 * @property onSearch - Callback when search query changes
 * @property searchQuery - Current search query value
 */
interface NavbarProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

const Navbar = ({ onSearch, searchQuery = '' }: NavbarProps) => {
  // Track scroll position for glassmorphism effect
  const [isScrolled, setIsScrolled] = useState(false);
  // Mobile menu open/close state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Local search input state
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  // Track search input focus for width animation
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Auth context for user state and logout
  const { user, logout } = useAuth();
  // Get watchlist count for badge
  const { watchlistCount } = useWatchlistSync(user);
  
  // React Router hooks
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Debounce search to prevent excessive API calls
  const debouncedSearch = useDebounce(localSearchQuery, 300);

  /**
   * Add scroll listener to apply glassmorphism effect
   * Effect activates when scrolled more than 50px
   */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Trigger search callback when debounced value changes
   * This prevents excessive API calls while typing
   */
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);

  /**
   * Handle user logout with toast notifications
   * Navigates to home page after successful logout
   */
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Navigation links configuration
   * Each link has an icon, label, and optional badge count
   */
  const navLinks = [
    { to: '/', label: 'Home', icon: Film, section: null },
    { to: '/?section=trending', label: 'Trending', icon: Flame, section: 'trending' },
    { to: '/?section=top-rated', label: 'Top Rated', icon: Star, section: 'top-rated' },
    { to: '/?section=upcoming', label: 'Upcoming', icon: Calendar, section: 'upcoming' },
    { to: '/watchlist', label: 'Watchlist', icon: Bookmark, badge: watchlistCount, section: undefined },
  ];

  /**
   * Handle navigation link click
   * For home page sections, use setSearchParams to properly update URL
   */
  const handleNavClick = (e: React.MouseEvent, link: typeof navLinks[0]) => {
    if (location.pathname === '/' && link.section !== undefined) {
      e.preventDefault();
      if (link.section === null) {
        // Home - clear section param
        setSearchParams({});
      } else {
        // Section - set section param
        setSearchParams({ section: link.section });
      }
    }
  };

  return (
    <>
      {/* Main Header - Fixed to top */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'glass-effect shadow-lg'  // Glassmorphism when scrolled
            : 'bg-gradient-to-b from-background/80 to-transparent' // Transparent gradient at top
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

            {/* ============================================
                DESKTOP NAVIGATION
                ============================================ */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                // Determine if this link is currently active
                const isActive = location.pathname === link.to.split('?')[0] && 
                  (link.to.includes('?') 
                    ? location.search.includes(link.to.split('?')[1]) 
                    : !location.search);
                
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={(e) => handleNavClick(e, link)}
                    className={`relative px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{link.label}</span>
                    {/* Badge for watchlist count */}
                    {link.badge && link.badge > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                        {link.badge}
                      </Badge>
                    )}
                    {/* Animated underline for active link */}
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

            {/* ============================================
                SEARCH & ACTIONS
                ============================================ */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Desktop Search Bar - Expands on focus */}
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

              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Desktop Auth Button */}
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Logout</span>
                </Button>
              ) : (
                <Link to="/login" className="hidden md:block">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    <span className="hidden lg:inline">Login</span>
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Toggle Button */}
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

      {/* ============================================
          MOBILE MENU - Slide-out drawer
          ============================================ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Slide-out menu panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-card border-l border-border z-50 lg:hidden"
            >
              {/* Menu Header */}
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

              {/* User Info Section (if logged in) */}
              {user && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Signed in</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Search Bar */}
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

              {/* Mobile Navigation Links */}
              <nav className="p-4 space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={(e) => {
                        handleNavClick(e, link);
                        setIsMobileMenuOpen(false);
                      }}
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

                {/* Mobile Auth Links */}
                <div className="pt-4 border-t border-border">
                  {user ? (
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors w-full"
                    >
                      <LogOut className="w-5 h-5 text-destructive" />
                      <span className="font-medium">Logout</span>
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <LogIn className="w-5 h-5 text-primary" />
                      <span className="font-medium">Login</span>
                    </Link>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from hiding under fixed header */}
      <div className="h-16 md:h-20" />
    </>
  );
};

export default Navbar;