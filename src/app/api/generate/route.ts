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

    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await User.findOne({ email: session?.user?.email });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0]; // Get current date (YYYY-MM-DD)
    const dailyLimit = user.subscriptionStatus === 'pro' ? Infinity : user.subscriptionStatus === 'basic' ? 10 : 1;

    // Check if the user has reached their daily limit
    if (user.dailyGenerations >= dailyLimit) {
        return NextResponse.json({ error: 'Daily limit reached. Upgrade for more generations.' }, { status: 403 });
    }

    // AI Model Selection Based on Subscription
    const model = user.subscriptionStatus === 'pro' ? 'gpt-4' : 'gpt-3.5-turbo';
    
    // Handle AI Text Generation Request
    const { propertyType, location, features, tone, language } = await req.json();
    const prompt = `Write a ${tone} real estate listing in ${language} for a ${propertyType} in ${location}. Features: ${features.join(', ')}.`;
    
    
    const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'system', content: 'You are a real estate copywriting expert.' },
                   { role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
    });

    const generatedText = response.choices[0].message.content;

    // Generate Social Media Content (For Paid Users Only)
    let socialContent = {};
    if (user.subscriptionStatus !== 'free') {
        const socialMediaPrompts = {
            twitter: `Create a short and catchy tweet for this real estate listing: ${generatedText}`,
            instagram: `Write an Instagram caption with hashtags for this real estate listing: ${generatedText}`,
            facebook: `Write a Facebook post for this real estate listing: ${generatedText}`,
            linkedin: `Write a LinkedIn post in a professional tone for this real estate listing: ${generatedText}`
        };

        socialContent = {
            twitter: (await openai.chat.completions.create({ model, messages: [{ role: 'user', content: socialMediaPrompts.twitter }] })).choices[0].message.content,
            instagram: (await openai.chat.completions.create({ model, messages: [{ role: 'user', content: socialMediaPrompts.instagram }] })).choices[0].message.content,
            facebook: (await openai.chat.completions.create({ model, messages: [{ role: 'user', content: socialMediaPrompts.facebook }] })).choices[0].message.content,
            linkedin: (await openai.chat.completions.create({ model, messages: [{ role: 'user', content: socialMediaPrompts.linkedin }] })).choices[0].message.content,
        };
    }
    
    // Update User Daily Generation Count
    if (!user.lastFreeGeneration || user.lastFreeGeneration !== today) {
        user.lastFreeGeneration = today;
        user.dailyGenerations = 1;
    } else {
        user.dailyGenerations += 1;
    }
    await user.save();

    return NextResponse.json({ text: generatedText, social: socialContent });
}
