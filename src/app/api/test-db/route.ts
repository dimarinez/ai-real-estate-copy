import { NextResponse } from 'next/server';
import connectDB from '../../lib/db';

export async function GET() {
    try {
        await connectDB();
        return NextResponse.json({ success: true, message: '✅ MongoDB connection successful' });
    } catch (error) {
        console.error('❌ Database Connection Failed:', error);
        return NextResponse.json({ success: false, error: '❌ Database Connection Failed' }, { status: 500 });
    }
}
