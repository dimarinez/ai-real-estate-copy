import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth'; // adjust the path as needed

// Create a route handler by passing your authOptions to NextAuth.
const handler = NextAuth(authOptions);

// Then export the handler as GET and POST for Next.js to use.
export { handler as GET, handler as POST };
