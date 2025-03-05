import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import OpenAI from 'openai';
import connectDB from '../../lib/db';
import User from '../../models/User';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const user = await User.findOne({ email: session?.user?.email });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const today = new Date().toISOString().split('T')[0];
  const dailyLimit = user.subscriptionStatus === 'pro' ? Infinity : user.subscriptionStatus === 'basic' ? 10 : 1;
  if (user.dailyGenerations >= dailyLimit) {
    return NextResponse.json({ error: 'Daily limit reached. Upgrade for more generations.' }, { status: 403 });
  }

  const model = user.subscriptionStatus === 'pro' ? 'gpt-4' : 'gpt-3.5-turbo';
  const { propertyType, location, features, tone, language } = await req.json();

  const combinedPrompt = `
    Write a ${tone} real estate listing in ${language} for a ${propertyType} in ${location}. Features: ${features.join(', ')}.
    ${user.subscriptionStatus !== 'free' ? `
    Also generate:
    - A short and catchy tweet
    - An Instagram caption with hashtags
    - A Facebook post
    - A LinkedIn post in a professional tone
    Separate each section with "---".
    ` : ''}
  `;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'You are a real estate copywriting expert.' },
      { role: 'user', content: combinedPrompt },
    ],
    temperature: 0.7,
    max_tokens: user.subscriptionStatus === 'free' ? 300 : 600,
  });

  // Safeguard against null/undefined content
  const content = response.choices[0]?.message.content;
  if (!content) {
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }

  const result = content.split('---');
  const generatedText = result[0].trim();
  const socialContent = user.subscriptionStatus === 'free'
    ? {}
    : {
        twitter: result[1]?.trim() || '',
        instagram: result[2]?.trim() || '',
        facebook: result[3]?.trim() || '',
        linkedin: result[4]?.trim() || '',
      };

  // Update user daily generations
  if (!user.lastFreeGeneration || user.lastFreeGeneration !== today) {
    user.lastFreeGeneration = today;
    user.dailyGenerations = 1;
  } else {
    user.dailyGenerations += 1;
  }

  // Save user asynchronously without blocking the response
  user.save().catch((err: Error) => console.error('Failed to save user:', err));

  // Return the response immediately
  return NextResponse.json({ text: generatedText, social: socialContent });
}