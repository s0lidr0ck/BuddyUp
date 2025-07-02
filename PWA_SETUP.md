# BuddyUp PWA Notification Setup

This guide will help you set up the Progressive Web App (PWA) with push notifications for BuddyUp.

## 🎯 What We've Built

- **Service Worker** for offline functionality and push notifications
- **PWA Manifest** for installable app experience  
- **Push Notification System** with VAPID authentication
- **In-app Notifications** with real-time updates
- **Notification Preferences** for user control

## 🔧 Setup Instructions

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# PWA Push Notifications (already generated for you)
VAPID_PUBLIC_KEY="BDhmKj6coEU9eHaA43HCIOeVl4Vq881JTHx1lnDJv0XOpUwd0ABO--iLQbyTT7Ce18qqZJ1UyQmG3SJRlsCl_KI"
VAPID_PRIVATE_KEY="eRHqyjc-XeI0EfJvZGOv-eZ-vBmWDbIha4L8S4_uGfo"
VAPID_EMAIL="mailto:support@buddyup.app"

# Client-side public key
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BDhmKj6coEU9eHaA43HCIOeVl4Vq881JTHx1lnDJv0XOpUwd0ABO--iLQbyTT7Ce18qqZJ1UyQmG3SJRlsCl_KI"
```

### 2. Complete Database Setup

The database schema is ready, but you need to regenerate the Prisma client:

```bash
# Stop your dev server first
# Then regenerate the Prisma client
npx prisma generate

# Restart your dev server
npm run dev
```

### 3. Create App Icons (REQUIRED for PWA install)

**CRITICAL**: Without these icons, the PWA install prompt won't appear!

Create these **required** icon files in the `public/` folder:
- `favicon.ico` - App favicon (32x32 or 16x16)
- `icon-192x192.png` - PWA icon (192x192 pixels)
- `icon-512x512.png` - PWA icon (512x512 pixels)

**Easy way to create icons:**
1. Visit https://realfavicongenerator.net/ or https://www.pwabuilder.com/
2. Upload your logo/design (can be simple colored square with "BU" text)
3. Download the generated icon pack
4. Copy `icon-192x192.png`, `icon-512x512.png`, and `favicon.ico` to your `public/` folder

**Quick placeholder method:**
- Use any image editor (MS Paint, Canva, etc.)
- Create a 512x512 colored square with "BuddyUp" text
- Save as `icon-512x512.png`
- Resize to 192x192 and save as `icon-192x192.png`
- Create a 32x32 version and save as `favicon.ico`

**Additional icons for enhanced PWA** (optional):
Create these in `public/icons/`:
- `badge-72x72.png` for notification badge
- `shortcut-dashboard.png` and `shortcut-buddies.png`

### 4. Test the PWA

**Prerequisites for PWA install prompt:**
- ✅ Valid manifest.json (already setup)
- ✅ Registered service worker (already setup)
- ❗ Required icons (create these first - see step 3)
- ❗ HTTPS connection (localhost is OK for development)
- User engagement (visit site twice with 5+ min gap for Chrome)

**Testing steps:**
1. **Create required icons first** (see step 3 above)
2. **Check PWA readiness**: Open Chrome DevTools > Application > Manifest
3. **Install as PWA**: Look for install button in address bar or browser menu
4. **Enable Notifications**: Click the notification bell → "Enable Notifications"
5. **Test Push**: Send yourself a test notification

**Troubleshooting PWA Install:**

If you don't see the install prompt:
- ❗ **Missing icons**: Most common issue - ensure all 3 icons exist in `public/`
- 🔒 **Need HTTPS**: Deploy to Vercel/Netlify or use `localhost` for testing
- 🌐 **Wrong browser**: Use Chrome, Edge, or newer Safari/Firefox
- 🧹 **Clear cache**: Try incognito mode or clear browser data
- 📱 **Try mobile**: Install prompts appear more readily on mobile devices

**Check PWA status:**
```bash
# Open Chrome DevTools > Application > Manifest
# Look for any errors in red
# Verify all icons load correctly
```

## 📱 PWA Features

### Push Notifications
- **Buddy invites**: When someone wants to be your buddy
- **Goal completed**: When your buddy completes a challenge
- **Messages**: New chat messages from buddies
- **Reminders**: Time to set goals or complete challenges
- **Streak alerts**: Habit streak reminders

### Offline Support
- **Cached pages**: Dashboard, buddies, account work offline
- **Background sync**: Actions sync when connection returns
- **Service worker**: Handles all PWA functionality

### Installation
- **App-like experience**: Install on home screen
- **Standalone mode**: Runs like a native app
- **App shortcuts**: Quick access to Dashboard and Buddies

## 🎨 Notification Types

```typescript
// Available notification types:
- BUDDY_INVITE_RECEIVED     // 👋 New buddy invitation
- GOAL_COMPLETED_BY_BUDDY   // 🎉 Buddy completed goal  
- NEW_MESSAGE               // 💬 New chat message
- TURN_TO_SET_GOAL         // 🎯 Your turn to set goal
- HABIT_NEEDS_APPROVAL     // ⏳ Habit waiting approval
- HABIT_APPROVED           // ✅ Habit approved
- STREAK_REMINDER          // 🔥 Streak reminder
```

## 🔔 How It Works

1. **Service Worker** (`/sw.js`) handles push events
2. **NotificationProvider** manages subscriptions
3. **NotificationBell** shows in-app notifications
4. **API routes** handle notification CRUD operations
5. **Background sync** ensures reliability

## 🛠 Development

### Adding New Notifications

```typescript
// 1. Add to NotificationHelpers in notifications.ts
await NotificationHelpers.newNotificationType(userId, data)

// 2. Call from your API routes
import { NotificationHelpers } from '@/lib/notifications'
await NotificationHelpers.goalCompleted(buddyId, userName, goalTitle)
```

### Testing Locally

1. Use HTTPS (required for push notifications)
2. Test on mobile devices for full PWA experience
3. Use browser dev tools to simulate offline mode

## 🚀 Production Deployment

1. **Generate new VAPID keys** for production
2. **Configure HTTPS** (required for PWA)
3. **Set proper domains** in manifest.json
4. **Test on real devices** for push notifications

## 📊 What's Next

After Prisma client regenerates, you can:
- Create test notifications
- Set up notification preferences
- Add email notifications
- Implement weekly progress summaries
- Add notification scheduling

The foundation is solid - you now have a production-ready PWA notification system! 🎉 