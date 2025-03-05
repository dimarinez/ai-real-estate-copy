// src/app/api/generate/route.ts
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
    First, write a ${tone} real estate listing in ${language} for a ${propertyType} in ${location}. Features: ${features.join(', ')}.
    ${user.subscriptionStatus !== 'free' ? `
    Then, generate the following, each separated by "---":
    - A short and catchy tweet
    - An Instagram caption with hashtags
    - A Facebook post
    - A LinkedIn post in a professional tone
    Do not include section headers like "**Tweet:**" or "**Real Estate Listing:**" in the output. Use only "---" to separate sections.
    Ensure there is no leading "---" at the start of the response.
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

  const content = response.choices[0]?.message.content;
  if (!content) {
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }

  // Log raw content for debugging
  console.log('Raw OpenAI content:', content);

  // Split and filter out empty sections or leading separators
  const result = content.split('---').filter((section) => section.trim() !== '');
  console.log('Filtered split result:', result);

  // Extract listing and social content, removing unwanted headers
  const cleanSection = (text: string) =>
    text.replace(/\*\*Real Estate Listing:\*\*|\*\*Tweet:\*\*|\*\*Instagram Caption:\*\*|\*\*Facebook Post:\*\*|\*\*LinkedIn Post:\*\*/g, '').trim();

  const generatedText = cleanSection(result[0] || '');
  const socialContent = user.subscriptionStatus === 'free'
    ? {}
    : {
        twitter: cleanSection(result[1] || ''),
        instagram: cleanSection(result[2] || ''),
        facebook: cleanSection(result[3] || ''),
        linkedin: cleanSection(result[4] || ''),
      };

  // Update user daily generations
  if (!user.lastFreeGeneration || user.lastFreeGeneration !== today) {
    user.lastFreeGeneration = today;
    user.dailyGenerations = 1;
  } else {
    user.dailyGenerations += 1;
  }
  user.save().catch((err: Error) => console.error('Failed to save user:', err));

  return NextResponse.json({ text: generatedText, social: socialContent });
}