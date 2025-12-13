# CineVerse Architecture Documentation

## Overview

CineVerse follows a modular React architecture with clear separation of concerns.

---

## Core Concepts

### 1. Component Layer

Components are organized by responsibility:

```
components/
├── ui/          → Base UI primitives (Button, Card, Input)
├── Movie*.tsx   → Movie-specific components
├── Nav*.tsx     → Navigation components
└── *Route.tsx   → Route wrappers
```

**Design Principles:**
- Single responsibility per component
- Props-driven configuration
- Composition over inheritance

### 2. Context Layer

Global state management using React Context:

```typescript
// AuthContext provides:
interface AuthContextType {
  user: User | null;      // Current Firebase user
  loading: boolean;       // Auth state loading
  signup: (email, password) => Promise<void>;
  login: (email, password) => Promise<void>;
  logout: () => Promise<void>;
}
```

### 3. Hooks Layer

Custom hooks encapsulate reusable logic:

| Hook | Purpose |
|------|---------|
| `useAuth` | Access auth context |
| `useWatchlistSync` | Manage watchlist with cloud sync |
| `useDebounce` | Debounce search input |
| `useTheme` | Theme persistence |

### 4. API Layer

API calls are centralized in `/api`:

```typescript
// tmdb.ts - Movie data from TMDB
fetchTrendingMovies()
fetchPopularMovies()
fetchMovieTrailer(movieId)
fetchActorDetails(actorId)

// omdb.ts - Enrichment from OMDb
fetchMovieDetails(imdbId)
```

---

## Data Flow Patterns

### Pattern 1: API → Component

```
User navigates → useQuery hook → API call → Cache → Render
```

### Pattern 2: User Action → State → Persist

```
Click watchlist → Local state → localStorage → Firestore (if logged in)
```

### Pattern 3: Auth State Change

```
Firebase event → AuthContext → Re-render protected routes
```

---

## File Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| `PascalCase.tsx` | `MovieCard.tsx` | React components |
| `camelCase.ts` | `tmdb.ts` | Utilities, APIs |
| `use*.ts` | `useDebounce.ts` | Custom hooks |
| `*Context.tsx` | `AuthContext.tsx` | Context providers |
| `*Page.tsx` | `LoginPage.tsx` | Route pages |

---

## Security Considerations

1. **Firebase Rules**: Firestore restricts user data access to owner only
2. **Protected Routes**: `/watchlist` requires authentication
3. **API Keys**: Stored in source (consider env vars for production)

---

## Performance Optimizations

1. **React Query Caching**: API responses cached to reduce requests
2. **Debounced Search**: Prevents excessive API calls while typing
3. **Lazy Loading**: Images load on demand
4. **Code Splitting**: Routes can be lazy-loaded (future enhancement)

---

## State Management Strategy

| State Type | Solution | Example |
|------------|----------|---------|
| Server State | TanStack Query | Movie lists, actor data |
| Auth State | React Context | User session |
| Local State | useState | Modal open/close |
| Persisted State | localStorage + Firestore | Watchlist, theme |
