// src/services/storage.service.ts
// S3 storage service — stub for v1, enable when AWS vars are set
import { env } from '../config/env';
import { logger } from '../utils/logger';

// In v1, we skip actual S3 and return placeholder URLs.
// Enable AWS SDK when you're ready (Week 3+).

export async function uploadAudio(
  _buffer: Buffer,
  filename: string,
  _mimeType: string
): Promise<string> {
  if (!env.awsS3Bucket) {
    logger.info(`[Storage] S3 not configured — skipping upload for: ${filename}`);
    return `local://${filename}`; // placeholder
  }

  // TODO: Implement actual S3 upload
  // const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  // const s3 = new S3Client({ region: env.awsRegion, credentials: { ... } });
  // await s3.send(new PutObjectCommand({ Bucket: env.awsS3Bucket, Key: filename, Body: buffer }));
  return `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com/${filename}`;
}

export async function getSignedUrl(_key: string): Promise<string> {
  // TODO: Generate pre-signed URL for playback
  return '';
}

// Branding logos need to actually render in the UI immediately (live preview,
// candidate pages), unlike the audio stub above which nothing currently plays
// back — so this always embeds the image as a data URI rather than returning a
// placeholder/stub URL that would 404. Swap to a real S3 upload (returning a
// public URL) once AWS is configured and this app has real object storage.
export async function uploadImage(buffer: Buffer, mimeType: string): Promise<string> {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
