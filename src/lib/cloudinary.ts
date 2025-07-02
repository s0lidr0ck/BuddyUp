import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import sharp from 'sharp'

// Configure S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
})

export interface UploadResult {
  key: string
  url: string
  width: number
  height: number
  format: string
  size: number
}

export async function uploadToS3(
  file: File,
  userId: string,
  folder: string = 'media'
): Promise<UploadResult> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Generate unique filename
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop() || 'jpg'
  const fileName = `${timestamp}-${randomId}.${fileExtension}`
  
  // Your requested folder structure: BuddyUp/users/[user_id]/media/filename.ext
  const key = `BuddyUp/users/${userId}/${folder}/${fileName}`

  let processedBuffer = buffer
  let metadata = {
    width: 0,
    height: 0,
    format: fileExtension
  }

  // Process image with Sharp for optimization
  if (file.type.startsWith('image/')) {
    try {
      const processed = sharp(buffer)
      
      // Optimize based on folder type
      if (folder === 'profile-pictures') {
        // Profile pictures: resize to 400x400, high quality
        processed.resize(400, 400, { fit: 'cover' }).jpeg({ quality: 90 })
      } else {
        // Other images: limit size, good quality
        processed.resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 })
      }
      
      processedBuffer = await processed.toBuffer()
      const info = await sharp(processedBuffer).metadata()
      metadata = {
        width: info.width || 0,
        height: info.height || 0,
        format: info.format || fileExtension
      }
    } catch (error) {
      console.warn('Image processing failed, using original:', error)
      // Fall back to original buffer if processing fails
    }
  }

  // Upload to S3
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET!,
    Key: key,
    Body: processedBuffer,
    ContentType: file.type,
    CacheControl: 'max-age=31536000', // 1 year cache
  }

  await s3Client.send(new PutObjectCommand(uploadParams))

  // Generate the public URL
  const url = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

  return {
    key,
    url,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: processedBuffer.length
  }
}

export async function deleteFromS3(key: string): Promise<void> {
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET!,
      Key: key,
    }))
  } catch (error) {
    console.error('Error deleting from S3:', error)
    // Don't throw error - file might already be deleted
  }
}

// Helper to extract S3 key from URL
export function getS3KeyFromUrl(url: string): string | null {
  try {
    const matches = url.match(/amazonaws\.com\/(.+)$/)
    return matches ? matches[1] : null
  } catch {
    return null
  }
} 