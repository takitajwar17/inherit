# Inherit - Comprehensive Technical Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Environment Variables & Credentials Management](#4-environment-variables--credentials-management)
5. [Authentication System](#5-authentication-system)
6. [Database Architecture](#6-database-architecture)
7. [API Endpoints](#7-api-endpoints)
8. [Pages & Routing](#8-pages--routing)
9. [Components Architecture](#9-components-architecture)
10. [Server Actions](#10-server-actions)
11. [Real-time Features](#11-real-time-features)
12. [Code Execution System](#12-code-execution-system)
13. [AI Integration](#13-ai-integration)
14. [Admin Panel](#14-admin-panel)
15. [UI/UX Features](#15-uiux-features)
16. [Security Considerations](#16-security-considerations)
17. [Data Flow Diagrams](#17-data-flow-diagrams)

---

## 1. Project Overview

**Inherit** is an AI-powered personalized coding education platform built with Next.js 14. Named after Aristotle's ancient school (Lyceum), it combines traditional learning principles with modern technology to provide an immersive and structured learning experience for aspiring developers.

### Core Features

- **Learning Platform**: Curated video tutorials from top programming channels (freeCodeCamp, Telusko)
- **AI-Powered Roadmaps**: Custom learning path generation based on user goals
- **Quest System**: Time-based coding challenges with AI-powered evaluation
- **Dev Discuss**: Community-driven Q&A forum with optional AI answers
- **Code Playground**: Real-time collaborative coding environment
- **Dashboard**: Progress tracking, learning streaks, and statistics

### Mission

Bridge the digital divide by making coding education accessible, collaborative, and empowering for everyone, particularly focusing on Bangladesh's tech industry growth.

---

## 2. Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework with App Router |
| React | 18.3.1 | UI library |
| Tailwind CSS | 3.3.2 | Utility-first CSS framework |
| Framer Motion | 11.18.1 | Animation library |
| Monaco Editor | 4.6.0 | Code editor (VS Code engine) |
| React Icons | 5.5.0 | Icon library |

### UI Component Libraries

| Library | Purpose |
|---------|---------|
| Radix UI | Accessible primitives (Dialog, Select, Tabs, Progress) |
| Chakra UI | Component library |
| shadcn/ui | Pre-built components (New York style) |
| Headless UI | Unstyled accessible components |
| Lucide React | Icon set |

### Backend

| Technology | Purpose |
|------------|---------|
| Next.js API Routes | Backend API endpoints |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |

### Authentication

| Service | Purpose |
|---------|---------|
| Clerk | User authentication & management |
| svix | Webhook verification |

### Real-time Features

| Service | Purpose |
|---------|---------|
| Pusher | Real-time WebSocket connections |
| Pusher.js | Client-side Pusher SDK |

### AI Services

| Service | Purpose |
|---------|---------|
| Groq AI | LLM for code reviews, quest evaluation, roadmap generation |
| Model: llama-3.3-70b-versatile | Primary AI model |

### External APIs

| Service | Purpose |
|---------|---------|
| YouTube Data API v3 | Video search and metadata |
| Piston API | Code execution engine |

### Analytics & Monitoring

| Service | Purpose |
|---------|---------|
| Vercel Analytics | Usage analytics |
| Vercel Speed Insights | Performance monitoring |

### Additional Libraries

| Library | Purpose |
|---------|---------|
| axios | HTTP client |
| date-fns | Date manipulation |
| react-confetti | Celebration animations |
| react-joyride | Onboarding tours |
| react-markdown | Markdown rendering |
| howler/use-sound | Audio playback |

---

## 3. Project Structure

```
inherit/
├── app/                          # Next.js 14 App Router
│   ├── admin/                    # Admin panel
│   │   ├── components/           # Admin-specific components
│   │   │   ├── AdminHeader.jsx
│   │   │   ├── QuestForm.jsx
│   │   │   └── QuestList.jsx
│   │   ├── login/page.jsx        # Admin login
│   │   ├── layout.jsx            # Admin layout (no sidebar)
│   │   └── page.jsx              # Admin dashboard
│   │
│   ├── api/                      # API Routes
│   │   ├── admin/                # Admin-protected endpoints
│   │   │   ├── auth/route.js     # Admin authentication
│   │   │   └── quests/           # Quest CRUD operations
│   │   ├── attempts/             # Quest attempt management
│   │   ├── leaderboard/          # Leaderboard data
│   │   ├── Piston/api.js         # Code execution wrapper
│   │   ├── questions/            # Dev discuss questions
│   │   ├── quests/               # Public quest endpoints
│   │   ├── video-search/         # YouTube video search
│   │   ├── voice-routing/        # Voice command processing
│   │   └── webhooks/clerk/       # Clerk webhook handler
│   │
│   ├── components/               # App-level components
│   │   ├── dev-discuss/          # Discussion components
│   │   ├── playground/           # Playground components

│   │   ├── ClientLayout.jsx      # Conditional layout wrapper
│   │   ├── fun-loaders.jsx       # Loading animations
│   │   ├── Header.jsx            # Main navigation header
│   │   ├── LandingPage.jsx       # Homepage
│   │   └── Sidebar.jsx           # Navigation sidebar
│   │
│   ├── dashboard/page.jsx        # User dashboard
│   ├── dev-discuss/              # Q&A forum
│   ├── faq/                      # Help & FAQ pages
│   ├── learn/                    # Video learning pages
│   ├── playground/               # Collaborative coding
│   ├── quests/                   # Quest system
│   ├── roadmaps/                 # Learning roadmaps
│   ├── sign-in/                  # Clerk sign-in
│   ├── sign-up/                  # Clerk sign-up
│   │
│   ├── constants.js              # Language versions & snippets
│   ├── globals.css               # Global styles & CSS variables
│   ├── layout.jsx                # Root layout
│   ├── not-found.jsx             # 404 page
│   └── page.jsx                  # Landing page wrapper
│
├── components/                   # Shared components
│   ├── learn/                    # Learning feature components
│   │   ├── editor/               # Code editor components
│   │   ├── CodeWorkspace.jsx
│   │   └── VideoPlayer.jsx
│   ├── playground/               # Playground components
│   ├── ui/                       # shadcn/ui components
│   ├── Progress.jsx
│   └── TourGuide.jsx             # Onboarding tour
│
├── lib/                          # Utilities & business logic
│   ├── actions/                  # Server actions
│   │   ├── codeReview.js         # AI code review
│   │   ├── quest.js              # Quest evaluation
│   │   ├── question.js           # Question management
│   │   ├── roadmap.js            # Roadmap generation
│   │   └── user.js               # User management
│   ├── middleware/
│   │   └── adminAuth.js          # Admin auth middleware
│   ├── models/                   # Mongoose schemas
│   │   ├── attemptModel.js
│   │   ├── questionModel.js
│   │   ├── questModel.js
│   │   ├── roadmapModel.js
│   │   └── userModel.js
│   ├── mongodb/
│   │   └── mongoose.js           # Database connection
│   ├── pusher-client.js          # Client-side Pusher
│   ├── pusher.js                 # Server-side Pusher
│   └── utils.js                  # Utility functions (cn)
│
├── pages/api/                    # Pages Router API (Socket)
│   └── socket.js                 # Pusher socket handler
│
├── public/                       # Static assets
│   ├── sounds/                   # Audio files
│   └── *.png, *.svg              # Images
│
├── middleware.js                 # Next.js middleware
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind configuration
├── components.json               # shadcn/ui configuration
├── jsconfig.json                 # Path aliases
└── package.json                  # Dependencies
```

---

## 4. Environment Variables & Credentials Management

### Required Environment Variables

```env
# ============================================
# CLERK AUTHENTICATION
# ============================================
# Get from: https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
WEBHOOK_SECRET=whsec_...

# Clerk redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ============================================
# DATABASE
# ============================================
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# ============================================
# AI SERVICES
# ============================================
# Groq AI - Get from: https://console.groq.com
GROQ_API_KEY=gsk_...

# Optional: Plagiarism check service
PLAGIARISM_CHECK_API_KEY=your_key

# ============================================
# YOUTUBE API
# ============================================
# Google Cloud Console YouTube Data API v3
# Supports multiple comma-separated keys for rate limiting
NEXT_PUBLIC_YOUTUBE_API_KEY=key1,key2,key3

# ============================================
# REAL-TIME (PUSHER)
# ============================================
# Get from: https://dashboard.pusher.com
PUSHER_APP_ID=123456
NEXT_PUBLIC_PUSHER_KEY=abc123...
PUSHER_SECRET=secret...
NEXT_PUBLIC_PUSHER_CLUSTER=us2

# ============================================
# APPLICATION URLs
# ============================================
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### Credentials Security

1. **Clerk Authentication**
   - Publishable keys (NEXT_PUBLIC_*) are exposed to client
   - Secret keys should never be exposed client-side
   - Webhook secret used for verifying Clerk webhook signatures

2. **Admin Credentials** (Hardcoded - SECURITY RISK)
   - Username: `admin`
   - Password: `admin123`
   - Stored in `middleware.js` and `lib/middleware/adminAuth.js`
   - **Recommendation**: Move to environment variables

3. **YouTube API Key Rotation**
   - Supports multiple API keys (comma-separated)
   - `getRandomApiKey()` function randomly selects keys
   - `tryWithMultipleKeys()` provides fallback mechanism

---

## 5. Authentication System

### User Authentication (Clerk)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLERK AUTHENTICATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐     ┌──────────┐     ┌──────────────────────┐ │
│  │  User    │────▶│  Clerk   │────▶│  Webhook (svix)      │ │
│  │  Login   │     │  Auth    │     │  /api/webhooks/clerk │ │
│  └──────────┘     └──────────┘     └──────────────────────┘ │
│                                              │               │
│                                              ▼               │
│                                    ┌──────────────────────┐ │
│                                    │  MongoDB User Doc    │ │
│                                    │  - clerkId           │ │
│                                    │  - firstName         │ │
│                                    │  - lastName          │ │
│                                    │  - email             │ │
│                                    │  - userName          │ │
│                                    └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Clerk Configuration (`layout.jsx`)

- Uses `ClerkProvider` wrapping the entire application
- Light theme base appearance
- Redirects configured via environment variables

#### Webhook Handler (`/api/webhooks/clerk/route.js`)

- Verifies webhook signatures using svix
- Handles events:
  - `user.created`: Creates new user in MongoDB
  - `user.updated`: Updates existing user data
  - `user.deleted`: Removes user from MongoDB

#### Middleware (`middleware.js`)

**Public Routes:**

- `/` (home)
- `/sign-in`
- `/sign-up`
- `/api/video-search`
- `/api/voice-routing`

**Ignored Routes:**

- `/api/webhooks/*`

### Admin Authentication

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN AUTHENTICATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐     ┌──────────────┐     ┌────────────────┐  │
│  │  Admin   │────▶│  /admin/login │────▶│ POST /api/     │  │
│  │  Login   │     │  Form Submit  │     │ admin/auth     │  │
│  └──────────┘     └──────────────┘     └────────────────┘  │
│                                                │             │
│                                                ▼             │
│       ┌────────────────────────────────────────────────┐    │
│       │  Credentials: admin / admin123                  │    │
│       │  Store in: Cookie + SessionStorage              │    │
│       │  Format: Base64 encoded "username:password"     │    │
│       └────────────────────────────────────────────────┘    │
│                                                │             │
│                                                ▼             │
│                              ┌──────────────────────────┐   │
│                              │  middleware.js checks:    │   │
│                              │  - adminAuth cookie       │   │
│                              │  - Authorization header   │   │
│                              └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Admin Routes Protected:**

- `/admin/*` - Pages
- `/api/admin/*` - API endpoints

---

## 6. Database Architecture

### MongoDB Connection (`lib/mongodb/mongoose.js`)

- Singleton pattern prevents multiple connections
- Database name: `Inherit`
- Uses `strictQuery: true`

### Data Models

#### User Model (`lib/models/userModel.js`)

```javascript
{
  clerkId: String (required, unique),     // Clerk's user ID
  firstName: String (required),
  lastName: String (required),
  image_url: String (optional),           // Profile picture URL
  email: String (required, unique),
  userName: String (required, unique),
  createdAt: Date (default: Date.now)
}
```

#### Quest Model (`lib/models/questModel.js`)

```javascript
{
  name: String (required),
  timeLimit: Number (minutes, required),
  level: Enum ['beginner', 'intermediate', 'advanced'] (required),
  questions: [{
    type: Enum ['short', 'coding'] (required),
    title: String (required),
    description: String (required),
    testCases: [{
      input: String,
      expectedOutput: String
    }],
    points: Number (required)
  }],
  startTime: Date (required),
  endTime: Date (required),
  isActive: Boolean (default: true),
  createdBy: String (required),
  timestamps: true
}
```

#### Attempt Model (`lib/models/attemptModel.js`)

```javascript
{
  userId: String (required),              // Clerk user ID
  questId: ObjectId (ref: 'Quest', required),
  startTime: Date (required),
  endTime: Date,
  status: Enum ['in-progress', 'completed', 'time-expired'] (default: 'in-progress'),
  answers: [{
    questionId: ObjectId (required),
    answer: String (required),
    isCorrect: Boolean (default: false),
    points: Number (default: 0),
    submittedAt: Date (default: Date.now),
    aiEvaluation: {
      score: Number (0-100, default: 0),
      feedback: String (default: ''),
      evaluatedAt: Date
    }
  }],
  totalPoints: Number (default: 0),
  maxPoints: Number (required),
  timestamps: true
}
// Index: { userId: 1, questId: 1, status: 1 }
```

#### Question Model (`lib/models/questionModel.js`)

```javascript
{
  title: String (required),
  description: String (required),
  votes: Number (default: 0),
  voters: [{
    userId: String (required),
    vote: Number (required)               // 1 or -1
  }],
  answers: Number (default: 0),           // Reply count
  views: Number (default: 0),
  tags: [String],
  author: String (ref: 'User', required), // userName
  replies: [{
    author: String (required),
    content: String (required),
    createdAt: Date (default: Date.now)
  }],
  aiAnswerRequested: Boolean (default: false),
  aiAnswer: {
    content: String (default: ''),
    time: Date (default: Date.now)
  },
  timestamps: true
}
```

#### Roadmap Model (`lib/models/roadmapModel.js`)

```javascript
{
  title: String (required),
  prompt: String (required),              // User's learning goal
  content: {
    steps: [{
      step: Number,
      topic: String,
      description: String,
      documentation: String,              // URL
      videoId: String,                    // YouTube video ID
      videoDuration: String               // ISO 8601 duration
    }]
  },
  author: String (required),              // userName
  createdAt: Date (default: Date.now)
}
```

### Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE RELATIONSHIPS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User (clerkId)                                                 │
│    │                                                            │
│    ├──────┬──────┬──────────┐                                   │
│    │      │      │          │                                   │
│    ▼      ▼      ▼          ▼                                   │
│  Attempt Question Roadmap  (author/userName reference)          │
│    │                                                            │
│    │                                                            │
│    ▼                                                            │
│  Quest (via questId reference)                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. API Endpoints

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/auth` | None | Admin login verification |
| POST | `/api/webhooks/clerk` | Webhook | Clerk user sync |

### Quest Endpoints (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/quests` | Admin | List all quests |
| POST | `/api/admin/quests` | Admin | Create new quest |
| GET | `/api/admin/quests/[id]` | Admin | Get quest by ID |
| PUT | `/api/admin/quests/[id]` | Admin | Update quest |
| DELETE | `/api/admin/quests/[id]` | Admin | Delete quest |

### Quest Endpoints (Public)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/quests` | None | List active quests |
| GET | `/api/quests/[questId]` | None | Get quest details |
| GET | `/api/quests/user` | Clerk | User's quest stats |

### Attempt Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/attempts` | Clerk | Start new attempt |
| GET | `/api/attempts/[attemptId]` | None | Get attempt details |
| POST | `/api/attempts/[attemptId]/submit` | Clerk | Submit & evaluate |
| GET | `/api/attempts/user/[questId]` | Clerk | User's quest attempt |

### Question Endpoints (Dev Discuss)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/questions/all-questions` | Clerk | Get all questions |
| POST | `/api/questions/[id]/reply` | Clerk | Add reply |
| POST | `/api/questions/[id]/upvote` | Clerk | Upvote question |
| POST | `/api/questions/[id]/downvote` | Clerk | Downvote question |

### Utility Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/video-search` | None | Search YouTube videos |
| POST | `/api/voice-routing` | None | Process voice commands |
| GET | `/api/leaderboard` | None | Get quest leaderboard |
| POST | `/pages/api/socket` | None | Pusher socket events |

---

## 8. Pages & Routing

### Public Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPage` | Marketing landing page |
| `/sign-in` | Clerk | User sign-in |
| `/sign-up` | Clerk | User registration |

### Protected Pages (Clerk Auth)

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | `Dashboard` | User statistics & progress |
| `/learn` | `LearnPage` | Browse video tutorials |
| `/learn/[videoId]` | `VideoPage` | Video + code workspace |
| `/roadmaps` | `RoadmapsPage` | View/create roadmaps |
| `/roadmaps/[id]` | `RoadmapDetailPage` | Roadmap steps & progress |
| `/quests` | `QuestsPage` | Browse quests & leaderboard |
| `/quests/[questId]/attempt` | `QuestAttemptPage` | Take a quest |
| `/quests/[questId]/results/[attemptId]` | `QuestResultsPage` | View results & AI feedback |
| `/dev-discuss` | `DevDiscussPage` | Community Q&A |
| `/dev-discuss/[Id]` | `QuestionDetailPage` | Question details & replies |
| `/dev-discuss/ask-question` | `AskQuestionPage` | Post new question |
| `/playground` | `Playground` | Create/join coding room |
| `/playground/[roomId]` | `RoomPage` | Collaborative coding |
| `/faq` | `FAQPage` | Help & documentation |
| `/faq/contact` | Contact page | Support contact |

### Admin Pages

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/admin/login` | `AdminLogin` | None | Admin login form |
| `/admin` | `AdminDashboard` | Admin | Quest management |

### Route Configuration

**Layout Structure:**

```
RootLayout (ClerkProvider)
  └── ClientLayout (conditional header/sidebar)
      ├── Header (shows on all except landing)
      ├── Sidebar (shows on all except landing, auth, admin)
      ├── TourGuide (onboarding tour)
      └── Page Content
```

**ClientLayout Logic:**

- No layout on landing page (`/`)
- No sidebar on `/sign-in`, `/sign-up`, `/admin/*`
- Admin pages use separate `AdminLayout`

---

## 9. Components Architecture

### Core Layout Components

#### `ClientLayout.jsx`

- Determines which layout elements to render based on route
- Manages sidebar state (open/closed)
- Dynamically imports `TourGuide` (no SSR)
- Responsive sidebar behavior (auto-collapse on mobile)

#### `Header.jsx`

- Fixed navigation bar with logo
- Clerk `UserButton` for authentication
- Links to home on logo click

#### `Sidebar.jsx`

- Collapsible navigation sidebar
- Sections: Dashboard, Learning, Interactive, Achievements, Help
- Tooltip on collapsed state
- Auto-expand on desktop, collapse on mobile

### Learn Feature Components

#### `CodeWorkspace.jsx` (Main Editor)

- Monaco Editor integration
- Multi-language support (JS, Python, Java, C++, C#, PHP)
- Features:
  - Code execution via Piston API
  - AI code review via Groq
  - File import/export
  - Auto-save to localStorage
  - Keyboard shortcuts
  - Cursor position tracking
  - Word count

#### `VideoPlayer.jsx`

- YouTube embed iframe
- Responsive sizing
- No related videos (`rel=0`)

#### Editor Sub-components

- `EditorHeader.jsx`: Language selector, file name, action buttons
- `EditorFooter.jsx`: Status bar (language, cursor, word count)
- `OutputPanel.jsx`: Code execution results
- `AIReviewPanel.jsx`: AI review feedback display
- `KeyboardShortcuts.jsx`: Shortcut reference modal

### Quest Feature Components

#### `QuestCard.jsx` (in QuestsPage)

- Displays quest info (name, level, time, questions)
- Status badge (upcoming/active/past)
- Timeline display (start/end times)
- Action button for active quests

#### `LeaderboardCard.jsx`

- Top 10 users by total score
- Shows rank, username, points, quests completed
- Highlights current user

#### Loaders (`fun-loaders.jsx`)

- `QuestPageLoader`: Loading quests animation
- `QuestAttemptLoader`: Loading attempt animation
- `QuestResultsLoader`: Processing results animation
- `SubmissionLoader`: Submit overlay with progress

### Dev Discuss Components

| Component | Purpose |
|-----------|---------|
| `QuestionHeader.jsx` | Page header with "Ask Question" button |
| `QuestionFilters.jsx` | Search and filter controls |
| `QuestionTabs.jsx` | Tab navigation (all/my questions/popular) |
| `QuestionList.jsx` | List of question cards |
| `QuestionCard.jsx` | Individual question preview |
| `Loading.jsx` | Skeleton loading state |
| `QuestionDetailLoading.jsx` | Detail page skeleton |

### Playground Components

#### `CollaboratorAvatars.jsx`

- Displays active users in room
- Avatar circles with initials
- Overflow counter for 3+ users

### UI Components (shadcn/ui)

| Component | File | Radix UI Base |
|-----------|------|---------------|
| Button | `button.jsx` | Slot |
| Card | `card.jsx` | Native |
| Dialog | `dialog.jsx` | Dialog |
| Input | `input.jsx` | Native |
| Select | `select.jsx` | Select |
| Skeleton | `skeleton.jsx` | Native |
| Tabs | `tabs.jsx` | Tabs |
| Textarea | `textarea.jsx` | Native |

### Special Components

#### `TourGuide.jsx`

- Uses `react-joyride` for onboarding
- Different tours for guests vs. signed-in users
- Persists tour completion in localStorage
- Highlights sidebar navigation items

---

## 10. Server Actions

### User Actions (`lib/actions/user.js`)

```javascript
// Create or update user from Clerk webhook
createOrUpdateUser(id, first_name, last_name, image_url, email, username)

// Delete user when removed from Clerk
deleteUser(id)
```

### Question Actions (`lib/actions/question.js`)

```javascript
// Create question with optional AI answer
createQuestion(title, description, tags, author, aiAnswerRequested)
// - Creates question in DB
// - Async generates AI answer if requested

// Get question by ID
getQuestionById(questionId)
// - Fetches question with formatted replies
```

### Roadmap Actions (`lib/actions/roadmap.js`)

```javascript
// Create AI-generated roadmap
createRoadmap(title, prompt, author)
// - Validates topic is CS/IT related
// - Generates learning steps via Groq
// - Fetches YouTube videos for each step

// Get user's roadmaps
getUserRoadmaps(author)

// Get roadmap by ID
getRoadmapById(id)
```

**Roadmap Generation Flow:**

1. Validate topic relevance (CS/IT only)
2. Generate roadmap steps via Groq AI
3. For each step, search YouTube for tutorials
4. Filter videos by duration (>10 minutes)
5. Attach video IDs to roadmap steps

### Quest Actions (`lib/actions/quest.js`)

```javascript
// Evaluate individual answer using AI
evaluateQuestAnswer(questData, userAnswer, questionData)
// - Returns score, feedback, evaluatedAt

// Submit and evaluate entire attempt
submitQuestAttempt(attemptId, answers)
// - Evaluates each answer
// - Calculates total score
```

**AI Evaluation Criteria:**

1. Correctness of solution
2. Code quality and best practices
3. Efficiency and optimization
4. Clarity and readability
5. Test cases passed (for coding questions)

### Code Review Actions (`lib/actions/codeReview.js`)

```javascript
// Generate AI code review
generateReview(code, retries = 3)
// Returns: { suggestions, issues, improvements }
```

**Review Structure:**

```javascript
{
  suggestions: [{
    title: String,
    description: String,
    code: String,
    lineNumber: Number
  }],
  issues: [{
    title: String,
    description: String,
    severity: 'high' | 'medium' | 'low',
    code: String,
    lineNumber: Number
  }],
  improvements: [{
    title: String,
    description: String,
    code: String,
    lineNumber: Number
  }]
}
```

---

## 11. Real-time Features

### Pusher Configuration

**Server (`lib/pusher.js`):**

```javascript
new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true
})
```

**Client (`lib/pusher-client.js`):**

```javascript
new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  enabledTransports: ['ws', 'wss'],
  forceTLS: true
})
```

### Socket Handler (`pages/api/socket.js`)

**Channel Format:** `room-{roomId}`

**Events:**

| Event | Trigger | Payload |
|-------|---------|---------|
| `join-room` | User joins room | `{ roomId, userId, username }` |
| `leave-room` | User leaves room | `{ roomId, userId }` |
| `codeUpdate` | Code changes | `{ userId, username, data }` |
| `collaboratorsUpdate` | Room membership changes | `[{ userId, username, timestamp }]` |

### Collaborative Coding Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 REAL-TIME COLLABORATION FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User A                                        User B            │
│    │                                              │              │
│    │  1. POST /api/socket                         │              │
│    │     event: 'join-room'                       │              │
│    │              │                               │              │
│    │              ▼                               │              │
│    │     ┌───────────────┐                        │              │
│    │     │    Pusher     │────────────────────────┼──────────▶  │
│    │     │   Server      │   collaboratorsUpdate  │              │
│    │     └───────────────┘                        │              │
│    │              │                               │              │
│    │  2. Type code │                              │              │
│    │     POST /api/socket                         │              │
│    │     event: 'codeUpdate'                      │              │
│    │              │                               │              │
│    │              ▼                               │              │
│    │     ┌───────────────┐                        │              │
│    │     │    Pusher     │────────────────────────┼──────────▶  │
│    │     │   Server      │   codeUpdate           │  Editor      │
│    │     └───────────────┘                        │  updates     │
│    │                                              │              │
└─────────────────────────────────────────────────────────────────┘
```

### Room Management

- Rooms stored in memory (`roomCollaborators` Map)
- 7-character uppercase room codes (UUID-based)
- Auto-cleanup when all users leave

---

## 12. Code Execution System

### Piston API Integration (`app/api/Piston/api.js`)

**Endpoint:** `https://emkc.org/api/v2/piston`

**Supported Languages:**

```javascript
const LANGUAGE_VERSIONS = {
  python: "3.10.0",
  csharp: "6.12.0",
  php: "8.2.3",
  java: "15.0.2",
  typescript: "5.0.3",
  javascript: "18.15.0",
  cpp: "17.0.0"
};
```

**Request Format:**

```javascript
{
  language: "python",
  version: "3.10.0",
  files: [{
    content: "print('Hello World')"
  }]
}
```

**Response Format:**

```javascript
{
  run: {
    output: "Hello World\n",
    stderr: ""  // Error output if any
  }
}
```

### Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CODE EXECUTION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Monaco Editor                                                   │
│       │                                                          │
│       │ User clicks "Run"                                        │
│       ▼                                                          │
│  ┌──────────────┐                                               │
│  │ executeCode  │                                               │
│  │ function     │                                               │
│  └──────────────┘                                               │
│       │                                                          │
│       │ POST /api/v2/piston/execute                             │
│       ▼                                                          │
│  ┌──────────────┐                                               │
│  │  Piston API  │  (External service - emkc.org)                │
│  │  Sandbox     │                                               │
│  └──────────────┘                                               │
│       │                                                          │
│       │ { run: { output, stderr } }                             │
│       ▼                                                          │
│  ┌──────────────┐                                               │
│  │ OutputPanel  │  Display results                              │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. AI Integration

### Groq AI Configuration

**Model:** `llama-3.3-70b-versatile`

**Client Initialization:**

```javascript
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});
```

### AI Use Cases

#### 1. Code Review (`lib/actions/codeReview.js`)

- **Temperature:** 0.5
- **Max Tokens:** 1500
- **Output:** JSON with suggestions, issues, improvements

#### 2. Quest Answer Evaluation (`lib/actions/quest.js`)

- **Temperature:** 0.3
- **Max Tokens:** 1000
- **Output:** Score, correctness, feedback, improvements

#### 3. Question AI Answers (`lib/actions/question.js`)

- **Temperature:** 0.5
- **Max Tokens:** 800
- **Persona:** "15 years experience in CS/IT"
- Refuses non-CS/IT questions

#### 4. Roadmap Generation (`lib/actions/roadmap.js`)

- **Validation Step:**
  - Temperature: 0.1
  - Validates topic is CS/IT related
- **Generation Step:**
  - Temperature: 0.7
  - Max Tokens: 1024
  - Output: JSON with learning steps

#### 5. Voice Command Routing (`api/voice-routing/route.js`)

- **Temperature:** 0.5
- **Max Tokens:** 100
- **Response Format:** JSON object
- Routes to pages or triggers actions

### AI Response Handling

All AI integrations include:

1. JSON response validation
2. Markdown code block stripping
3. Retry logic (typically 3 attempts)
4. Error fallback responses

---

## 14. Admin Panel

### Authentication Flow

1. Navigate to `/admin/login`
2. Enter credentials (admin/admin123)
3. POST to `/api/admin/auth`
4. On success:
   - Store Base64 credentials in cookie (`adminAuth`)
   - Store in sessionStorage
   - Redirect to `/admin`

### Admin Dashboard Features

**Statistics Display:**

- Total Quests
- Active Quests
- Upcoming Quests

**Quest Management:**

- View all quests (sorted by creation date)
- Create new quests
- Edit existing quests
- Delete quests

### Quest Form (`QuestForm.jsx`)

**Quest Fields:**

- Name
- Time Limit (minutes)
- Level (beginner/intermediate/advanced)
- Start Time (datetime-local)
- End Time (auto-calculated)
- Active status (checkbox)

**Question Fields:**

- Type (short/coding)
- Title
- Description
- Points
- Test Cases (for coding questions)

### Quest Status Logic

```javascript
getQuestStatus(quest) {
  const now = new Date();
  const startTime = new Date(quest.startTime);
  const endTime = new Date(quest.endTime);

  if (!quest.isActive) return "Inactive";
  if (now < startTime) return "Upcoming";
  if (now > endTime) return "Ended";
  return "Active";
}
```

---

## 15. UI/UX Features

### Design System

**Typography:**

- Primary Font: Kanit (Google Fonts)
- Weights: 100-900
- Fallback: Inter, system fonts

**Color Scheme (CSS Variables):**

```css
--background: 0 0% 100%;
--foreground: 240 10% 3.9%;
--primary: 240 5.9% 10%;
--secondary: 240 4.8% 95.9%;
--muted: 240 4.8% 95.9%;
--accent: 240 4.8% 95.9%;
--destructive: 0 84.2% 60.2%;
--border: 240 5.9% 90%;
--ring: 240 10% 3.9%;
```

**Dark Mode:**

- Supported via CSS variables
- Toggle via `dark` class on root

### Animation Features

**Framer Motion Usage:**

- Page transitions
- Loading animations
- Card hover effects
- Quest skeletons

**CSS Animations:**

- `fadeIn`: Toast notifications
- `shimmer`: Loading skeletons
- `gradient`: Progress bars
- `shine`: Progress bar effects

### Responsive Design

**Breakpoints:**

- Mobile: < 768px (Sidebar collapses)
- Tablet: 768px - 1024px
- Desktop: > 1024px (Full sidebar)

**Sidebar Behavior:**

- Desktop: Expanded (56px collapsed / 224px expanded)
- Mobile: Collapsed by default
- Toggle button for manual control

### Loading States

**Skeleton Loaders:**

- Dashboard cards
- Quest list
- Roadmap cards
- Question list
- Video grid

**Animated Loaders:**

- Spinning circles
- Emoji animations (🎯, 📊, 📋)
- Progress dots
- Shimmer effects

### Sound Effects

**Files:**

- `/public/sounds/complete.mp3`: Step completion
- `/public/sounds/success.mp3`: Roadmap completion

**Usage:**

- `useSound` hook from `use-sound` package
- Triggered on roadmap step completion

### Confetti Celebration

- Uses `react-confetti`
- Triggered when completing all roadmap steps
- 15-second duration
- 400 pieces
- Responsive to window size

### Onboarding Tour

**Guest Tour (1 step):**

- Welcome message
- Points to "Get Started" button

**User Tour (7 steps):**

1. Welcome back message
2. Dashboard highlight
3. Roadmaps highlight
4. Learn highlight
5. Playground highlight
6. Dev Discuss highlight
7. Quests highlight

---

## 16. Security Considerations

### Current Security Measures

1. **Clerk Authentication:**
   - Industry-standard auth provider
   - Session management
   - CSRF protection

2. **Webhook Verification:**
   - svix signature verification
   - Prevents webhook spoofing

3. **API Route Protection:**
   - Middleware checks Clerk auth
   - Admin routes check credentials

4. **Input Validation:**
   - Mongoose schema validation
   - Required field enforcement

### Security Concerns & Recommendations

#### 🔴 Critical Issues

1. **Hardcoded Admin Credentials**

   ```javascript
   // middleware.js
   if (username !== "admin" || password !== "admin123")
   ```

   **Fix:** Move to environment variables, use proper hashing

2. **Exposed API Keys**

   ```javascript
   // Client-side YouTube API key
   NEXT_PUBLIC_YOUTUBE_API_KEY
   ```

   **Fix:** Proxy through server-side API route

#### 🟡 Medium Priority

1. **No Rate Limiting:**
   - AI endpoints could be abused
   - **Fix:** Implement rate limiting middleware

2. **Missing Input Sanitization:**
   - XSS potential in question descriptions
   - **Fix:** Sanitize HTML/markdown input

3. **No CORS Configuration:**
   - API routes accessible from any origin
   - **Fix:** Configure allowed origins

#### 🟢 Recommendations

1. **Add Request Logging:**
   - Track API usage patterns
   - Detect abuse early

2. **Implement Content Security Policy:**
   - Restrict resource loading
   - Prevent XSS attacks

3. **Add Session Timeout:**
   - Admin sessions don't expire
   - Implement session expiry

---

## 17. Data Flow Diagrams

### User Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User ────▶ /sign-up ────▶ Clerk UI ────▶ Clerk Backend         │
│                                                  │               │
│                                                  │               │
│                                                  ▼               │
│                                     Webhook: user.created        │
│                                                  │               │
│                                                  ▼               │
│                            /api/webhooks/clerk/route.js          │
│                                                  │               │
│                                                  ▼               │
│                             createOrUpdateUser()                 │
│                                                  │               │
│                                                  ▼               │
│                              MongoDB: User document              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Learning Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      LEARNING FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /learn                                                          │
│    │                                                             │
│    ├─── Fetch videos from YouTube API (freeCodeCamp, Telusko)   │
│    │                                                             │
│    ▼                                                             │
│  Video Grid Display                                              │
│    │                                                             │
│    │ Click video                                                 │
│    ▼                                                             │
│  /learn/[videoId]                                                │
│    │                                                             │
│    ├─── VideoPlayer (YouTube embed)                              │
│    │                                                             │
│    └─── CodeWorkspace                                            │
│           │                                                      │
│           ├─── Write code in Monaco Editor                       │
│           ├─── Run code via Piston API                           │
│           └─── Get AI review via Groq                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Quest Attempt Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUEST ATTEMPT FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /quests                                                         │
│    │                                                             │
│    │ Select active quest                                         │
│    ▼                                                             │
│  /quests/[questId]/attempt                                       │
│    │                                                             │
│    ├─── Check existing attempt                                   │
│    │         │                                                   │
│    │         ├─── If completed ──▶ Redirect to results           │
│    │         └─── If none/in-progress ──▶ Show questions         │
│    │                                                             │
│    ├─── Timer countdown (quest.endTime - now)                    │
│    │                                                             │
│    ├─── Fill in answers (short/code)                             │
│    │                                                             │
│    └─── Submit                                                   │
│           │                                                      │
│           ├─── POST /api/attempts (create)                       │
│           │                                                      │
│           └─── POST /api/attempts/[id]/submit                    │
│                  │                                               │
│                  ├─── AI evaluation for each answer              │
│                  │                                               │
│                  └─── Calculate total score                      │
│                         │                                        │
│                         ▼                                        │
│  /quests/[questId]/results/[attemptId]                           │
│    │                                                             │
│    └─── Display scores, AI feedback, improvements                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Roadmap Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   ROADMAP CREATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /roadmaps                                                       │
│    │                                                             │
│    │ Click "Create New Roadmap"                                  │
│    ▼                                                             │
│  Dialog Form                                                     │
│    │                                                             │
│    ├─── Title: "My Python Journey"                               │
│    └─── Prompt: "Learn Python for data science"                  │
│           │                                                      │
│           │ Submit                                               │
│           ▼                                                      │
│  createRoadmap() server action                                   │
│    │                                                             │
│    ├─── 1. Validate topic (Groq AI)                              │
│    │         └─── Reject if not CS/IT                            │
│    │                                                             │
│    ├─── 2. Generate steps (Groq AI)                              │
│    │         └─── { steps: [{ topic, description, ... }] }       │
│    │                                                             │
│    ├─── 3. For each step: searchYouTubeVideo()                   │
│    │         └─── Attach videoId, duration                       │
│    │                                                             │
│    └─── 4. Save to MongoDB                                       │
│                                                                  │
│  /roadmaps/[id]                                                  │
│    │                                                             │
│    ├─── Display steps with checkboxes                            │
│    ├─── Progress saved to localStorage                           │
│    ├─── Links to documentation & YouTube videos                  │
│    └─── Confetti on completion                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix A: npm Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## Appendix B: Key File Quick Reference

| Feature | Primary Files |
|---------|--------------|
| Authentication | `middleware.js`, `lib/actions/user.js`, `api/webhooks/clerk/` |
| Quests | `lib/models/questModel.js`, `lib/actions/quest.js`, `app/quests/` |
| Roadmaps | `lib/models/roadmapModel.js`, `lib/actions/roadmap.js`, `app/roadmaps/` |
| Learning | `components/learn/`, `app/learn/`, `api/video-search/` |
| Playground | `lib/pusher*.js`, `pages/api/socket.js`, `app/playground/` |
| Dev Discuss | `lib/models/questionModel.js`, `lib/actions/question.js`, `app/dev-discuss/` |
| Admin | `lib/middleware/adminAuth.js`, `app/admin/`, `api/admin/` |
| Code Execution | `app/api/Piston/api.js`, `app/constants.js` |
| AI Integration | `lib/actions/codeReview.js`, `lib/actions/quest.js`, `lib/actions/roadmap.js` |

---

## Appendix C: Database Collections

| Collection | Model File | Primary Purpose |
|------------|------------|-----------------|
| `users` | `userModel.js` | User profiles from Clerk |
| `quests` | `questModel.js` | Coding challenges |
| `attempts` | `attemptModel.js` | Quest attempt records |
| `questions` | `questionModel.js` | Dev discuss posts |
| `roadmaps` | `roadmapModel.js` | Learning paths |

---

## Appendix D: External Service Dependencies

| Service | Purpose | Required For |
|---------|---------|--------------|
| Clerk | Authentication | User login/signup |
| MongoDB Atlas | Database | All data storage |
| Pusher | Real-time | Playground collaboration |
| Groq AI | LLM | AI features |
| YouTube Data API | Video search | Learn & Roadmaps |
| Piston | Code execution | Running user code |

---

*Documentation generated: January 2026*
*Version: 1.0*
*Codebase analyzed: inherit @ latest*
