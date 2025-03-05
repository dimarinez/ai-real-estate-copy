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
  const { propertyType, location, features, tone, language, maxWords } = await req.json();

  // Validate maxWords (optional field, default to reasonable limits if not provided)
  const maxWordsLimit = maxWords && Number.isInteger(maxWords) && maxWords > 0 ? maxWords : (user.subscriptionStatus === 'free' ? 100 : 200);

  const combinedPrompt = `
    First, write a ${tone} real estate listing in ${language} for a ${propertyType} in ${location}. Features: ${features.join(', ')}. Limit the listing to ${maxWordsLimit} words.
    ${user.subscriptionStatus !== 'free' ? `
    Then, generate the following, each separated by "---":
    - A short and catchy tweet (max 25 words)
    - An Instagram caption with hashtags (max 30 words)
    - A Facebook post (max 50 words)
    - A LinkedIn post in a professional tone (max 75 words)
    Do not include section headers like "**Tweet:**" or "**Real Estate Listing:**" in the output. Use only "---" to separate sections.
    Ensure there is no leading "---" at the start of the response and all requested sections are included.
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

  // Split and filter out empty sections
  const result = content.split('---').filter((section) => section.trim() !== '');
  console.log('Filtered split result:', result);

  // Ensure we have enough sections
  if (user.subscriptionStatus !== 'free' && result.length < 5) {
    console.error('Incomplete OpenAI response: missing sections', { expected: 5, received: result.length });
  }

  const cleanSection = (text: string) =>
    text.replace(/\*\*Real Estate Listing:\*\*|\*\*Tweet:\*\*|\*\*Instagram Caption:\*\*|\*\*Facebook Post:\*\*|\*\*LinkedIn Post:\*\*/g, '').trim();

  const generatedText = cleanSection(result[0] || '');
  const socialContent = user.subscriptionStatus === 'free'
    ? {}
    : {
        twitter: cleanSection(result[1] || ''),
        instagram: cleanSection(result[2] || ''),
        facebook: cleanSection(result[3] || ''),
        linkedin: cleanSection(result[4] || ''), // Default to empty string if missing
      };

  // Log if LinkedIn is missing
  if (user.subscriptionStatus !== 'free' && !socialContent.linkedin) {
    console.warn('LinkedIn post missing in response');
  }

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