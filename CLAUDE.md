  # CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inherit is an AI-powered personalized coding education platform built with Next.js 14 App Router. It combines traditional learning principles with modern technology, featuring video-based learning, AI-generated roadmaps, time-based coding quests, and community discussion features.

## Commands

### Development
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server  
npm run lint         # Run ESLint
```

### Testing
The project uses custom testing scripts in `/scripts`:
```bash
node scripts/test-error-handling.js      # Test error handling across APIs
node scripts/test-validation.js          # Test input validation
node scripts/test-rate-limiting.js       # Test rate limiting
```

## Architecture

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Authentication**: Dual system - Clerk (users) + JWT (admin)  
- **Database**: MongoDB with Mongoose ODM
- **Styling**: Tailwind CSS + Shadcn/ui + CSS Variables
- **Validation**: Zod schemas with centralized validation utilities
- **Real-time**: Pusher for WebSockets, Socket.io rewrites
- **Code Editor**: Monaco Editor for playground features
- **AI Services**: Groq SDK, YouTube API integration

### Directory Structure
```
app/
├── api/              # API routes (REST + App Router)
├── admin/            # Admin panel (JWT auth)
├── dashboard/        # User dashboard (Clerk auth)
├── learn/            # Video learning platform
├── quests/           # Time-based coding challenges
├── roadmaps/         # AI-generated learning paths
└── components/       # App-specific components

lib/
├── actions/          # Server actions for data operations
├── models/           # Mongoose schemas (User, Quest, Question, etc.)
├── validation/       # Zod schemas and validation utilities
├── ratelimit/        # Rate limiting with memory store
├── mongodb/          # Database connection (singleton pattern)
└── errors/           # Error handling and API response utilities

components/
├── ui/               # Shadcn/ui base components
├── layout/           # Layout-specific components
└── shared/           # Cross-domain shared components
```

### Authentication System
The middleware implements dual authentication:

1. **Admin Routes** (`/admin/*`, `/api/admin/*`): JWT-based with bcrypt
   - Tokens in Authorization header or `adminToken` cookie
   - Secret: `ADMIN_JWT_SECRET` environment variable
   - Redirects to `/admin/login` on failure

2. **User Routes**: Clerk authentication
   - Public routes: `/`, `/sign-in`, `/sign-up`, `/api/video-search`, `/api/voice-routing`  
   - Quest APIs are public read, authenticated write
   - Webhooks ignored: `/api/webhooks(.*)`

### Database Architecture
MongoDB with singleton connection pattern in `lib/mongodb/mongoose.js`:

**Core Models:**
- **User**: Clerk integration (clerkId, email, userName)
- **Quest**: Coding challenges with time limits and categories
- **Question**: Community discussion with voting system
- **Roadmap**: AI-generated learning paths with progress tracking
- **Attempt**: User submission tracking for quests

**Connection:** Singleton pattern ensures one connection per serverless function.

### API Patterns
REST APIs follow consistent patterns:

**Structure:**
```
/api/admin/*      # JWT authentication required
/api/quests/*     # Public read, auth write
/api/questions/*  # Community features (voting, replies)  
/api/attempts/*   # User submission tracking
/api/leaderboard  # Competition rankings
/api/webhooks/*   # External integrations (Clerk)
```

**Standards:**
- Zod validation on all inputs via `lib/validation`
- Rate limiting per endpoint (`lib/ratelimit`)
- Structured error responses (`lib/errors/apiResponse.js`)
- Request/response logging (`lib/logger`)
- MongoDB ObjectId validation utilities

### Component Architecture

**UI Framework:** Shadcn/ui built on Radix UI primitives
- CSS variables for theming (`tailwind.config.js`)
- Class Variance Authority (CVA) for component variants
- Framer Motion for animations
- Multiple icon libraries (Lucide React, React Icons)

**State Management:**
- React hooks for local state
- Custom hooks: `useApiError`, `useRoadmapProgress`
- Context-based layout management
- Real-time updates via Pusher

### Rate Limiting
Memory-based rate limiting (production-ready for Redis):
- Different limits per endpoint type
- Configurable windows and request counts
- Located in `lib/ratelimit/`
- Middleware applies limits before authentication

### Validation System
Centralized Zod validation in `lib/validation/`:
- Schema organization by domain (auth, quest, question, etc.)
- Helper functions: `validateRequest()`, `isValidMongoId()`
- Consistent error response formatting
- Input sanitization and type safety

### Error Handling  
Comprehensive error handling system:
- Global error boundaries (`app/error.jsx`, `app/global-error.jsx`)
- API response utilities (`lib/errors/apiResponse.js`)
- Custom hooks for error state (`hooks/useApiError.js`)
- Winston logging with structured data

## Key Configuration

### Environment Variables Required
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
WEBHOOK_SECRET=

# MongoDB  
MONGODB_URI=
  
# Admin JWT
ADMIN_JWT_SECRET=

# AI Services
GROQ_API_KEY=
NEXT_PUBLIC_YOUTUBE_API_KEY=

# URLs
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### Path Aliases
`jsconfig.json` configures `@/*` to point to root directory for clean imports.

### Socket.io Configuration
`next.config.js` rewrites `/socket.io/*` to `/api/socket` for WebSocket handling.

## Development Guidelines

### File Creation Patterns
- **API Routes**: Follow App Router pattern in `app/api/[endpoint]/route.js`
- **Components**: Use existing UI library (Shadcn/ui) before creating custom  
- **Database**: Add new models to `lib/models/`, follow existing schema patterns
- **Validation**: Create schemas in `lib/validation/schemas/[domain].js`

### Code Patterns
- **Authentication**: Use middleware patterns, check existing dual-auth system
- **Database Queries**: Use Mongoose models, ensure connection via `lib/mongodb/mongoose.js`
- **API Responses**: Use `lib/errors/apiResponse.js` utilities for consistent formatting
- **Validation**: Always validate inputs with Zod, use `lib/validation` utilities
- **Rate Limiting**: Apply via `lib/ratelimit/middleware.js` before business logic

### Security Considerations  
- Never expose JWT secrets or MongoDB URI
- Validate all inputs with Zod schemas
- Use rate limiting on public endpoints
- Follow Clerk security best practices
- Sanitize user content before database storage

## Testing Approach
The project uses custom Node.js testing scripts rather than a formal test framework. When adding features:

1. Create test scripts in `/scripts/` directory
2. Test error handling, validation, and rate limiting
3. Verify authentication flows for both user and admin paths
4. Test MongoDB operations and data integrity

## Common Patterns

### Adding a New API Endpoint
1. Create `app/api/[endpoint]/route.js`
2. Add validation schema to `lib/validation/schemas/`
3. Implement rate limiting if public endpoint
4. Add authentication check if protected
5. Use database models from `lib/models/`
6. Return consistent error responses

### Adding a New Page
1. Follow App Router conventions in `app/`
2. Use existing layout components
3. Implement authentication checks
4. Follow component patterns from existing pages
5. Use Tailwind + Shadcn/ui for styling

### Adding Real-time Features
1. Use Pusher client (`lib/pusher-client.js`)
2. Follow Socket.io rewrite pattern in `next.config.js`
3. Validate socket events with Zod schemas
4. Implement proper error handling for connection failures