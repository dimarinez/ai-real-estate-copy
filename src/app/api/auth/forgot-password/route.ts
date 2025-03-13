// /app/api/auth/forgot-password/route.ts (for reference)
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import User from '@/app/models/User';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function POST(req: NextRequest) {
  await connectDB();

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' }, { status: 200 });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = Date.now() + 3600000; // 1 hour

  await User.updateOne({ email }, { resetToken, resetTokenExpiry });

  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${resetToken}`;
  const msg = {
    to: email,
    from: process.env.EMAIL_USER as string,
    subject: 'Password Reset Request',
    html: `
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Link expires in 1 hour. Ignore if you didn’t request this.</p>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('SendGrid error:', error);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }

  return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' }, { status: 200 });
}