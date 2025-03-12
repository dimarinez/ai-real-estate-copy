// src/app/api/cleanup/route.ts
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST() {
  console.log('API called: /api/cleanup');
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('Cloudinary configuration missing');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // Delete all resources in the 'real-estate-temp' folder
    const result = await cloudinary.api.delete_resources_by_prefix('real-estate-temp', {
      resource_type: 'image',
    });

    console.log('Cleanup result:', result);
    return NextResponse.json({ message: 'Temporary photos cleaned up.', deleted: result });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json({ error: 'Failed to clean up temporary photos.' }, { status: 500 });
  }
}