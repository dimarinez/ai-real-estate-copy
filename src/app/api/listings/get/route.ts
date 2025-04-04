// src/app/api/listings/get/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/db';
import User from '../../../models/User';

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      console.log('No session or email found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log('User not found for email:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ savedListings: user.savedListings });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}