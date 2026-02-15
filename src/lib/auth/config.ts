import { NextAuthOptions } from "next-auth";
import { CustomPrismaAdapter } from "./custom-adapter";
import { db } from "@/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import redis from "@/lib/redis";
import { timingSafeEqual } from "node:crypto";

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          return null;
        }

        // Handle OTP authentication (special case)
  if (credentials.password === 'otp-auth') {
          // OTP sign-in is allowed ONLY when preceded by a successful /api/auth/verify-otp call
          // which issues a short-lived one-time login token stored in Redis.
          const tokenFromClient = String((credentials as any).otpLoginToken || "");
          if (!tokenFromClient) return null;

          const loginKey = `otp:login_token:${credentials.email.toLowerCase()}`;
          const tokenFromRedis = await redis.get(loginKey);
          if (!tokenFromRedis) return null;

          // constant-time compare
          try {
            const a = Buffer.from(tokenFromRedis);
            const b = Buffer.from(tokenFromClient);
            if (a.length !== b.length) return null;
            if (!timingSafeEqual(a, b)) return null;
          } catch {
            return null;
          }

          // one-time use
          await redis.del(loginKey);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar ?? undefined,
            premiumExpires: user.premiumExpires ?? undefined,
          } as any;
        }

        // Regular password authentication
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password || ""
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar ?? undefined,
          premiumExpires: user.premiumExpires ?? undefined,
        } as any;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  events: {
    async createUser({ user }) {
      const emailVerified = (user as any).emailVerified;
      if (process.env.NODE_ENV !== "production") {
        console.log('NextAuth createUser event:', {
          email: user.email,
          emailVerified,
          typeofEmailVerified: typeof emailVerified,
        });
      }

      // Ensure emailVerified is a primitive boolean when creating users
      if (typeof emailVerified !== 'boolean') {
        if (process.env.NODE_ENV !== "production") {
          console.log('Converting emailVerified to primitive boolean:', emailVerified);
        }
        (user as any).emailVerified = Boolean(emailVerified);
        if (process.env.NODE_ENV !== "production") {
          console.log('Converted emailVerified:', (user as any).emailVerified, typeof (user as any).emailVerified);
        }
      }
    },
    async linkAccount({ user, account, profile }) {
      if (process.env.NODE_ENV !== "production") {
        console.log('NextAuth linkAccount event:', { 
          userEmail: user?.email, 
          provider: account?.provider,
          accountType: account?.type
        });
      }
    },
  async signIn({ user, account, profile }) {
      const emailVerified = (user as any)?.emailVerified;
      if (process.env.NODE_ENV !== "production") {
        console.log('NextAuth signIn event:', {
          userEmail: user?.email,
          provider: account?.provider,
          emailVerified,
          typeofEmailVerified: typeof emailVerified,
        });
      }
      
      // The custom adapter now handles proper boolean conversion
      // We can remove the manual user creation logic from here
      // but keep it as a fallback for any edge cases
      if (account && (account.provider === 'google' || account.provider === 'github')) {
        try {
          // Check if user exists
          const existingUser = await db.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            if (process.env.NODE_ENV !== "production") {
              console.log(`New OAuth user will be created by adapter: ${user.email}`);
            }
          }
        } catch (error) {
          console.error('Error checking OAuth user:', error);
          return;
        }
      }
      return;
    },
    async signOut({ token, session }) {
      // Handle sign out events if needed
    },
    async session({ session, token }) {
      // Handle session events if needed
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        return {
          ...token,
          role: user.role,
          avatar: user.avatar,
          premiumExpires: user.premiumExpires,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role,
          avatar: token.avatar,
          premiumExpires: token.premiumExpires,
        },
      };
    },
    async signIn({ user, account, profile }) {
      // Check if this is an account linking attempt
      const linkIntent = typeof window !== 'undefined' ? sessionStorage.getItem('linkAccountIntent') : null;
      
      if (account && (account.provider === 'google' || account.provider === 'github') && linkIntent) {
        try {
          // This is an account linking attempt
          // The account will be linked by the NextAuth adapter automatically
          if (process.env.NODE_ENV !== "production") {
            console.log(`Account linking attempt for ${user.email} with ${account.provider}`);
          }
          
          // Clear the intent
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('linkAccountIntent');
          }
          
          return true;
        } catch (error) {
          console.error('Error during account linking:', error);
          return false;
        }
      }
      
      // Regular sign-in logic
      if (account && (account.provider === 'google' || account.provider === 'github')) {
        try {
          // Check if user exists
          const existingUser = await db.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            if (process.env.NODE_ENV !== "production") {
              console.log(`New OAuth user will be created by adapter: ${user.email}`);
            }
          }
        } catch (error) {
          console.error('Error checking OAuth user:', error);
          return false;
        }
      }
      return true;
    },
  },
};

// Backwards-compatible export: some modules expect `authConfig`.
export const authConfig = authOptions;