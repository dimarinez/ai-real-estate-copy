// src/app/api/upload-photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_PHOTOS = 10; // Minimum requirement

export async function POST(req: NextRequest) {
  console.log('API called: /api/upload-photos');
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('Cloudinary configuration missing');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const photoCount = parseInt(formData.get('photoCount') as string, 10);
    if (!photoCount || photoCount < 1) {
      console.log('No photos provided');
      return NextResponse.json({ error: 'At least one photo is required.' }, { status: 400 });
    }
    if (photoCount > MAX_PHOTOS) {
      console.log(`Photo count (${photoCount}) exceeds maximum allowed (${MAX_PHOTOS})`);
      return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos allowed per request.` }, { status: 400 });
    }

    const photos: File[] = [];
    for (let i = 0; i < photoCount; i++) {
      const photo = formData.get(`photo${i}`) as File;
      if (photo) photos.push(photo);
    }

    console.log(`Uploading ${photos.length} photos to Cloudinary`);
    const imageUrls = await Promise.all(
      photos.map(async (photo) => {
        const buffer = Buffer.from(await photo.arrayBuffer());
        return new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'real-estate-temp',
              public_id: `${Date.now()}-${photo.name}`,
              resource_type: 'image',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result!.secure_url);
            }
          );
          stream.end(buffer);
        });
      })
    );

    console.log('Upload complete, returning URLs:', imageUrls);
    return NextResponse.json({ imageUrls });
  } catch (error) {
    console.error('Error uploading photos to Cloudinary:', error);
    return NextResponse.json({ error: 'Failed to upload photos.' }, { status: 500 });
  }
}