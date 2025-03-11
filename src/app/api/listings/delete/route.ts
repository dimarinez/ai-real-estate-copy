// src/app/api/listings/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/db';
import User from '../../../models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { index } = await req.json();
    if (typeof index !== 'number' || index < 0) {
      return NextResponse.json({ error: 'Invalid index' }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (index >= user.savedListings.length) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    user.savedListings.splice(index, 1); // Remove listing at index
    await user.save();

    return NextResponse.json({ message: 'Listing deleted' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}