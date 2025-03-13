// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import OpenAI from 'openai';
import connectDB from '../../lib/db';
import User from '../../models/User';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function cleanupTemporaryPhotos() {
  try {
    const result = await cloudinary.api.delete_resources_by_prefix('real-estate-temp', {
      resource_type: 'image',
    });
    console.log('Cleanup result:', result);
  } catch (error) {
    console.error('Error cleaning up temporary photos:', error);
  }
}

export async function POST(req: NextRequest) {
  console.log('API called: /api/generate');
  if (!process.env.OPENAI_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('API keys missing');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0];
  const dailyLimit = user.subscriptionStatus === 'pro' ? 25 : user.subscriptionStatus === 'basic' ? 5 : 1;
  if (user.dailyGenerations >= dailyLimit) {
    console.log('Daily limit reached');
    return NextResponse.json({ error: 'Daily limit reached.' }, { status: 403 });
  }

  const body = await req.json();
  const { imageUrls, tone, language } = body;

  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    console.log('No image URLs provided');
    return NextResponse.json({ error: 'At least one photo URL is required.' }, { status: 400 });
  }

  const effectiveTone = tone || 'default';
  const effectiveLanguage = language || 'English';
  const effectiveMaxWords = user.subscriptionStatus === 'free' ? 100 : 200;

  console.log(`Processing ${imageUrls.length} photo URLs`);

  try {
    console.log('Starting GPT-4o bulk analysis');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze these ${imageUrls.length} photos and generate a single ${effectiveTone} real estate listing in ${effectiveLanguage}, max ${effectiveMaxWords} words. Combine all pertinent details into a captivating description.${user.subscriptionStatus !== 'free' ? " Then, generate social media posts: Twitter (25 words max), Instagram (30 words max), Facebook (50 words max), LinkedIn (75 words max). Separate each section with \"---\" and do not include platform names or headers like \"## Twitter\"—just the raw text." : ""}`,
            },
            ...imageUrls.map((url: string) => ({
              type: 'image_url' as const,
              image_url: { url },
            })),
          ],
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const gptOutput = response.choices[0]?.message.content || '';
    console.log('GPT-4o raw output:', gptOutput);

    const sections = gptOutput.split('---').map((s) => s.trim());
    const listing = sections[0] || 'A beautifully designed interior with stunning features.';
    const socialParts = sections.slice(1);

    const cleanSocialParts = socialParts.map((part) => part.trim());
    const socialContent = user.subscriptionStatus !== 'free'
      ? {
          twitter: cleanSocialParts[0] || 'Step inside this stunning interior! Book a tour! #RealEstate',
          instagram: cleanSocialParts[1] || 'Elegant interiors await! Ready to move in? #HomeGoals',
          facebook: cleanSocialParts[2] || 'Discover elegant interiors with top-tier features. Contact us!',
          linkedin: cleanSocialParts[3] || 'New listing: Elegant interiors with modern amenities. Reach out! #RealEstate',
        }
      : {};

    if (!user.lastFreeGeneration || user.lastFreeGeneration !== today) {
      user.lastFreeGeneration = today;
      user.dailyGenerations = 1;
    } else {
      user.dailyGenerations += 1;
    }
    await user.save();

    // Clean up after successful generation
    await cleanupTemporaryPhotos();

    return NextResponse.json({ text: listing, social: socialContent });
  } catch (error) {
    console.error('Error processing photos with GPT-4o:', error);
    return NextResponse.json({ error: 'Failed to generate listing.' }, { status: 500 });
  }
}