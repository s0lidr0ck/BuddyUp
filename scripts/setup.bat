@echo off
echo 🚀 Setting up BuddyUp...

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create environment variables file
if not exist .env.local (
    echo 📋 Creating .env.local file...
    (
        echo # Database
        echo DATABASE_URL="postgresql://username:password@localhost:5432/buddyup"
        echo.
        echo # NextAuth.js
        echo NEXTAUTH_URL="http://localhost:3000"
        echo NEXTAUTH_SECRET="your-secret-key-here"
        echo.
        echo # Email Provider ^(for authentication^)
        echo EMAIL_SERVER_HOST="smtp.gmail.com"
        echo EMAIL_SERVER_PORT=587
        echo EMAIL_SERVER_USER="your-email@gmail.com"
        echo EMAIL_SERVER_PASSWORD="your-app-password"
        echo EMAIL_FROM="your-email@gmail.com"
        echo.
        echo # Optional: OAuth providers
        echo GOOGLE_CLIENT_ID=""
        echo GOOGLE_CLIENT_SECRET=""
        echo.
        echo # Socket.io
        echo SOCKET_IO_PORT=3001
    ) > .env.local
    echo ✅ Created .env.local with sample values
    echo ⚠️  Please update the database URL and email settings in .env.local
) else (
    echo ✅ .env.local already exists
)

REM Generate Prisma client
echo 🗄️  Generating Prisma client...
npx prisma generate

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Update your database URL in .env.local
echo 2. Run 'npm run db:push' to create database tables
echo 3. Run 'npm run dev' to start the development server
echo.
echo For EasyPanel deployment, see the README.md file.

pause 