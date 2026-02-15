import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Adapter } from "next-auth/adapters";
import { db } from "@/lib/db";

function ensurePrimitiveBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return Boolean(value);
}

const baseAdapter = PrismaAdapter(db) as any;

export const CustomPrismaAdapter: Adapter = {
  ...baseAdapter,
  
  async createUser(user: any) {
    if (process.env.NODE_ENV !== "production") {
      console.log('Custom adapter creating user:', { email: user.email, emailVerified: user.emailVerified, typeofEmailVerified: typeof user.emailVerified });
    }
    
    // Ensure all boolean fields are primitive booleans
    const userData = {
      ...user,
      emailVerified: user.emailVerified !== undefined ? ensurePrimitiveBoolean(user.emailVerified) : false,
    };
    
    if (process.env.NODE_ENV !== "production") {
      console.log('Processed user data:', { emailVerified: userData.emailVerified, typeofEmailVerified: typeof userData.emailVerified });
    }
    
    return db.user.create({
      data: userData,
    }) as any;
  },
  
  async updateUser(user: any) {
    // Ensure all boolean fields are primitive booleans
    const userData = {
      ...user,
      emailVerified: user.emailVerified !== undefined ? ensurePrimitiveBoolean(user.emailVerified) : undefined,
    };
    
    // Remove undefined values
    Object.keys(userData).forEach(key => userData[key] === undefined && delete userData[key]);
    
    return db.user.update({
      where: { id: user.id },
      data: userData,
    }) as any;
  },

  // Add any other custom methods as needed
  async getUser(id) {
    return baseAdapter.getUser(id);
  },

  async getUserByEmail(email) {
    return baseAdapter.getUserByEmail(email);
  },

  async getUserByAccount({ providerAccountId, provider }) {
    return baseAdapter.getUserByAccount({ providerAccountId, provider });
  },

  async deleteUser(userId) {
    return baseAdapter.deleteUser(userId);
  },

  async linkAccount(account) {
    return baseAdapter.linkAccount(account);
  },

  async unlinkAccount({ providerAccountId, provider }) {
    return baseAdapter.unlinkAccount({ providerAccountId, provider });
  },

  async createSession(session) {
    return baseAdapter.createSession(session);
  },

  async getSessionAndUser(sessionToken) {
    return baseAdapter.getSessionAndUser(sessionToken);
  },

  async updateSession({ sessionToken, ...session }) {
    return baseAdapter.updateSession({ sessionToken, ...session });
  },

  async deleteSession(sessionToken) {
    return baseAdapter.deleteSession(sessionToken);
  },

  async createVerificationToken(token) {
    return baseAdapter.createVerificationToken(token);
  },

  async useVerificationToken({ identifier, token }) {
    return baseAdapter.useVerificationToken({ identifier, token });
  },
};