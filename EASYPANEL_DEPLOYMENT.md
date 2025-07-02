# EasyPanel Deployment Guide for BuddyUp

This guide will help you deploy BuddyUp PWA to EasyPanel using Docker.

## 🚀 Pre-Deployment Checklist

### 1. **GitHub Repository**
- [ ] Push all code to GitHub
- [ ] Ensure `Dockerfile` and `docker-compose.yml` are in the repo
- [ ] Verify all PWA assets (icons) are included

### 2. **Database Setup**
- [ ] Create PostgreSQL database in EasyPanel
- [ ] Note the connection string

### 3. **Environment Variables** 
Copy from `environment-template.txt` and update:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret (generate: `openssl rand -hex 32`)
- `NEXTAUTH_URL` - Your domain (e.g., `https://buddyup.yourdomain.com`)
- `AWS_ACCESS_KEY_ID` - S3 access key
- `AWS_SECRET_ACCESS_KEY` - S3 secret key
- `AWS_REGION` - S3 region (e.g., `us-east-1`)
- `AWS_S3_BUCKET_NAME` - S3 bucket name

**PWA Notifications (already generated):**
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY` 
- `VAPID_EMAIL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

## 📦 EasyPanel Deployment Steps

### Step 1: Create New Project
1. Login to your EasyPanel dashboard
2. Click **"Create Project"**
3. Name it `buddyup`

### Step 2: Add Database Service
1. Click **"Add Service"** → **"Database"** → **"PostgreSQL"**
2. Name: `buddyup-db`
3. Database: `buddyup`
4. Username: `buddyup`
5. Password: Generate strong password
6. Deploy and note the connection string

### Step 3: Add App Service
1. Click **"Add Service"** → **"App"**
2. **Source**: Connect to your GitHub repository
3. **Build**: Docker
4. **Port**: `3000`
5. **Domain**: Set your desired subdomain

### Step 4: Configure Environment Variables
In the App service settings, add all environment variables from your template:

```bash
DATABASE_URL=postgresql://buddyup:password@buddyup-db:5432/buddyup
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-domain.com
# ... add all other variables
```

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for build to complete
3. Check logs for any errors

## 🔧 Post-Deployment Setup

### 1. **Initialize Database**
Access your app container and run:
```bash
npx prisma db push
```

### 2. **Test PWA**
1. Visit your deployed URL
2. Check for PWA install prompt
3. Test push notifications
4. Verify S3 image uploads

### 3. **Custom Domain (Optional)**
1. Add your custom domain in EasyPanel
2. Update `NEXTAUTH_URL` environment variable
3. Redeploy

## 🎯 PWA-Specific Considerations

### **HTTPS Required**
- EasyPanel provides HTTPS automatically ✅
- PWA install prompts will work properly ✅

### **Push Notifications**
- VAPID keys are already configured ✅
- Users can enable notifications on first visit ✅

### **Offline Support**
- Service worker caches key pages ✅
- App works offline after first visit ✅

## 🔍 Troubleshooting

### **Build Fails**
- Check Dockerfile syntax
- Ensure all dependencies in package.json
- Check build logs in EasyPanel

### **Database Connection Issues**
- Verify DATABASE_URL format
- Check database service is running
- Run `npx prisma db push` after deployment

### **Environment Variables**
- Double-check all required vars are set
- Ensure no typos in variable names
- Restart service after env var changes

### **PWA Not Installing**
- Verify icons exist in `/public/`
- Check manifest.json is accessible
- Ensure HTTPS is working

## 🎉 Success Checklist

After deployment, verify:
- [ ] App loads at your domain
- [ ] User registration/login works
- [ ] PWA install prompt appears
- [ ] Push notifications can be enabled
- [ ] Image uploads work (S3)
- [ ] Database operations work
- [ ] Service worker registers

## 📱 Testing Your PWA

1. **Desktop**: Visit your domain in Chrome, look for install button
2. **Mobile**: Visit on phone, test "Add to Home Screen"
3. **Notifications**: Enable and test push notifications
4. **Offline**: Turn off internet, verify key pages still work

Your BuddyUp PWA is now live! 🚀 