# S3 Setup for BuddyUp

Your S3 upload system is configured to organize files with the structure:
```
BuddyUp/users/[user_id]/media/filename.ext
```

## ✅ Already Configured

Your environment variables are set up:
- `AWS_ACCESS_KEY` - Your AWS access key
- `AWS_SECRET_KEY` - Your AWS secret key  
- `AWS_REGION=us-east-1` - AWS region
- `AWS_BUCKET=s-r-m` - Your S3 bucket name

## 📁 File Organization

**Profile Pictures**: `BuddyUp/users/{userId}/profile-pictures/`
- Automatically resized to 400x400px
- Optimized for web (JPEG, 90% quality)

**Task Completion Photos**: `BuddyUp/users/{userId}/media/`
- Max size 1200x1200px (maintains aspect ratio)
- Optimized for web (JPEG, 85% quality)

## 🚀 Features

✅ **Auto-Optimization**: Images processed with Sharp for web delivery
✅ **User Isolation**: Each user's files in separate folders
✅ **Cache Headers**: 1-year cache for better performance
✅ **File Validation**: Type and size checking
✅ **Secure**: User authentication required for uploads

## 🔧 S3 Bucket Configuration

Make sure your S3 bucket has:

1. **Public Read Access** for uploaded files:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::s-r-m/BuddyUp/*"
    }
  ]
}
```

2. **CORS Configuration** for web uploads:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## 🔗 File URLs

Uploaded files will be accessible at:
```
https://s-r-m.s3.us-east-1.amazonaws.com/BuddyUp/users/{userId}/media/{filename}
```

## 💰 Cost Benefits vs Cloudinary

- **Storage**: ~$0.023/GB vs Cloudinary's $0.10/GB
- **Bandwidth**: ~$0.09/GB vs Cloudinary's $0.15/GB
- **No transformation limits**
- **Full control over your data** 