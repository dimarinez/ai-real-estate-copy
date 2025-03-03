import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectDB from '../../../lib/db';
import User from '../../../models/User';

export async function POST(req: NextRequest) {
    await connectDB();
    
    const { email, password, name } = await req.json();
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return NextResponse.json({ error: "User already exists!" }, { status: 400 });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({ email, password: hashedPassword, name });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
}
