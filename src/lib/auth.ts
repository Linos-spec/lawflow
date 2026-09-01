import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyTotp, hashBackupCode } from "@/lib/mfa";

declare module "next-auth" {
  interface User {
    role: string;
    organizationId: string;
    firmId: string | null;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      organizationId: string;
      firmId: string | null;
    };
  }
}

declare module "next-auth" {
  interface JWT {
    id: string;
    role: string;
    organizationId: string;
    firmId: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        token: { label: "Two-factor code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true },
        });

        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isValid) return null;

        // Second factor — required when the user has MFA enabled.
        if (user.mfaEnabled && user.mfaSecret) {
          const code = (credentials.token as string | undefined)?.trim() || "";
          if (!code) return null; // client must resubmit with a code
          let passed = verifyTotp(code, user.mfaSecret);
          if (!passed) {
            // Try a one-time backup code, then consume it.
            const h = hashBackupCode(code);
            if (user.mfaBackupCodes.includes(h)) {
              passed = true;
              await prisma.user.update({
                where: { id: user.id },
                data: { mfaBackupCodes: user.mfaBackupCodes.filter((c) => c !== h) },
              });
            }
          }
          if (!passed) return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          firmId: user.firmId,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.firmId = user.firmId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.organizationId = token.organizationId as string;
      session.user.firmId = token.firmId as string | null;
      return session;
    },
  },
});
