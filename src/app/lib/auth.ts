// src/... (wherever your next-auth config is)
import type {
  NextAuthOptions,
  User as NextAuthUser,
  Session,
  Account,
} from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { AdapterUser } from "next-auth/adapters";

import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import bcrypt from "bcrypt";
import connectDB from "./db";
import User from "../models/User";

/**
 * If you want to unify your DB user with NextAuth's `User`,
 * define a helper function to transform your Mongoose doc into a shape
 * that NextAuth expects (id, email, name, etc.).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNextAuthUser(dbUser: any): NextAuthUser {
  return {
    // NextAuth expects `id` on the user if we want to store it in token
    id: dbUser._id?.toString() || "",
    email: dbUser.email,
    name: dbUser.name,
    // other fields as needed
  };
}

export const authOptions: NextAuthOptions = {
  // Use JWT-based sessions
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET, // required in production

  providers: [
    // 1. Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),

    // 2. Credentials (email/password)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // `authorize` must return `User | AdapterUser | null`
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing email or password");
        }

        await connectDB();
        // We must find the user in DB and compare password
        const userDoc = await User.findOne({ email: credentials.email }).select("+password");
        if (!userDoc) {
          throw new Error("User not found");
        }

        const isValid = await bcrypt.compare(credentials.password, userDoc.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        // Return a NextAuth-friendly user object
        return toNextAuthUser(userDoc);
      },
    }),
  ],

  // Custom pages if desired
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  callbacks: {
    /**
     * `jwt` callback runs whenever a token is created or updated.
     * We can store extra fields (like subscriptionStatus) in the token.
     */
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

      // If we just logged in (via Google or Credentials)
      if (account && user) {
        let existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          // create a new user in DB if not found
          existingUser = await User.create({
            email: user.email,
            name: user.name,
            subscriptionStatus: "free",
            createdAt: new Date(),
            savedListings: [],
          });
        }
        // Store relevant data on the token
        token.id = existingUser._id.toString();
        token.subscriptionStatus = existingUser.subscriptionStatus;
      }

      return token;
    },

    /**
     * `session` callback is called whenever a session is checked (e.g. useSession).
     * We copy data from the token to `session.user`.
     */
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (token && session.user && 'id' in session.user && 'subscriptionStatus' in session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.subscriptionStatus =
          typeof token.subscriptionStatus === "string" ? token.subscriptionStatus : "";
      }
      return session;
    },

    /**
     * `signIn` callback if you want custom logic to allow/deny sign-in
     */
    async signIn({
      user,
      account,
    }: {
      user: NextAuthUser | AdapterUser;
      account?: Account | null;
    }): Promise<boolean> {
      await connectDB();

      if (account?.provider === "google") {
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            email: user.email,
            name: user.name,
            subscriptionStatus: "free",
            createdAt: new Date(),
            savedListings: [],
          });
        }
      }
      return true; // return false to deny sign-in
    },
  },
};
