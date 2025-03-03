import { NextResponse } from 'next/server';
import connectDB from '../../lib/db'
import User from '../../models/User';

export async function GET() {
    await connectDB();

    try {
        const users = await User.find().select('-password'); // Exclude password field
        return NextResponse.json({ success: true, data: users }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch users' + error }, { status: 500 });
    }
}
