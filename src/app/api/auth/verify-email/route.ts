// /app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import User from '../../../models/User';

export async function POST(req: NextRequest) {
  await connectDB();

  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
  }

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    await User.updateOne(
      { _id: user._id },
      { isVerified: true, verificationToken: null }
    );

    return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}