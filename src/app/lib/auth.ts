// /app/api/auth/[...nextauth]/route.ts
import type { NextAuthOptions, User as NextAuthUser, Session, Account } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { AdapterUser } from 'next-auth/adapters';

import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import connectDB from '../lib/db'; // Adjusted path based on your earlier setup
import User, { IUser } from '@/app/models/User'; // Adjusted path to your User model

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      subscriptionStatus: string;
      isVerified: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    subscriptionStatus?: string;
    isVerified?: boolean;
  }
}

// Helper function to transform Mongoose user to NextAuth user
function toNextAuthUser(dbUser: IUser): NextAuthUser {
  return {
    id: dbUser._id?.toString() || '',
    email: dbUser.email,
    name: dbUser.name,
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials.password) {
          throw new Error('Missing email or password');
        }

        await connectDB();
        const userDoc = await User.findOne({ email: credentials.email }).select('+password');
        if (!userDoc) {
          throw new Error('User not found');
        }

        // Enforce email verification for Credentials users
        if (!userDoc.isVerified) {
          throw new Error('Please verify your email before signing in');
        }

        const isValid = await bcrypt.compare(credentials.password, userDoc.password);
        if (!isValid) {
          throw new Error('Invalid password');
        }

        return toNextAuthUser(userDoc);
      },
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({
      token,
      user,
      account,
    }: {
      token: JWT;
      user?: NextAuthUser | AdapterUser;
      account?: Account | null;
    }): Promise<JWT> {
      await connectDB();

      if (account && user) {
        let existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          // Create new user if not found (e.g., first Google login)
          existingUser = await User.create({
            email: user.email,
            name: user.name,
            subscriptionStatus: 'free',
            createdAt: new Date(),
            savedListings: [],
            isVerified: account.provider === 'google', // Auto-verify Google users
          });
        } else if (account.provider === 'google' && !existingUser.isVerified) {
          // Update existing unverified user to verified for Google login
          existingUser.isVerified = true;
          await existingUser.save();
        }

        token.id = existingUser._id.toString();
        token.subscriptionStatus = existingUser.subscriptionStatus;
        token.isVerified = existingUser.isVerified; // Store in token
      }

      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (token && session.user) {
        session.user.id = typeof token.id === 'string' ? token.id : '';
        session.user.subscriptionStatus =
          typeof token.subscriptionStatus === 'string' ? token.subscriptionStatus : '';
        session.user.isVerified = typeof token.isVerified === 'boolean' ? token.isVerified : false;
      }
      return session;
    },

    async signIn({
      user,
      account,
    }: {
      user: NextAuthUser | AdapterUser;
      account?: Account | null;
    }): Promise<boolean> {
      await connectDB();

      if (account?.provider === 'google') {
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            email: user.email,
            name: user.name,
            subscriptionStatus: 'free',
            createdAt: new Date(),
            savedListings: [],
            isVerified: true, // Google users are auto-verified
          });
        } else if (!existingUser.isVerified) {
          // Update existing user to verified for Google login
          existingUser.isVerified = true;
          await existingUser.save();
        }
        return true;
      }

      // For Credentials, `authorize` already checks `isVerified`
      return true;
    },
  },
};