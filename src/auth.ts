import NextAuth, { type DefaultSession, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/client";

// ── Type augmentation ────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      accentColor?: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role: Role;
    accentColor?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    accentColor?: string | null;
  }
}

// ── Config ────────────────────────────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.hashedPassword || user.status !== "ACTIVE") return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
          accentColor: user.accentColor,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email;
        if (!email) return false;
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email,
              name: profile.name ?? null,
              image: (profile as { picture?: string }).picture ?? null,
              role: "STAFF",
              status: "PENDING",
              emailVerified: new Date(),
            },
          });
        }
        return dbUser.status === "ACTIVE";
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email! },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.accentColor = dbUser.accentColor;
          }
        } else {
          token.id = user.id as string;
          token.role = (user as User).role;
          token.accentColor = (user as User).accentColor;
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.accentColor = token.accentColor;
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});
