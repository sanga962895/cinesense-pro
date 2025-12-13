# 🎬 CineVerse - Movie Recommendation System

A Netflix-style movie recommendation platform built with React, TypeScript, and Firebase.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Integration](#-api-integration)
- [Authentication Flow](#-authentication-flow)
- [Data Flow](#-data-flow)

---

## ✨ Features

- 🎥 Browse trending, popular, top-rated, and upcoming movies
- 🔍 Search movies with debounced input
- 📋 Watchlist with cloud sync (Firebase Firestore)
- 🔐 Email/password authentication
- 🎭 Actor detail pages with filmography
- 🎯 Smart recommendation engine
- 🌙 Dark/Light mode toggle
- 📱 Fully responsive design

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | TailwindCSS, Framer Motion |
| State | TanStack Query, React Context |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| APIs | TMDB API, OMDb API |
| UI Components | shadcn/ui, Radix UI |

---

## 🏗 Architecture

### Component Hierarchy

```
App.tsx
├── AuthProvider (Context)
│   ├── QueryClientProvider
│   │   └── BrowserRouter
│   │       ├── / → Index.tsx (Home)
│   │       │   ├── Navbar
│   │       │   ├── MovieForm (Filters)
│   │       │   ├── MovieRow[] (Trending, Popular, etc.)
│   │       │   │   └── MovieCard[]
│   │       │   └── MovieModal
│   │       │
│   │       ├── /login → LoginPage.tsx
│   │       ├── /register → RegisterPage.tsx
│   │       ├── /actor/:id → ActorPage.tsx
│   │       │
│   │       └── /watchlist → ProtectedRoute
│   │           └── WatchlistPage.tsx
│   │               └── MovieCard[]
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│   │  Navbar  │    │MovieForm │    │ MovieRow │    │  Modal   │ │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘ │
│        │               │               │               │        │
└────────┼───────────────┼───────────────┼───────────────┼────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HOOKS & CONTEXT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐ │
│   │  useAuth()     │  │useWatchlistSync│  │  useDebounce()   │ │
│   │  (AuthContext) │  │  (Firestore)   │  │  (Search)        │ │
│   └───────┬────────┘  └───────┬────────┘  └────────┬─────────┘ │
│           │                   │                    │            │
└───────────┼───────────────────┼────────────────────┼────────────┘
            │                   │                    │
            ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐ │
│   │  Firebase Auth │  │   Firestore    │  │   TMDB + OMDb    │ │
│   │  (Email/Pass)  │  │  (Watchlist)   │  │   (Movie Data)   │ │
│   └────────────────┘  └────────────────┘  └──────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **bun** package manager
- **Git** - [Download](https://git-scm.com/)

### Installation Steps

#### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd cineverse
```

#### Step 2: Install Dependencies

```bash
# Using npm
npm install

# OR using bun (faster)
bun install
```

#### Step 3: Environment Setup

The project uses these API keys (already configured):
- **TMDB API** - For movie data, trailers, cast
- **OMDb API** - For ratings, awards, details
- **Firebase** - For authentication & database

#### Step 4: Run Development Server

```bash
# Using npm
npm run dev

# OR using bun
bun run dev
```

#### Step 5: Open in Browser

Navigate to: `http://localhost:5173`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── api/                    # API integration layer
│   ├── tmdb.ts            # TMDB API calls (trending, popular, cast)
│   └── omdb.ts            # OMDb API calls (ratings, awards)
│
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components (Button, Card, etc.)
│   ├── MovieCard.tsx     # Individual movie card with poster
│   ├── MovieRow.tsx      # Horizontal scrolling movie row
│   ├── MovieModal.tsx    # Full movie details modal
│   ├── MovieForm.tsx     # Filter/search form
│   ├── Navbar.tsx        # Top navigation bar
│   ├── ProtectedRoute.tsx # Auth guard for routes
│   └── ThemeToggle.tsx   # Dark/light mode switch
│
├── contexts/             # React Context providers
│   └── AuthContext.tsx   # Firebase auth state management
│
├── hooks/                # Custom React hooks
│   ├── useWatchlistSync.ts # Watchlist with Firestore sync
│   ├── useDebounce.ts    # Debounced search input
│   └── useTheme.ts       # Theme persistence
│
├── lib/                  # Utility libraries
│   ├── firebase.ts       # Firebase configuration
│   ├── recommendation.ts # Movie recommendation algorithm
│   └── utils.ts          # Helper functions
│
├── pages/                # Route components
│   ├── Index.tsx         # Home page with movie rows
│   ├── LoginPage.tsx     # User login
│   ├── RegisterPage.tsx  # User registration
│   ├── WatchlistPage.tsx # Saved movies (protected)
│   ├── ActorPage.tsx     # Actor details & filmography
│   └── NotFound.tsx      # 404 page
│
├── data/                 # Static data
│   └── moviesData.ts     # Fallback movie dataset
│
├── App.tsx               # Root component with routes
├── main.tsx              # Entry point
└── index.css             # Global styles & theme tokens
```

---

## 🔌 API Integration

### TMDB API (The Movie Database)

**Used for:**
- Trending/Popular/Top-rated/Upcoming movies
- Movie trailers (YouTube links)
- Cast & crew information
- Actor biographies & filmography
- Movie posters & backdrops

```typescript
// Example: Fetch trending movies
const movies = await fetchTrendingMovies();
```

### OMDb API (Open Movie Database)

**Used for:**
- IMDb ratings
- Rotten Tomatoes scores
- Box office data
- Awards information
- Detailed plot summaries

```typescript
// Example: Get movie details
const details = await fetchMovieDetails(imdbId);
```

---

## 🔐 Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  User    │────▶│  LoginPage   │────▶│  Firebase   │
│  Opens   │     │  or Register │     │  Auth       │
│  App     │     └──────────────┘     └──────┬──────┘
└──────────┘                                 │
                                             ▼
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  Access  │◀────│  AuthContext │◀────│  User       │
│  Protected│    │  Updates     │     │  Credential │
│  Routes  │     └──────────────┘     └─────────────┘
└──────────┘
```

### Key Files:
- `src/contexts/AuthContext.tsx` - Auth state & methods
- `src/lib/firebase.ts` - Firebase configuration
- `src/components/ProtectedRoute.tsx` - Route guard

---

## 📊 Data Flow

### Watchlist Sync Strategy

```
┌─────────────┐
│  User adds  │
│  movie to   │
│  watchlist  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  Save to    │────▶│  If logged  │
│ localStorage│     │  in, sync   │
│ (immediate) │     │  to Firestore│
└─────────────┘     └─────────────┘

On Login:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Fetch      │────▶│   Merge &   │────▶│  Update     │
│  Firestore  │     │   Dedupe    │     │  Both       │
│  watchlist  │     │   by ID     │     │  Sources    │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 🎨 Theming

The app uses CSS variables for theming. Colors are defined in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 142 76% 36%;
  /* ... more tokens */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... dark mode overrides */
}
```

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

This project is for educational purposes.

---

Built with ❤️ using [Lovable](https://lovable.dev)
