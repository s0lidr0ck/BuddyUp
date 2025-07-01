#!/bin/bash

echo "🚀 Setting up BuddyUp..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment variables
if [ ! -f .env.local ]; then
    echo "📋 Creating .env.local file..."
    cat > .env.local << EOL
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/buddyup"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

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
EOL
    echo "✅ Created .env.local with sample values"
    echo "⚠️  Please update the database URL and email settings in .env.local"
else
    echo "✅ .env.local already exists"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your database URL in .env.local"
echo "2. Run 'npm run db:push' to create database tables"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "For EasyPanel deployment, see the README.md file." 