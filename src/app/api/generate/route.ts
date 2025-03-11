// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import OpenAI from 'openai';
import connectDB from '../../lib/db';
import User from '../../models/User';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MAX_PHOTOS = 10;

export async function POST(req: NextRequest) {
  console.log('API called: /api/generate');
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key is missing');
    return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
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

  const tone = formData.get('tone') as string || 'default';
  const language = formData.get('language') as string || 'English';
  const maxWords = formData.get('maxWords') ? parseInt(formData.get('maxWords') as string, 10) : (user.subscriptionStatus === 'free' ? 100 : 200);

  console.log(`Processing ${photos.length} photos`);
  const base64Images = await Promise.all(
    photos.map(async (photo) => {
      const buffer = Buffer.from(await photo.arrayBuffer());
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    })
  );

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
              text: `Analyze these ${photos.length} interior photos and generate a single ${tone} real estate listing in ${language}, max ${maxWords} words, focusing only on interior features (exclude exterior details like yards or facades). Combine all pertinent interior details into a captivating description. Then, if user is not free-tier, generate social media posts: Twitter (25 words max), Instagram (30 words max), Facebook (50 words max), LinkedIn (75 words max). Separate each section with "---" and do not include platform names or headers like "## Twitter"—just the raw text.`,
            },
            ...base64Images.map((base64) => ({
              type: 'image_url' as const,
              image_url: { url: base64 },
            })),
          ],
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const gptOutput = response.choices[0]?.message.content || '';
    console.log('GPT-4o raw output:', gptOutput);

    const sections = gptOutput.split('---').map(s => s.trim());
    const listing = sections[0] || 'A beautifully designed interior with stunning features.';
    const socialParts = sections.slice(1);

    const cleanSocialParts = socialParts.map(part => part.trim());
    const socialContent = user.subscriptionStatus !== 'free' ? {
      twitter: cleanSocialParts[0] || 'Step inside this stunning interior! Book a tour! #RealEstate',
      instagram: cleanSocialParts[1] || 'Elegant interiors await! Ready to move in? #HomeGoals',
      facebook: cleanSocialParts[2] || 'Discover elegant interiors with top-tier features. Contact us!',
      linkedin: cleanSocialParts[3] || 'New listing: Elegant interiors with modern amenities. Reach out! #RealEstate',
    } : {};

    // Update daily generations (no saving here)
    if (!user.lastFreeGeneration || user.lastFreeGeneration !== today) {
      user.lastFreeGeneration = today;
      user.dailyGenerations = 1;
    } else {
      user.dailyGenerations += 1;
    }
    await user.save();

    return NextResponse.json({ text: listing, social: socialContent });
  } catch (error) {
    console.error('Error processing photos with GPT-4o:', error);
    return NextResponse.json({ error: 'Failed to process photos.' }, { status: 500 });
  }
}