# BuddyUp - Accountability Made Simple

A friendly accountability platform that turns good intentions into daily reality—one trusted relationship at a time.

## Features

### Core MVP Features (Version 0.1)

- **Friendly On-Ramp**: One-minute tour + starter templates
- **Account & Invite**: Fast email sign-up, solo start, link/username invite
- **Flexible Scheduling**: Daily or chosen weekdays; forever or 30/60/custom
- **Turn-Based Goal Setting**: App tracks whose turn; "No thanks" passes
- **Daily Completion Flow**: Done/Missed, 15-tag picker, rotating reflection prompt
- **"Mulligan" Grace Pass**: One free streak rescue per month (both approve)
- **Flex Days & Vacation Mode**: Planned skips or 5-day health pause
- **Streaks & First Badges**: Live counters, 3-/7-/30-day badges + confetti
- **Memory Wall**: Timeline of finished challenges with notes/tags
- **Buddy Chat & Nudges**: Lightweight chat + one-tap encouragement stickers
- **Anonymous Inspiration Wall**: Opt-in posts (❤️ 😂 🙏 reactions) auto-expire in 48h
- **Gentle Push Reminders**: User-chosen time, time-zone smart
- **Solo-to-Buddy Path**: Solo capped at 21-day streak; Day-3 invite banner

## Tech Stack

- **Frontend**: Next.js 14 with React and TypeScript
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with email and OAuth
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io for chat and live updates
- **Deployment**: Configured for EasyPanel

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Email service (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BuddyUp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/buddyup"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # Email Provider (for authentication)
   EMAIL_SERVER_HOST="smtp.gmail.com"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="your-email@gmail.com"
   EMAIL_SERVER_PASSWORD="your-app-password"
   EMAIL_FROM="your-email@gmail.com"

   # Optional: OAuth providers
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""

   # Socket.io
   SOCKET_IO_PORT=3001
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### EasyPanel Deployment

1. **Database Setup**
   - Create a PostgreSQL service in EasyPanel
   - Note the connection string

2. **App Deployment**
   - Connect your GitHub repository to EasyPanel
   - Set environment variables in EasyPanel dashboard
   - Deploy using Node.js template

3. **Environment Variables for Production**
   ```env
   DATABASE_URL="postgresql://user:pass@host:port/db"
   NEXTAUTH_URL="https://your-domain.com"
   NEXTAUTH_SECRET="production-secret-key"
   EMAIL_SERVER_HOST="your-smtp-host"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="your-email"
   EMAIL_SERVER_PASSWORD="your-password"
   EMAIL_FROM="noreply@your-domain.com"
   ```

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main app pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── landing/          # Landing page components
│   ├── ui/               # Reusable UI components
│   └── providers.tsx     # Context providers
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Helper functions
└── types/                # TypeScript type definitions
```

## Database Schema

The database includes the following main models:

- **User**: User accounts and preferences
- **Partnership**: Two-person accountability relationships
- **Challenge**: Daily goals set by partners
- **ChallengeCompletion**: Completion records with reflections
- **Message**: Chat messages between partners
- **Nudge**: Encouragement notifications
- **InspirationPost**: Anonymous inspiration wall posts
- **Badge/UserBadge**: Achievement system

## API Routes

### Partnerships
- `GET /api/partnerships` - Get user's partnerships
- `POST /api/partnerships` - Create new partnership

### Challenges
- `GET /api/challenges` - Get challenges for partnership
- `POST /api/challenges` - Create new challenge
- `PATCH /api/challenges` - Complete a challenge

### Messages
- `GET /api/messages` - Get chat messages
- `POST /api/messages` - Send message

## Development

### Database Management

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Roadmap

### Version 0.2 (Public Launch)
- Polish from beta feedback
- Dark mode toggle
- Starter templates pack
- Share-card export

### Version 0.3 (Coach Mode)
- One-to-many coaching relationships
- Coach dashboard
- Broadcast messaging
- Enhanced management tools

### Version 0.4+
- Weekly digest emails
- Comeback badges
- Voice note reflections
- Enhanced celebrations
- Mobile app (Capacitor)

## License

[MIT License](LICENSE)

## Support

For support, email support@buddyup.app or join our community Discord. 