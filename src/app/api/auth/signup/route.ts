// /app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectDB from '../../../lib/db';
import User from '@/app/models/User';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function POST(req: NextRequest) {
  await connectDB();

  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists!' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const newUser = await User.create({
    email,
    password: hashedPassword,
    name,
    isVerified: false, // Correctly set to false
    verificationToken,
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email?token=${verificationToken}`;
  const msg = {
    to: email,
    from: process.env.EMAIL_USER as string,
    subject: 'Verify Your Email',
    html: `
      <p>Welcome, ${name}! Please verify your email:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>Ignore if you didn’t sign up.</p>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('SendGrid error:', error);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, message: 'Sign-up successful. Please verify your email.', user: newUser },
    { status: 201 }
  );
}