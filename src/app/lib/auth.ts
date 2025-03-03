import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';

import connectDB from './db';
import User from '../models/User';

export const authOptions: NextAuthOptions = {
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error('Missing email or password');
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select('+password');
        if (!user) throw new Error('User not found');

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid password');
        }

        return user.toObject();
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      await connectDB();

      if (account && user) {
        let existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          existingUser = new User({
            email: user.email,
            name: user.name,
            subscriptionStatus: 'free',
            createdAt: new Date(),
            savedListings: [],
          });
          await existingUser.save();
        }
        token.id = existingUser._id.toString();
        token.subscriptionStatus = existingUser.subscriptionStatus;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session && session.user && 'id' in session.user && 'subscriptionStatus' in session.user) {
        session.user.id = token.id ?? "";
        session.user.subscriptionStatus = token.subscriptionStatus ?? "";
      }
      return session;
    },
    async signIn({ user, account }) {
      await connectDB();

      if (account?.provider === 'google') {
        let existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          existingUser = new User({
            email: user.email,
            name: user.name,
            subscriptionStatus: 'free',
            createdAt: new Date(),
            savedListings: [],
          });
          await existingUser.save();
        }
      }
      return true;
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
